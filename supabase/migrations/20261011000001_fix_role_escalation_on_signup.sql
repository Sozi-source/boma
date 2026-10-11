-- Migration: 20261011000001_fix_role_escalation_on_signup.sql
-- Fixes: handle_new_user() trigger accepted 'role' from raw_user_meta_data,
-- allowing any user to self-assign admin/superadmin at signup.
-- Fix: always defaults to 'organizer' regardless of what the client sends.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_group_name TEXT;
  v_group_slug TEXT;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_phone     := new.raw_user_meta_data->>'phone';
  v_group_name := COALESCE(new.raw_user_meta_data->>'group_name', v_full_name || '''s Group');
  v_group_slug := lower(regexp_replace(v_group_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(new.id::text from 1 for 6);

  -- 1. Create Profile — role is ALWAYS 'organizer' at signup, never from client metadata
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role)
  VALUES (
    new.id,
    v_full_name,
    new.email,
    v_phone,
    new.raw_user_meta_data->>'avatar_url',
    'organizer'   -- hardcoded: clients cannot self-escalate to admin/superadmin
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create initial group for every new organizer
  INSERT INTO public.groups (name, slug, group_type, organizer_id, organizer_name, organizer_phone)
  VALUES (
    v_group_name,
    v_group_slug,
    COALESCE(new.raw_user_meta_data->>'group_type', 'chama'),
    new.id,
    v_full_name,
    v_phone
  )
  ON CONFLICT (slug) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
