-- Fix infinite recursion in user_profiles RLS - remove all cross-table references
-- Date: February 18, 2026
-- Issue: Even checking users table for admin role creates circular RLS recursion

-- Drop all problematic policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_admin" ON public.user_profiles;

-- Create ONLY a simple self-read policy with zero cross-table dependencies
-- This is what get-profile API needs - users reading their own profile
CREATE POLICY "user_profiles_select_self" ON public.user_profiles
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Keep the existing INSERT/UPDATE/DELETE policies as they were before
-- (they don't cause recursion issues because they're targeted)
