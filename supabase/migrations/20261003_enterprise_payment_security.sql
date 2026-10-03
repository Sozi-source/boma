-- Server-authoritative Paystack collection and payout ledger.
-- Apply after schema.sql. Browser roles cannot write financial records.

CREATE TABLE IF NOT EXISTS public.payment_intents (
  reference TEXT PRIMARY KEY,
  boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(5) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'expired')),
  provider_transaction_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payout_intents (
  reference TEXT PRIMARY KEY,
  boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(5) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('mpesa', 'bank')),
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(50),
  recipient_bank_name VARCHAR(100),
  recipient_account_number VARCHAR(100),
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'reversed')),
  provider_transfer_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payment_rate_windows (
  key_hash TEXT PRIMARY KEY,
  window_bucket BIGINT NOT NULL,
  hits INTEGER NOT NULL CHECK (hits > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_rate_windows_updated_idx ON public.payment_rate_windows(updated_at);

CREATE TABLE IF NOT EXISTS public.payment_reversals (
  provider_refund_id TEXT PRIMARY KEY,
  payment_reference TEXT NOT NULL REFERENCES public.payment_intents(reference) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_incidents (
  event_hash TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  reference TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.ledger_entries ALTER COLUMN transaction_id DROP NOT NULL;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS payout_reference TEXT REFERENCES public.payout_intents(reference);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_exactly_one_source
  CHECK ((transaction_id IS NOT NULL) <> (payout_reference IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_one_payout_debit
  ON public.ledger_entries(payout_reference, entry_type) WHERE payout_reference IS NOT NULL;

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_rate_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reversals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_available_balance_check;
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_balance_after_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_net_amount_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_net_amount_nonnegative CHECK (net_amount >= 0);
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS refunded_minor BIGINT NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0);

-- Remove the permissive starter policies; financial writes happen only in RPCs.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profile owner can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile owner can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile owner can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read on bomas" ON public.bomas;
DROP POLICY IF EXISTS "Allow authenticated insert on bomas" ON public.bomas;
DROP POLICY IF EXISTS "Allow creators to update their bomas" ON public.bomas;
DROP POLICY IF EXISTS "Allow public read on ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Allow system insert on ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Allow public read on completed transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow insert on transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow read on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow public read on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Owners can read accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow system update on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow read disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Allow insert disbursements" ON public.disbursements;

CREATE POLICY "Profile owner can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profile owner can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profile owner can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can read public bomas" ON public.bomas
  FOR SELECT USING (is_public OR auth.uid()::text = creator_id);
CREATE POLICY "Authenticated users create own bomas" ON public.bomas
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = creator_id AND current_amount = 0 AND contributors_count = 0 AND verified = false);
CREATE POLICY "Creators update own bomas" ON public.bomas
  FOR UPDATE TO authenticated USING (auth.uid()::text = creator_id) WITH CHECK (auth.uid()::text = creator_id);
CREATE POLICY "Public can read ledger for public bomas" ON public.ledger_entries
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.is_public));
CREATE POLICY "Owners can read accounts" ON public.accounts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)));
CREATE POLICY "Owners can read transactions" ON public.transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
CREATE POLICY "Owners can read disbursements" ON public.disbursements
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));

REVOKE ALL ON public.payment_intents, public.payout_intents, public.payment_rate_windows, public.payment_reversals, public.payment_incidents FROM anon, authenticated;
REVOKE ALL ON public.profiles, public.accounts, public.transactions, public.ledger_entries, public.disbursements FROM anon, authenticated;
REVOKE ALL ON public.bomas FROM anon, authenticated;
REVOKE SELECT (creator_phone) ON public.bomas FROM anon, authenticated;
GRANT SELECT ON public.accounts, public.ledger_entries TO anon, authenticated;
GRANT SELECT ON public.transactions, public.disbursements TO authenticated;
GRANT SELECT (id,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at) ON public.bomas TO authenticated;
GRANT INSERT ON public.bomas TO authenticated;
GRANT UPDATE (title,description,category,target_amount,status,deadline,image_url,is_public,creator_name,creator_phone) ON public.bomas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
UPDATE public.ledger_entries SET description = CASE WHEN entry_type = 'credit' THEN 'Contribution received' ELSE 'Disbursement completed' END;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'profile role cannot be changed by the user'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_role_is_immutable ON public.profiles;
CREATE TRIGGER profiles_role_is_immutable BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

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
  v_method TEXT;
BEGIN
  SELECT * INTO v_intent FROM public.payment_intents WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment intent not found'; END IF;
  IF v_intent.status = 'paid' THEN RETURN; END IF;
  IF v_intent.status <> 'pending' THEN RAISE EXCEPTION 'payment intent is no longer pending'; END IF;
  IF v_intent.amount_minor <> p_amount_minor OR v_intent.currency <> p_currency THEN RAISE EXCEPTION 'payment mismatch'; END IF;
  SELECT * INTO v_boma FROM public.bomas WHERE id = v_intent.boma_id FOR UPDATE;
  IF NOT FOUND OR v_boma.currency <> v_intent.currency THEN RAISE EXCEPTION 'fund currency mismatch'; END IF;

  v_amount := p_amount_minor::NUMERIC / 100;
  v_method := CASE WHEN p_channel IN ('mobile_money', 'mpesa') THEN 'mpesa'
                   WHEN p_channel IN ('bank', 'bank_transfer') THEN 'bank_transfer' ELSE 'card' END;
  INSERT INTO public.accounts (boma_id, currency) VALUES (v_boma.id, v_intent.currency)
    ON CONFLICT (boma_id, currency) DO NOTHING;
  SELECT * INTO v_account FROM public.accounts WHERE boma_id = v_boma.id AND currency = v_intent.currency FOR UPDATE;

  INSERT INTO public.transactions (
    boma_id, reference, idempotency_key, contributor_name, contributor_email,
    contributor_phone, is_anonymous, amount, net_amount, currency, payment_method, status, note
  ) VALUES (
    v_boma.id, p_reference, p_reference,
    COALESCE(NULLIF(v_intent.metadata->>'contributor_name', ''), 'Member'),
    v_intent.metadata->>'contributor_email', v_intent.metadata->>'contributor_phone',
    COALESCE((v_intent.metadata->>'is_anonymous')::BOOLEAN, false),
    v_amount, v_amount, v_intent.currency, v_method, 'completed', v_intent.metadata->>'note'
  ) RETURNING id INTO v_transaction_id;

  UPDATE public.accounts SET
    available_balance = available_balance + v_amount,
    ledger_balance = ledger_balance + v_amount,
    total_received = total_received + v_amount,
    last_reconciled_at = now()
  WHERE id = v_account.id;
  UPDATE public.bomas SET current_amount = current_amount + v_amount,
    contributors_count = contributors_count + 1, updated_at = now() WHERE id = v_boma.id;
  INSERT INTO public.ledger_entries (transaction_id, boma_id, entry_type, amount, currency, balance_after, description, reference_code)
    VALUES (v_transaction_id, v_boma.id, 'credit', v_amount, v_intent.currency,
      v_account.ledger_balance + v_amount, 'Contribution received', p_reference);
  UPDATE public.payment_intents SET status = 'paid', provider_transaction_id = p_provider_transaction_id, paid_at = now()
    WHERE reference = p_reference;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_paystack_payout(
  p_reference TEXT, p_boma_id UUID, p_actor_id UUID, p_amount_minor BIGINT, p_currency TEXT,
  p_recipient_type TEXT, p_recipient_name TEXT, p_recipient_phone TEXT,
  p_recipient_bank_name TEXT, p_recipient_account_number TEXT, p_purpose TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_boma public.bomas%ROWTYPE; v_account public.accounts%ROWTYPE; v_amount NUMERIC(14,2);
BEGIN
  IF p_amount_minor < 100 OR p_amount_minor > 1000000000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  SELECT * INTO v_boma FROM public.bomas WHERE id = p_boma_id AND creator_id = p_actor_id::text FOR UPDATE;
  IF NOT FOUND OR v_boma.status NOT IN ('active', 'funded') OR v_boma.currency <> p_currency THEN RAISE EXCEPTION 'not authorized for this fund'; END IF;
  v_amount := p_amount_minor::NUMERIC / 100;
  SELECT * INTO v_account FROM public.accounts WHERE boma_id = p_boma_id AND currency = p_currency FOR UPDATE;
  IF NOT FOUND OR v_account.available_balance < v_amount THEN RAISE EXCEPTION 'insufficient available balance'; END IF;
  UPDATE public.accounts SET available_balance = available_balance - v_amount WHERE id = v_account.id;
  INSERT INTO public.payout_intents (reference,boma_id,requested_by,amount_minor,currency,recipient_type,
    recipient_name,recipient_phone,recipient_bank_name,recipient_account_number,purpose,status)
  VALUES (p_reference,p_boma_id,p_actor_id,p_amount_minor,p_currency,p_recipient_type,
    left(p_recipient_name,255),p_recipient_phone,p_recipient_bank_name,p_recipient_account_number,left(p_purpose,500),'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_payment_rate_limit(p_key_hash TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_bucket BIGINT; v_hits INTEGER;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR length(p_key_hash) <> 64 THEN RETURN false; END IF;
  DELETE FROM public.payment_rate_windows WHERE updated_at < now() - interval '2 days';
  v_bucket := floor(extract(epoch FROM now()) / p_window_seconds)::BIGINT;
  INSERT INTO public.payment_rate_windows(key_hash,window_bucket,hits,updated_at)
    VALUES (p_key_hash,v_bucket,1,now())
  ON CONFLICT (key_hash) DO UPDATE SET
    window_bucket = EXCLUDED.window_bucket,
    hits = CASE WHEN payment_rate_windows.window_bucket = EXCLUDED.window_bucket THEN payment_rate_windows.hits + 1 ELSE 1 END,
    updated_at = now()
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_paystack_payment(
  p_reference TEXT, p_provider_refund_id TEXT, p_amount_minor BIGINT, p_currency TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_intent public.payment_intents%ROWTYPE; v_account public.accounts%ROWTYPE;
  v_transaction public.transactions%ROWTYPE; v_amount NUMERIC(14,2); v_balance NUMERIC(14,2); v_refunded BIGINT;
BEGIN
  SELECT * INTO v_intent FROM public.payment_intents WHERE reference=p_reference FOR UPDATE;
  IF NOT FOUND OR v_intent.status <> 'paid' THEN RAISE EXCEPTION 'paid payment not found'; END IF;
  IF p_amount_minor <= 0 OR p_currency <> v_intent.currency THEN RAISE EXCEPTION 'refund mismatch'; END IF;
  IF EXISTS (SELECT 1 FROM public.payment_reversals WHERE provider_refund_id=p_provider_refund_id) THEN RETURN; END IF;
  IF v_intent.refunded_minor + p_amount_minor > v_intent.amount_minor THEN RAISE EXCEPTION 'refund exceeds payment amount'; END IF;
  INSERT INTO public.payment_reversals(provider_refund_id,payment_reference,amount_minor,currency)
    VALUES (p_provider_refund_id,p_reference,p_amount_minor,p_currency) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_transaction FROM public.transactions WHERE reference=p_reference FOR UPDATE;
  SELECT * INTO v_account FROM public.accounts WHERE boma_id=v_intent.boma_id AND currency=p_currency FOR UPDATE;
  IF NOT FOUND OR v_transaction.id IS NULL THEN RAISE EXCEPTION 'payment ledger records not found'; END IF;
  v_amount := p_amount_minor::NUMERIC / 100;
  v_balance := v_account.ledger_balance - v_amount;
  v_refunded := v_intent.refunded_minor + p_amount_minor;
  UPDATE public.accounts SET available_balance=available_balance-v_amount, ledger_balance=v_balance,
    last_reconciled_at=now() WHERE id=v_account.id;
  INSERT INTO public.ledger_entries(transaction_id,boma_id,entry_type,amount,currency,balance_after,description,reference_code)
    VALUES (v_transaction.id,v_intent.boma_id,'debit',v_amount,p_currency,v_balance,'Contribution refund processed',p_provider_refund_id);
  UPDATE public.payment_intents SET refunded_minor=v_refunded WHERE reference=p_reference;
  UPDATE public.transactions SET net_amount=(amount - v_refunded::NUMERIC / 100),
    status=CASE WHEN v_refunded=v_intent.amount_minor THEN 'reversed' ELSE 'completed' END
    WHERE id=v_transaction.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_paystack_payout(p_reference TEXT, p_outcome TEXT, p_transfer_code TEXT DEFAULT NULL,
  p_amount_minor BIGINT DEFAULT NULL, p_currency TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_payout public.payout_intents%ROWTYPE; v_account public.accounts%ROWTYPE; v_amount NUMERIC(14,2); v_balance NUMERIC(14,2);
BEGIN
  SELECT * INTO v_payout FROM public.payout_intents WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payout not found'; END IF;
  IF p_outcome NOT IN ('success','failed','reversed') THEN RAISE EXCEPTION 'invalid payout outcome'; END IF;
  IF p_amount_minor IS DISTINCT FROM v_payout.amount_minor OR p_currency IS DISTINCT FROM v_payout.currency THEN RAISE EXCEPTION 'transfer mismatch'; END IF;
  v_amount := v_payout.amount_minor::NUMERIC / 100;
  SELECT * INTO v_account FROM public.accounts WHERE boma_id = v_payout.boma_id AND currency = v_payout.currency FOR UPDATE;
  IF p_outcome = 'success' AND v_payout.status = 'pending' THEN
    v_balance := v_account.ledger_balance - v_amount;
    IF v_balance < 0 THEN RAISE EXCEPTION 'ledger balance underflow'; END IF;
    UPDATE public.accounts SET ledger_balance = v_balance, total_disbursed = total_disbursed + v_amount,
      last_reconciled_at = now() WHERE id = v_account.id;
    INSERT INTO public.disbursements (boma_id,requested_by,amount,currency,recipient_type,recipient_phone,
      recipient_bank_name,recipient_account_number,recipient_name,purpose,status,reference,disbursed_at)
    VALUES (v_payout.boma_id,v_payout.requested_by::text,v_amount,v_payout.currency,v_payout.recipient_type,
      v_payout.recipient_phone,v_payout.recipient_bank_name,v_payout.recipient_account_number,
      v_payout.recipient_name,v_payout.purpose,'disbursed',p_reference,now());
    INSERT INTO public.ledger_entries (payout_reference,boma_id,entry_type,amount,currency,balance_after,description,reference_code)
      VALUES (p_reference,v_payout.boma_id,'debit',v_amount,v_payout.currency,v_balance,'Disbursement completed',p_reference);
    UPDATE public.payout_intents SET status='paid',provider_transfer_code=p_transfer_code,settled_at=now() WHERE reference=p_reference;
  ELSIF p_outcome = 'failed' AND v_payout.status = 'pending' THEN
    UPDATE public.accounts SET available_balance = available_balance + v_amount WHERE id = v_account.id;
    UPDATE public.payout_intents SET status='failed',provider_transfer_code=p_transfer_code,settled_at=now() WHERE reference=p_reference;
  ELSIF p_outcome = 'reversed' AND v_payout.status = 'paid' THEN
    UPDATE public.accounts SET available_balance = available_balance + v_amount,
      ledger_balance = ledger_balance + v_amount, total_disbursed = total_disbursed - v_amount WHERE id = v_account.id;
    INSERT INTO public.ledger_entries (payout_reference,boma_id,entry_type,amount,currency,balance_after,description,reference_code)
      VALUES (p_reference,v_payout.boma_id,'credit',v_amount,v_payout.currency,v_account.ledger_balance + v_amount,'Payout reversed by payment provider',p_reference || '-REV');
    UPDATE public.disbursements SET status='rejected' WHERE reference=p_reference;
    UPDATE public.payout_intents SET status='reversed',provider_transfer_code=p_transfer_code,settled_at=now() WHERE reference=p_reference;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_paystack_payment(TEXT,BIGINT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_paystack_payout(TEXT,UUID,UUID,BIGINT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_payment_rate_limit(TEXT,INTEGER,INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reverse_paystack_payment(TEXT,TEXT,BIGINT,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_paystack_payout(TEXT,TEXT,TEXT,BIGINT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paystack_payment(TEXT,BIGINT,TEXT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_paystack_payout(TEXT,UUID,UUID,BIGINT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_payment_rate_limit(TEXT,INTEGER,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.reverse_paystack_payment(TEXT,TEXT,BIGINT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_paystack_payout(TEXT,TEXT,TEXT,BIGINT,TEXT) TO service_role;

-- Automatically create the financial account when a fund is created.
CREATE OR REPLACE FUNCTION public.create_boma_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.accounts (boma_id,currency) VALUES (NEW.id,NEW.currency) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS create_account_for_boma ON public.bomas;
CREATE TRIGGER create_account_for_boma AFTER INSERT ON public.bomas
  FOR EACH ROW EXECUTE FUNCTION public.create_boma_account();

-- Keep SECURITY DEFINER signup code pinned to a trusted search path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Refuse to invent opening balances during deployment. Existing money must
-- already reconcile to immutable ledger entries before this migration proceeds.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.bomas b
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(CASE WHEN l.entry_type='credit' THEN l.amount ELSE -l.amount END),0) AS balance
      FROM public.ledger_entries l WHERE l.boma_id=b.id
    ) x ON true
    WHERE b.current_amount <> x.balance
  ) THEN
    RAISE EXCEPTION 'Existing Boma totals do not reconcile to ledger_entries; reconcile historical funds before applying this migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.accounts a
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(CASE WHEN l.entry_type='credit' THEN l.amount ELSE -l.amount END),0) AS balance
      FROM public.ledger_entries l WHERE l.boma_id=a.boma_id AND l.currency=a.currency
    ) x ON true
    WHERE a.ledger_balance <> x.balance OR a.available_balance > a.ledger_balance
  ) THEN
    RAISE EXCEPTION 'Existing account balances do not reconcile to ledger_entries; reconcile historical funds before applying this migration';
  END IF;
END;
$$;

INSERT INTO public.accounts (boma_id,currency,available_balance,ledger_balance,total_received)
SELECT b.id,b.currency,0,0,0
FROM public.bomas b
WHERE NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.boma_id=b.id AND a.currency=b.currency);
