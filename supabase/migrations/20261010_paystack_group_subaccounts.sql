-- One Paystack settlement subaccount per organizer. Keep destination details
-- private; only the server uses the subaccount code to initialize split charges.
CREATE TABLE IF NOT EXISTS public.paystack_subaccounts (
  creator_id TEXT PRIMARY KEY,
  subaccount_code TEXT NOT NULL UNIQUE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('mpesa_till', 'mpesa_paybill')),
  destination_last4 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_verification', 'verified', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.paystack_subaccounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paystack_subaccounts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.paystack_subaccounts TO service_role;

CREATE OR REPLACE FUNCTION public.settle_paystack_payment(
  p_reference TEXT,
  p_amount_minor BIGINT,
  p_currency TEXT,
  p_channel TEXT,
  p_provider_transaction_id TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_intent public.payment_intents%ROWTYPE;
  v_boma public.bomas%ROWTYPE;
  v_account public.accounts%ROWTYPE;
  v_transaction_id UUID;
  v_amount NUMERIC(14,2);
  v_fee NUMERIC(14,2);
  v_net NUMERIC(14,2);
  v_fee_minor BIGINT;
  v_method TEXT;
BEGIN
  SELECT * INTO v_intent FROM public.payment_intents WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment intent not found'; END IF;
  IF v_intent.status = 'paid' THEN RETURN; END IF;
  IF v_intent.status <> 'pending' THEN RAISE EXCEPTION 'payment intent is no longer pending'; END IF;
  IF v_intent.amount_minor <> p_amount_minor OR v_intent.currency <> p_currency THEN RAISE EXCEPTION 'payment mismatch'; END IF;
  SELECT * INTO v_boma FROM public.bomas WHERE id = v_intent.boma_id FOR UPDATE;
  IF NOT FOUND OR v_boma.currency <> v_intent.currency THEN RAISE EXCEPTION 'fund currency mismatch'; END IF;

  v_fee_minor := COALESCE(NULLIF(v_intent.metadata->>'platform_fee_minor', '')::BIGINT, 0);
  IF v_fee_minor < 0 OR v_fee_minor >= p_amount_minor THEN RAISE EXCEPTION 'invalid platform fee'; END IF;
  v_amount := p_amount_minor::NUMERIC / 100;
  v_fee := v_fee_minor::NUMERIC / 100;
  v_net := v_amount - v_fee;
  v_method := CASE WHEN p_channel IN ('mobile_money', 'mpesa') THEN 'mpesa'
                   WHEN p_channel IN ('bank', 'bank_transfer') THEN 'bank_transfer' ELSE 'card' END;
  INSERT INTO public.accounts (boma_id, currency) VALUES (v_boma.id, v_intent.currency)
    ON CONFLICT (boma_id, currency) DO NOTHING;
  SELECT * INTO v_account FROM public.accounts WHERE boma_id = v_boma.id AND currency = v_intent.currency FOR UPDATE;

  INSERT INTO public.transactions (
    boma_id, reference, idempotency_key, contributor_name, contributor_email,
    contributor_phone, is_anonymous, amount, fee, net_amount, currency, payment_method, status, note
  ) VALUES (
    v_boma.id, p_reference, p_reference,
    COALESCE(NULLIF(v_intent.metadata->>'contributor_name', ''), 'Member'),
    v_intent.metadata->>'contributor_email', v_intent.metadata->>'contributor_phone',
    COALESCE((v_intent.metadata->>'is_anonymous')::BOOLEAN, false),
    v_amount, v_fee, v_net, v_intent.currency, v_method, 'completed', v_intent.metadata->>'note'
  ) RETURNING id INTO v_transaction_id;

  UPDATE public.accounts SET
    available_balance = available_balance + v_net,
    ledger_balance = ledger_balance + v_net,
    total_received = total_received + v_net,
    last_reconciled_at = now()
  WHERE id = v_account.id;
  UPDATE public.bomas SET current_amount = current_amount + v_net,
    contributors_count = contributors_count + 1, updated_at = now() WHERE id = v_boma.id;
  INSERT INTO public.ledger_entries (transaction_id, boma_id, entry_type, amount, currency, balance_after, description, reference_code)
    VALUES (v_transaction_id, v_boma.id, 'credit', v_net, v_intent.currency,
      v_account.ledger_balance + v_net, 'Contribution received after platform fee', p_reference);
  UPDATE public.payment_intents SET status = 'paid', provider_transaction_id = p_provider_transaction_id, paid_at = now()
    WHERE reference = p_reference;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_paystack_payment(TEXT,BIGINT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paystack_payment(TEXT,BIGINT,TEXT,TEXT,TEXT) TO service_role;
