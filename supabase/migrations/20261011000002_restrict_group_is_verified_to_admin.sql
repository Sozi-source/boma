-- Migration: 20261011000002_restrict_group_is_verified_to_admin.sql
-- Fixes: organizers could self-set is_verified = true via the broad FOR ALL policy.
-- Strategy: use a BEFORE UPDATE trigger to reject any attempt to change is_verified
-- or organizer_id from a non-service-role session. This is resilient to column set
-- differences and works regardless of which GRANT is in place.

-- 1. Trigger function: block is_verified and organizer_id mutation by normal users
CREATE OR REPLACE FUNCTION public.prevent_group_verification_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Allow service_role (used by admin API and edge functions) to change anything
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Block any attempt to change is_verified
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'is_verified can only be set by the platform administrator';
  END IF;
  -- Block any attempt to reassign the group to a different organizer
  IF NEW.organizer_id IS DISTINCT FROM OLD.organizer_id THEN
    RAISE EXCEPTION 'organizer_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS groups_no_self_verification ON public.groups;
CREATE TRIGGER groups_no_self_verification
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.prevent_group_verification_escalation();

-- 2. Split the broad FOR ALL policy into explicit per-operation policies
--    so DELETE is also blocked for authenticated users.
DROP POLICY IF EXISTS "Organizers can manage own group" ON public.groups;
DROP POLICY IF EXISTS "Public can view verified groups" ON public.groups;
DROP POLICY IF EXISTS "Organizers can read own group" ON public.groups;
DROP POLICY IF EXISTS "Organizers can insert own group" ON public.groups;
DROP POLICY IF EXISTS "Organizers can update own group" ON public.groups;

-- SELECT: public explore — everyone can read
CREATE POLICY "Organizers can read own group" ON public.groups
  FOR SELECT USING (true);

-- INSERT: organizer may only insert their own group
CREATE POLICY "Organizers can insert own group" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());

-- UPDATE: organizer may only update their own group (trigger blocks is_verified / organizer_id)
CREATE POLICY "Organizers can update own group" ON public.groups
  FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- No DELETE policy = DELETE is blocked for authenticated role.
