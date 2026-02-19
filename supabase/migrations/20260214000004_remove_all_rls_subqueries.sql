-- Fix all RLS recursion by removing all subqueries
-- Date: February 14, 2026
-- Purpose: Allow users to read their own profile without any cross-table dependencies

-- Drop the problematic policy
DROP POLICY IF EXISTS "user_profiles_select_simple" ON public.user_profiles;

-- Create the absolute simplest SELECT policy - users can only read their own profile
-- No subqueries, no cross-table checks, no recursion possible
CREATE POLICY "user_profiles_select_own_only" ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can still use service role key to bypass RLS if needed for admin operations
