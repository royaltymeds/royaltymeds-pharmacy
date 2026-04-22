-- Fix infinite recursion in users table RLS policies
-- The issue: users_select_policy and user_profiles_select_policy query users table within their USING clauses
-- This causes infinite recursion when checking policies
-- Solution: Remove recursive queries and use only direct comparisons or service role client for admin operations

-- ============================================================
-- USERS TABLE - Fix recursive policy
-- ============================================================
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Create simple non-recursive policies
-- Users can view their own user record only
-- Admins will use service role client which bypasses RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_record"
  ON public.users FOR SELECT
  USING (
    -- User can view their own record
    (select auth.uid()) = id
  );

-- Allow insert for new auth users (for auth signup flow)
CREATE POLICY "users_insert_own_record"
  ON public.users FOR INSERT
  WITH CHECK (
    (select auth.uid()) = id
  );

-- Allow update for own record
CREATE POLICY "users_update_own_record"
  ON public.users FOR UPDATE
  USING (
    (select auth.uid()) = id
  )
  WITH CHECK (
    (select auth.uid()) = id
  );

-- ============================================================
-- USER_PROFILES TABLE - Fix recursive policy
-- ============================================================
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;

-- Create non-recursive policy for user_profiles
-- Users can view their own profile and their linked doctor's profile
-- Admins use service role client
CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT
  USING (
    -- User can view their own profile
    (select auth.uid()) = user_id
    -- OR doctor can view their linked patients' profiles
    OR (select auth.uid()) IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = user_id
    )
  );

-- Note: Admin operations should use service role client which bypasses all RLS policies
