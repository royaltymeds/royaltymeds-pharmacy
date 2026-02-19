-- =====================
-- Fix infinite recursion in doctor_prescriptions RLS policy
-- Issue: The SELECT policy tries to check users table for admin role
-- This causes infinite recursion because users table has recursive RLS
-- =====================

-- Drop the problematic policy
DROP POLICY IF EXISTS "doctor_prescriptions_select" ON doctor_prescriptions;

-- Create new SELECT policy without users table reference
-- Instead, rely on app-level role verification
CREATE POLICY "doctor_prescriptions_select"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    -- Doctors can see their own prescriptions
    doctor_id = (SELECT auth.uid())
    OR
    -- Patients can see prescriptions written for them
    patient_id = (SELECT auth.uid())
  );

-- For admins, we'll use service role client on the backend
-- Admins should not use RLS-restricted queries anyway
