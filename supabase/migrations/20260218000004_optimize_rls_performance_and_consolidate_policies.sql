-- Fix Supabase database linter warnings
-- Date: February 18, 2026
-- Issues:
--   1. Auth RLS Initplan: Replace auth.uid() with (select auth.uid()) for performance
--   2. Multiple Permissive Policies: Consolidate duplicate policies

-- ============ USER_PROFILES TABLE FIXES ============

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "user_profiles_insert_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own_only" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update user profiles they own or admins can update an" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Combined SELECT policy: users read own, doctors read linked, admins read all
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT
  USING (
    -- User can read their own profile
    user_id = (select auth.uid())
    -- Doctor can read their linked patient profiles
    OR user_id IN (
      SELECT patient_id FROM public.doctor_patient_links WHERE doctor_id = (select auth.uid())
    )
    -- Admin can read all
    OR (
      SELECT role FROM public.users WHERE id = (select auth.uid())
    ) = 'admin'
  );

-- Combined INSERT policy: users create own profile, admins can create for others
CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    OR (
      SELECT role FROM public.users WHERE id = (select auth.uid())
    ) = 'admin'
  );

-- Combined UPDATE policy: users update own, admins update any
CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE
  USING (
    user_id = (select auth.uid())
    OR (
      SELECT role FROM public.users WHERE id = (select auth.uid())
    ) = 'admin'
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR (
      SELECT role FROM public.users WHERE id = (select auth.uid())
    ) = 'admin'
  );

-- Combined DELETE policy: users delete own, admins delete any
CREATE POLICY "user_profiles_delete" ON public.user_profiles
  FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR (
      SELECT role FROM public.users WHERE id = (select auth.uid())
    ) = 'admin'
  );

-- ============ SHIPPING_RATES TABLE FIXES ============

-- Drop old shipping_rates policies and recreate with proper auth.uid() wrapping
DROP POLICY IF EXISTS "admins_create_rates" ON public.shipping_rates;
DROP POLICY IF EXISTS "admins_update_rates" ON public.shipping_rates;
DROP POLICY IF EXISTS "admins_delete_rates" ON public.shipping_rates;

-- RLS Policy: Admins can create shipping rates
CREATE POLICY "admins_create_rates" ON public.shipping_rates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admins can update shipping rates
CREATE POLICY "admins_update_rates" ON public.shipping_rates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admins can delete shipping rates
CREATE POLICY "admins_delete_rates" ON public.shipping_rates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- SELECT policy remains unchanged (public access is intentional)
-- (If it doesn't exist, recreate it)
DROP POLICY IF EXISTS "public_select_rates" ON public.shipping_rates;
CREATE POLICY "public_select_rates" ON public.shipping_rates
  FOR SELECT
  USING (true);
