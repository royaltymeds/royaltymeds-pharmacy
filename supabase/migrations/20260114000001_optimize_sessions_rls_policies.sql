-- Fix for Supabase Advisor: Auth RLS Initialization Plan and Multiple Permissive Policies
-- Issues:
-- 1. auth_rls_initplan: auth.uid() is re-evaluated for each row (performance issue)
-- 2. multiple_permissive_policies: Two separate SELECT policies should be consolidated

-- Drop the old policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role manages sessions" ON public.sessions;

-- Create a single consolidated policy that wraps auth.uid() in a subquery
-- This policy allows:
-- 1. Users to see their own sessions (SELECT)
-- 2. Service role to manage all sessions (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Manage sessions with optimized auth check"
  ON public.sessions
  USING (
    (select auth.uid()) = user_id  -- Users see their own sessions (wrapped in subquery)
    OR (select current_setting('role') = 'authenticated' OR current_user = 'service_role')  -- Service role sees all
  )
  WITH CHECK (
    (select current_setting('role') = 'authenticated' OR current_user = 'service_role')  -- Only service role can modify
  );
