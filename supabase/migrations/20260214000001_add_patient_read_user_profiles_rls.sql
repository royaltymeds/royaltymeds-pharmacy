-- Add explicit READ policy for patients to access their own user_profiles record
-- Date: February 14, 2026
-- Purpose: Ensure patients can read their own profile information from user_profiles table

-- Drop the existing consolidated policy to rebuild it with clearer intent
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;

-- Create separate, explicit policies for clarity and debugging

-- Policy 1: Patients can view their own profile
CREATE POLICY "patients_read_own_profile" ON public.user_profiles
  FOR SELECT
  USING (
    -- User can view their own profile
    user_id = (select auth.uid())
  );

-- Policy 2: Doctors can view their linked patients' profiles
CREATE POLICY "doctors_read_linked_patient_profiles" ON public.user_profiles
  FOR SELECT
  USING (
    user_id IN (
      SELECT patient_id FROM public.doctor_patient_links 
      WHERE doctor_id = (select auth.uid())
    )
  );

-- Policy 3: Admins can view all profiles
CREATE POLICY "admins_read_all_profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- Create INSERT policy for profile updates (used during signup and profile creation)
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;

CREATE POLICY "users_create_own_profile" ON public.user_profiles
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Create UPDATE policy for profile updates
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;

CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Create DELETE policy (users can delete their own profile)
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

CREATE POLICY "users_delete_own_profile" ON public.user_profiles
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Admins can perform all operations
CREATE POLICY "admins_all_user_profiles" ON public.user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );
