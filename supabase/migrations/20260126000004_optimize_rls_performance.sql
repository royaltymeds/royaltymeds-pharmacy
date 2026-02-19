-- Optimize RLS policies for performance
-- Replace auth.uid() with (select auth.uid()) to cache the result for each row
-- Consolidate multiple permissive policies into single policies

-- ============================================================
-- USERS TABLE - Consolidate SELECT policies
-- ============================================================

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own user record" ON users;
DROP POLICY IF EXISTS "Users can view users they have access to" ON users;
DROP POLICY IF EXISTS "Doctors can view users for their linked patients" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create single consolidated SELECT policy
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    -- User can view their own record
    (select auth.uid()) = id
    -- OR doctor can view their linked patients
    OR (select auth.uid()) IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = id
    )
    -- OR admin can view all
    OR (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

-- ============================================================
-- USER_PROFILES TABLE - Consolidate SELECT policies
-- ============================================================

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles they have access to" ON user_profiles;
DROP POLICY IF EXISTS "Doctors can view profiles for their linked patients" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create single consolidated SELECT policy
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT
  USING (
    -- User can view their own profile
    (select auth.uid()) = user_id
    -- OR doctor can view their linked patients' profiles
    OR (select auth.uid()) IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = user_id
    )
    -- OR admin can view all
    OR (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

-- ============================================================
-- DOCTOR_PATIENT_LINKS TABLE - Optimize SELECT policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view their patient links" ON doctor_patient_links;

-- Create optimized SELECT policy
CREATE POLICY "doctor_patient_links_select_policy" ON doctor_patient_links
  FOR SELECT
  USING (
    (select auth.uid()) = doctor_id
    OR (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

-- Optimize INSERT policy
DROP POLICY IF EXISTS "Doctors can create patient links" ON doctor_patient_links;

CREATE POLICY "doctor_patient_links_insert_policy" ON doctor_patient_links
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = doctor_id
    AND (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'doctor'
  );

-- Optimize DELETE policy
DROP POLICY IF EXISTS "Doctors can delete their patient links" ON doctor_patient_links;

CREATE POLICY "doctor_patient_links_delete_policy" ON doctor_patient_links
  FOR DELETE
  USING (
    (select auth.uid()) = doctor_id
    OR (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );
