-- Group records and contribution details are available only after sign-in.
-- Payment initialization and verification run through server routes, so public
-- directory browsing does not need anonymous database reads.
REVOKE SELECT ON public.bomas, public.accounts, public.ledger_entries, public.committees
  FROM anon;
REVOKE SELECT ON public.transactions FROM anon;
REVOKE SELECT (
  id, title, slug, description, category, target_amount, current_amount, currency,
  creator_id, creator_name, status, deadline, image_url, is_public,
  contributors_count, verified, created_at, updated_at
) ON public.bomas FROM anon;
REVOKE SELECT (
  id, boma_id, reference, contributor_name, is_anonymous, amount, net_amount,
  currency, payment_method, status, note, created_at
) ON public.transactions FROM anon;

DROP POLICY IF EXISTS "Read public or owned bomas" ON public.bomas;
CREATE POLICY "Authenticated users read public or owned bomas" ON public.bomas
  FOR SELECT TO authenticated
  USING (is_public OR auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "Read ledger for public or owned bomas" ON public.ledger_entries;
CREATE POLICY "Authenticated users read ledger for public or owned bomas" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bomas b
    WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)
  ));

DROP POLICY IF EXISTS "Read accounts for public or owned bomas" ON public.accounts;
CREATE POLICY "Authenticated users read accounts for public or owned bomas" ON public.accounts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bomas b
    WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)
  ));

DROP POLICY IF EXISTS "Read committees for public or owned bomas" ON public.committees;
CREATE POLICY "Authenticated users read committees for public or owned bomas" ON public.committees
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bomas b
    WHERE b.id = boma_id AND (b.is_public OR b.creator_id = auth.uid()::text)
  ));

DROP POLICY IF EXISTS "Read completed transactions for public bomas" ON public.transactions;
CREATE POLICY "Authenticated users read completed transactions for public bomas" ON public.transactions
  FOR SELECT TO authenticated
  USING (status = 'completed' AND EXISTS (
    SELECT 1 FROM public.bomas b WHERE b.id = boma_id AND b.is_public
  ));
