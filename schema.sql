-- ==========================================================
-- BOMA — FINTECH ARCHITECTURE POSTGRESQL SCHEMA v2
-- Profiles, Auth Linkage, Double-entry Ledger, Multi-sig Governance
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES (Linked directly to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('organizer', 'contributor', 'admin', 'auditor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BOMAS (Contributions / Group Pools)
CREATE TABLE IF NOT EXISTS public.bomas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('medical', 'education', 'chama', 'funeral', 'wedding', 'community', 'emergency', 'business', 'family', 'housing', 'food', 'travel', 'religious', 'sports', 'technology', 'other')),
    target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    creator_id TEXT NOT NULL,
    creator_name VARCHAR(255) NOT NULL,
    creator_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'funded', 'closed', 'paused')),
    deadline TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    contributors_count INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ACCOUNTS (Wallet / Pool Financial Balances)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE CASCADE,
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    ledger_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_received NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_disbursed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    last_reconciled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_boma_currency UNIQUE (boma_id, currency)
);

-- 4. TRANSACTIONS (Financial Contribution Records)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE CASCADE,
    reference VARCHAR(50) NOT NULL UNIQUE,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    contributor_name VARCHAR(255) NOT NULL,
    contributor_email VARCHAR(255),
    contributor_phone VARCHAR(50),
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0),
    net_amount NUMERIC(14, 2) NOT NULL CHECK (net_amount > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('mpesa', 'card', 'bank_transfer', 'mock_wallet')),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    note TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. LEDGER ENTRIES (Double-entry Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE CASCADE,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    balance_after NUMERIC(14, 2) NOT NULL CHECK (balance_after >= 0),
    description TEXT NOT NULL,
    reference_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. DISBURSEMENTS (Payout / Withdrawal Requests)
CREATE TABLE IF NOT EXISTS public.disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('mpesa', 'bank')),
    recipient_phone VARCHAR(50),
    recipient_bank_name VARCHAR(100),
    recipient_account_number VARCHAR(100),
    recipient_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'rejected')),
    reference VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    disbursed_at TIMESTAMPTZ
);

-- 7. COMMITTEES (Multi-Sig Governance & Approval Thresholds)
CREATE TABLE IF NOT EXISTS public.committees (
    boma_id UUID PRIMARY KEY REFERENCES public.bomas(id) ON DELETE CASCADE,
    threshold INTEGER NOT NULL DEFAULT 1 CHECK (threshold >= 1),
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. PAYOUT REQUESTS (Multi-Sig Approval Voting & Audit Queue)
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boma_id UUID NOT NULL REFERENCES public.bomas(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'KES',
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('mpesa', 'bank')),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    recipient_bank_name VARCHAR(100),
    recipient_account_number VARCHAR(100),
    purpose TEXT NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'rejected')),
    approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
    disbursement_reference VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_bomas_category ON public.bomas(category);
CREATE INDEX IF NOT EXISTS idx_bomas_status ON public.bomas(status);
CREATE INDEX IF NOT EXISTS idx_bomas_creator_id ON public.bomas(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_boma_id ON public.transactions(boma_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_boma_id ON public.ledger_entries(boma_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disbursements_boma_id ON public.disbursements(boma_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_boma_id ON public.payout_requests(boma_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profile owner can read own profile" ON public.profiles;
CREATE POLICY "Profile owner can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Bomas: Public read for public funds or creator
DROP POLICY IF EXISTS "Allow public read on bomas" ON public.bomas;
CREATE POLICY "Allow public read on bomas" ON public.bomas
    FOR SELECT USING (is_public = true OR auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "Allow authenticated insert on bomas" ON public.bomas;
CREATE POLICY "Allow authenticated insert on bomas" ON public.bomas
    FOR INSERT TO authenticated WITH CHECK (
      auth.uid()::text = creator_id AND current_amount = 0 AND contributors_count = 0 AND verified = false
    );

DROP POLICY IF EXISTS "Allow creators to update their bomas" ON public.bomas;
CREATE POLICY "Allow creators to update their bomas" ON public.bomas
    FOR UPDATE TO authenticated USING (auth.uid()::text = creator_id)
    WITH CHECK (auth.uid()::text = creator_id);

-- Ledger: 100% Public Transparency
DROP POLICY IF EXISTS "Allow public read on ledger entries" ON public.ledger_entries;
CREATE POLICY "Allow public read on ledger entries" ON public.ledger_entries
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.is_public));

-- Transactions: Public read for completed transactions
DROP POLICY IF EXISTS "Owners can read transactions" ON public.transactions;
CREATE POLICY "Owners can read transactions" ON public.transactions
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text)
    );

-- Accounts access
DROP POLICY IF EXISTS "Allow public read on accounts" ON public.accounts;
CREATE POLICY "Allow public read on accounts" ON public.accounts
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)
    ));

-- Disbursements access
DROP POLICY IF EXISTS "Allow read disbursements" ON public.disbursements;
CREATE POLICY "Allow read disbursements" ON public.disbursements
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text)
    );

-- Committees access
DROP POLICY IF EXISTS "Allow public read on committees" ON public.committees;
CREATE POLICY "Allow public read on committees" ON public.committees
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)));

DROP POLICY IF EXISTS "Allow manage committee" ON public.committees;
CREATE POLICY "Allow manage committee" ON public.committees
    FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text)
    );

-- Payout requests access
DROP POLICY IF EXISTS "Allow read payout requests" ON public.payout_requests;
CREATE POLICY "Allow read payout requests" ON public.payout_requests
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.creator_id = auth.uid()::text OR b.is_public))
    );

DROP POLICY IF EXISTS "Allow insert payout requests" ON public.payout_requests;
CREATE POLICY "Allow insert payout requests" ON public.payout_requests
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id)
    );

DROP POLICY IF EXISTS "Allow update payout requests" ON public.payout_requests;
CREATE POLICY "Allow update payout requests" ON public.payout_requests
    FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id)
    );

-- Grants
REVOKE ALL ON public.profiles, public.accounts, public.transactions, public.ledger_entries, public.disbursements, public.committees, public.payout_requests FROM anon, authenticated;
REVOKE ALL ON public.bomas FROM anon, authenticated;
GRANT SELECT (id,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at) ON public.bomas TO anon, authenticated;
GRANT INSERT ON public.bomas TO authenticated;
GRANT UPDATE (title,description,category,target_amount,status,deadline,image_url,is_public,creator_name,creator_phone) ON public.bomas TO authenticated;
GRANT SELECT ON public.accounts, public.ledger_entries, public.committees TO anon, authenticated;
GRANT SELECT ON public.transactions, public.disbursements, public.payout_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.committees, public.payout_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Prevent role escalation trigger
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

-- ==========================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
