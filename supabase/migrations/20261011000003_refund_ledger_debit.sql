-- Migration: 20261011000003_refund_ledger_debit.sql
-- Fixes: refund.processed webhook event only logged to payment_incidents;
-- it never debited the boma ledger, leaving the fund showing more money than it has.
--
-- This function is called by the webhook handler when a confirmed refund
-- is received from Paystack. It:
--   1. Marks the payment_intent as refunded (partial or full)
--   2. Inserts a negative ledger entry to debit the boma account
--   3. Decrements accounts.current_amount by the refund amount
--   4. Closes the payment_incident (sets status = 'resolved')
--
-- Idempotent: a second call with the same refund_id is a no-op.

CREATE OR REPLACE FUNCTION public.process_paystack_refund(
  p_reference        TEXT,    -- original payment reference (BP-...)
  p_refund_id        TEXT,    -- Paystack refund ID (idempotency key)
  p_amount_minor     BIGINT,  -- refund amount in minor units (cents)
  p_currency         TEXT,
  p_event_hash       TEXT     -- sha256 of raw webhook body
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_intent          payment_intents%ROWTYPE;
  v_account_id      UUID;
  v_already_debited BOOLEAN;
BEGIN
  -- Guard: idempotency — skip if this refund_id was already processed
  SELECT EXISTS (
    SELECT 1 FROM payment_incidents
    WHERE details->>'refund_id' = p_refund_id
      AND status = 'resolved'
  ) INTO v_already_debited;
  IF v_already_debited THEN RETURN; END IF;

  -- Load and validate payment intent
  SELECT * INTO v_intent FROM payment_intents WHERE reference = p_reference;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund: unknown payment reference %', p_reference;
  END IF;
  IF v_intent.status NOT IN ('paid', 'partially_refunded') THEN
    RAISE EXCEPTION 'Refund: intent % is in status %, cannot refund', p_reference, v_intent.status;
  END IF;
  IF p_amount_minor <= 0 OR p_amount_minor > (v_intent.amount_minor - COALESCE(v_intent.refunded_minor, 0)) THEN
    RAISE EXCEPTION 'Refund: amount % exceeds unrefunded balance on %', p_amount_minor, p_reference;
  END IF;

  -- Get the account for this boma
  SELECT id INTO v_account_id FROM accounts WHERE boma_id = v_intent.boma_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund: no account found for boma %', v_intent.boma_id;
  END IF;

  -- 1. Insert negative ledger entry
  INSERT INTO ledger_entries (account_id, boma_id, reference, entry_type, amount_minor, currency, description, created_at)
  VALUES (
    v_account_id,
    v_intent.boma_id,
    p_reference,
    'refund_debit',
    -p_amount_minor,
    p_currency,
    'Refund processed by Paystack (refund_id: ' || p_refund_id || ')',
    now()
  );

  -- 2. Decrement account balance
  UPDATE accounts
  SET current_amount = GREATEST(0, current_amount - (p_amount_minor::numeric / 100))
  WHERE id = v_account_id;

  -- 3. Update payment_intent refunded_minor and status
  UPDATE payment_intents
  SET
    refunded_minor = COALESCE(refunded_minor, 0) + p_amount_minor,
    status = CASE
      WHEN COALESCE(refunded_minor, 0) + p_amount_minor >= amount_minor THEN 'refunded'
      ELSE 'partially_refunded'
    END,
    updated_at = now()
  WHERE reference = p_reference;

  -- 4. Resolve the incident
  UPDATE payment_incidents
  SET status = 'resolved', updated_at = now()
  WHERE event_hash = p_event_hash;

END;
$$;

-- Grant execute only to service role (called from server-side webhook only)
REVOKE ALL ON FUNCTION public.process_paystack_refund(TEXT, TEXT, BIGINT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_paystack_refund(TEXT, TEXT, BIGINT, TEXT, TEXT) TO service_role;
