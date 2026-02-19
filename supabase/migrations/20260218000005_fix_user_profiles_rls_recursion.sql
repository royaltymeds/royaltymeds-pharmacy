-- Fix infinite recursion in user_profiles SELECT RLS policy
-- Date: February 18, 2026
-- Issue: The select policy was checking doctor_patient_links which has its own RLS that references user_profiles, creating infinite recursion

-- Drop the problematic combined policy
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;

-- Create a simpler policy that doesn't have circular dependencies
-- Users can read their own profile directly without subqueries
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Admins can read all profiles (separate policy to keep concerns separated)
CREATE POLICY "user_profiles_select_admin" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );
