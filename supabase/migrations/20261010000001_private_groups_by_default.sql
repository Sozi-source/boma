-- Make every group private until its organizer explicitly publishes it.
ALTER TABLE public.bomas ALTER COLUMN is_public SET DEFAULT false;
UPDATE public.bomas SET is_public = false WHERE is_public IS DISTINCT FROM false;

-- Public contribution feeds must never expose contributor contact details.
REVOKE SELECT ON public.transactions FROM anon, authenticated;
REVOKE SELECT (contributor_email, contributor_phone, idempotency_key, fee, metadata) ON public.transactions FROM anon, authenticated;
GRANT SELECT (id, boma_id, reference, contributor_name, is_anonymous, amount, net_amount, currency, payment_method, status, note, created_at)
  ON public.transactions TO anon, authenticated;

-- Remove historical permissive policies. PostgreSQL combines policies with OR.
DROP POLICY IF EXISTS "Allow public read on bomas" ON public.bomas;
DROP POLICY IF EXISTS "Public can read public bomas" ON public.bomas;
DROP POLICY IF EXISTS "Allow public read on ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Public can read ledger for public bomas" ON public.ledger_entries;
DROP POLICY IF EXISTS "Allow read on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow public read on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Public can read transactions for public bomas" ON public.transactions;
DROP POLICY IF EXISTS "Owners can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can read all transactions for own bomas" ON public.transactions;
DROP POLICY IF EXISTS "Allow public read on committees" ON public.committees;
DROP POLICY IF EXISTS "Allow read payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Allow insert payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Allow update payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Allow read disbursements" ON public.disbursements;

CREATE POLICY "Read public or owned bomas" ON public.bomas FOR SELECT
  USING (is_public OR auth.uid()::text = creator_id);
CREATE POLICY "Read ledger for public or owned bomas" ON public.ledger_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)));
CREATE POLICY "Read accounts for public or owned bomas" ON public.accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)));
CREATE POLICY "Creators read transactions for owned bomas" ON public.transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
CREATE POLICY "Read completed transactions for public bomas" ON public.transactions FOR SELECT
  USING (status = 'completed' AND EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.is_public));
CREATE POLICY "Read committees for public or owned bomas" ON public.committees FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)));
CREATE POLICY "Owners read disbursements" ON public.disbursements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
CREATE POLICY "Owners read payout requests" ON public.payout_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
CREATE POLICY "Owners create payout requests" ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
CREATE POLICY "Owners update payout requests" ON public.payout_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.creator_id = auth.uid()::text));
