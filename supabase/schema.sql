-- ==========================================================
-- BOMA — FINTECH ARCHITECTURE POSTGRESQL SCHEMA v2
-- Profiles, Auth Linkage, Double-entry ledger, and Audit trail
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

-- 2. BOMAS (Michango / Group Pools)
CREATE TABLE IF NOT EXISTS public.bomas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('medical', 'education', 'chama', 'funeral', 'wedding', 'community', 'emergency', 'business')),
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

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Bomas: Public read for public michango or creator
CREATE POLICY "Allow public read on bomas" ON public.bomas
    FOR SELECT USING (is_public = true OR auth.uid()::text = creator_id);

CREATE POLICY "Allow authenticated insert on bomas" ON public.bomas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow creators to update their bomas" ON public.bomas
    FOR UPDATE USING (auth.uid()::text = creator_id);

-- Ledger: 100% Public Transparency
CREATE POLICY "Allow public read on ledger entries" ON public.ledger_entries
    FOR SELECT USING (true);

CREATE POLICY "Allow system insert on ledger entries" ON public.ledger_entries
    FOR INSERT WITH CHECK (true);

-- Transactions: Public read for completed transactions
CREATE POLICY "Allow public read on completed transactions" ON public.transactions
    FOR SELECT USING (status = 'completed');

CREATE POLICY "Allow insert on transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

-- Accounts access
CREATE POLICY "Allow read on accounts" ON public.accounts
    FOR SELECT USING (true);

CREATE POLICY "Allow system update on accounts" ON public.accounts
    FOR ALL USING (true);

-- Disbursements access
CREATE POLICY "Allow read disbursements" ON public.disbursements
    FOR SELECT USING (true);

CREATE POLICY "Allow insert disbursements" ON public.disbursements
    FOR INSERT WITH CHECK (true);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
