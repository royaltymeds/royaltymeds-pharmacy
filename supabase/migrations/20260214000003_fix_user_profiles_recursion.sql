-- Fix infinite recursion in user_profiles RLS by removing doctor_patient_links dependency
-- Date: February 14, 2026
-- Purpose: Allow patients to read their own profile without cross-table RLS recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "user_profiles_select_v2" ON public.user_profiles;

-- Create simple SELECT policy - just allow users to read their own + admins read all
CREATE POLICY "user_profiles_select_simple" ON public.user_profiles
  FOR SELECT
  USING (
    -- Patient can read their own profile
    user_id = auth.uid()
    -- Admin can read all  
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
