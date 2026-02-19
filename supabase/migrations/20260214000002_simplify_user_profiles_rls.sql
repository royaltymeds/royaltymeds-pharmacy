-- Simplify and fix RLS policies for user_profiles
-- Date: February 14, 2026
-- Purpose: Fix patient read access to their own profile with simpler, more direct policies

-- Drop all existing SELECT policies to start fresh
DROP POLICY IF EXISTS "patients_read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "doctors_read_linked_patient_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_all_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_create_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.user_profiles;

-- Simplified SELECT policy for everyone - patients read their own, doctors read linked, admins read all
CREATE POLICY "user_profiles_select_v2" ON public.user_profiles
  FOR SELECT
  USING (
    -- Patient can read their own profile
    user_id = auth.uid()
    -- Doctor can read their linked patient profiles
    OR user_id IN (
      SELECT patient_id FROM public.doctor_patient_links WHERE doctor_id = auth.uid()
    )
    -- Admin can read all
    OR (
      SELECT role FROM public.users WHERE id = auth.uid()
    ) = 'admin'
  );

-- INSERT policy - users can create their own profile
CREATE POLICY "user_profiles_insert_v2" ON public.user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy - users can update their own profile
CREATE POLICY "user_profiles_update_v2" ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy - users can delete their own profile
CREATE POLICY "user_profiles_delete_v2" ON public.user_profiles
  FOR DELETE
  USING (user_id = auth.uid());
