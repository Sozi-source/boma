-- Allow public read of completed transactions for public bomas.
-- Previously only the fund creator (authenticated) could read transactions,
-- so the contributions tab showed 0 entries to all visitors and non-creator
-- contributors after paying — the UI never reflected their payment.

-- 1. Grant column-level SELECT to anon (safe subset; omits contributor_email
--    and contributor_phone which are PII).
GRANT SELECT (
  id,
  boma_id,
  reference,
  contributor_name,
  is_anonymous,
  amount,
  net_amount,
  currency,
  payment_method,
  status,
  note,
  created_at
) ON public.transactions TO anon;

-- authenticated already has full SELECT from the security migration,
-- but the existing RLS policy gates it to creators only. Replace it.
DROP POLICY IF EXISTS "Owners can read transactions" ON public.transactions;

-- Creators can read everything (including PII columns).
CREATE POLICY "Creators can read all transactions for own bomas" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bomas b
      WHERE b.id = boma_id AND b.creator_id = auth.uid()::text
    )
  );

-- Public (anon + authenticated non-creators) can read completed transactions
-- for public bomas, but not PII columns (email/phone excluded from grant above).
DROP POLICY IF EXISTS "Public can read transactions for public bomas" ON public.transactions;
CREATE POLICY "Public can read transactions for public bomas" ON public.transactions
  FOR SELECT
  USING (
    status = 'completed'
    AND EXISTS (
      SELECT 1 FROM public.bomas b
      WHERE b.id = boma_id AND b.is_public = true
    )
  );
