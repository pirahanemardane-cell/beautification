-- 069: Block self-service privilege escalation via profiles.role
-- Root cause: profiles_update_own / profiles_insert_own allowed any column,
-- including role, so a signed-in user could UPDATE role → admin via the anon key.
-- Fix: only service_role may set or change role; authenticated writes force customer
-- on INSERT and reject role changes on UPDATE. Apply in Supabase SQL Editor if needed.

CREATE OR REPLACE FUNCTION public.profiles_enforce_role_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass only for the service role (admin APIs / server upserts).
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'customer';
    RETURN NEW;
  END IF;

  -- UPDATE: never allow role mutation for JWT / anon callers (including admins
  -- using the user-scoped client). Role changes go through service_role only.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_enforce_role ON public.profiles;
CREATE TRIGGER tr_profiles_enforce_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_enforce_role_immutable();

-- Tighten RLS: own INSERT may only create customer; own UPDATE cannot change role.
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'customer');

-- Own UPDATE still allowed for non-role columns; role immutability is enforced
-- by tr_profiles_enforce_role (subquery WITH CHECK on same row is unreliable).
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin ALL policy stays for SELECT/etc.; role writes still blocked by trigger
-- unless the caller is service_role (which bypasses RLS and is allowed by trigger).
COMMENT ON FUNCTION public.profiles_enforce_role_immutable() IS
  'Prevents non-service_role callers from setting or changing profiles.role (anti self-promotion).';
