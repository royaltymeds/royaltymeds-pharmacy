-- Fix infinite recursion in RLS policies for users table
-- The issue: current_user_role() function queries users table, causing infinite recursion
-- when used in the users table's RLS policies

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view users they have access to" ON users;
DROP POLICY IF EXISTS "Users can view users they have access to" ON public.users;

-- Create simpler policies that avoid recursion:
-- Users can only see their own user record
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own record"
  ON public.users FOR SELECT
  USING (
    id::text = (auth.jwt() ->> 'sub')::text
  );

-- Allow insert for new auth users
CREATE POLICY "Users can insert their own record"
  ON public.users FOR INSERT
  WITH CHECK (
    id::text = (auth.jwt() ->> 'sub')::text
  );

-- Allow update for own record
CREATE POLICY "Users can update their own record"
  ON public.users FOR UPDATE
  USING (
    id::text = (auth.jwt() ->> 'sub')::text
  )
  WITH CHECK (
    id::text = (auth.jwt() ->> 'sub')::text
  );

-- Note: Admin operations should use service role client which bypasses RLS
-- Service role client can access all users regardless of these policies
