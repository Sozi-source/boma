-- Migration: 20261011000004_payout_votes_multisig.sql
-- Replaces localStorage committee voting with server-enforced quorum.
-- payout_votes records each committee member's vote.
-- check_payout_quorum() is called by the transfer API before initiating a payout.

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payout_votes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID        NOT NULL REFERENCES public.payout_requests(id) ON DELETE CASCADE,
  voter_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote              TEXT        NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payout_request_id, voter_id)   -- one vote per member per request
);

ALTER TABLE public.payout_votes ENABLE ROW LEVEL SECURITY;

-- Members may read votes on requests for bomas they belong to
CREATE POLICY "Members can read votes" ON public.payout_votes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.payout_requests pr
      JOIN public.bomas b ON b.id = pr.boma_id
      WHERE pr.id = payout_request_id
        AND (b.creator_id = auth.uid()::text
             OR EXISTS (SELECT 1 FROM public.committees c WHERE c.boma_id = b.id AND c.members @> jsonb_build_array(auth.uid()::text)))
    )
  );

-- Members may cast their own vote
CREATE POLICY "Members can cast vote" ON public.payout_votes
  FOR INSERT TO authenticated WITH CHECK (voter_id = auth.uid());

-- No UPDATE or DELETE — votes are immutable once cast

GRANT SELECT, INSERT ON public.payout_votes TO authenticated;

-- ── Quorum check function ────────────────────────────────────────────────────
-- Returns TRUE when approve_votes >= committee threshold AND no reject vote exists.
-- Called by the transfer API route before initiating the Paystack transfer.
CREATE OR REPLACE FUNCTION public.check_payout_quorum(p_payout_request_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_boma_id     UUID;
  v_threshold   INT;
  v_approvals   INT;
  v_rejections  INT;
BEGIN
  -- Resolve boma and threshold
  SELECT pr.boma_id INTO v_boma_id
  FROM payout_requests pr WHERE pr.id = p_payout_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found: %', p_payout_request_id;
  END IF;

  SELECT COALESCE(c.threshold, 1) INTO v_threshold
  FROM committees c WHERE c.boma_id = v_boma_id;
  -- If no committee is configured, default threshold = 1 (organizer alone is enough)
  IF NOT FOUND THEN v_threshold := 1; END IF;

  SELECT
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*) FILTER (WHERE vote = 'reject')
  INTO v_approvals, v_rejections
  FROM payout_votes WHERE payout_request_id = p_payout_request_id;

  -- Any rejection blocks the payout
  IF v_rejections > 0 THEN RETURN FALSE; END IF;

  RETURN v_approvals >= v_threshold;
END;
$$;

REVOKE ALL ON FUNCTION public.check_payout_quorum(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_payout_quorum(UUID) TO service_role;

-- ── Index ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payout_votes_request ON public.payout_votes(payout_request_id);
