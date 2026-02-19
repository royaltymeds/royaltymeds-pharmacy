-- =====================
-- Fix doctor_prescriptions RLS policies and indexes
-- Issues resolved:
-- 1. auth_rls_initplan - Cache auth.uid() calls
-- 2. multiple_permissive_policies - Combine into single policies with OR logic
-- 3. duplicate_index - Drop duplicate prescription_number indexes
-- =====================

-- Drop ALL old policies
DROP POLICY IF EXISTS "doctor_prescriptions_admin_view" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_access" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_patient_view" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_select" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_insert" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_insert" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_update" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_admin_update" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_delete" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_delete" ON doctor_prescriptions;

-- Drop duplicate indexes
DROP INDEX IF EXISTS idx_doctor_prescriptions_number;
DROP INDEX IF EXISTS idx_doctor_prescriptions_prescription_number;

-- Create single combined SELECT policy with cached auth.uid()
CREATE POLICY "doctor_prescriptions_select"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    doctor_id = (SELECT auth.uid())
    OR patient_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.role = 'admin'
    )
  );

-- Create single INSERT policy with cached auth.uid()
CREATE POLICY "doctor_prescriptions_insert"
  ON doctor_prescriptions
  FOR INSERT
  WITH CHECK (
    doctor_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.role = 'doctor'
    )
  );

-- Create UPDATE policy for admins with cached auth.uid()
CREATE POLICY "doctor_prescriptions_update"
  ON doctor_prescriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.role = 'admin'
    )
  );

-- Create DELETE policy for doctors on pending prescriptions with cached auth.uid()
CREATE POLICY "doctor_prescriptions_delete"
  ON doctor_prescriptions
  FOR DELETE
  USING (
    doctor_id = (SELECT auth.uid())
    AND status = 'pending'
  );

-- Recreate prescription_number index (only one)
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_prescription_number 
ON doctor_prescriptions(prescription_number);
