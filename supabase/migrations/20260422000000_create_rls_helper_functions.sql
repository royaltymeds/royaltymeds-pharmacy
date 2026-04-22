-- Create RLS helper functions to avoid infinite recursion in policies
-- These functions safely get current user information without causing policy loops

-- Drop functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS current_user_role() CASCADE;

-- Function to get current user ID as text
-- Safe to use in RLS policies without causing recursion
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT (auth.jwt() ->> 'sub')::text
$$;

-- Function to get current user role
-- Looks up role from users table - only safe when called from service role or non-users tables
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT role::text
  FROM users
  WHERE id = (auth.jwt() ->> 'sub')::uuid
  LIMIT 1
$$;

-- Safer alternative: get role directly from JWT claims (if available)
CREATE OR REPLACE FUNCTION current_user_role_from_jwt()
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role')::text, 'user')
$$;
