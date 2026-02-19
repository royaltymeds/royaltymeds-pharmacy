-- =====================
-- POLICY FIX: doctor_prescriptions RLS policies
-- Issue: Ensure doctors can only see their own prescriptions
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_access" ON doctor_prescriptions;

-- Recreate with explicit role check and debugging
CREATE POLICY "doctor_prescriptions_doctor_access"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    doctor_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'doctor' OR users.role = 'admin')
    )
  );

-- Also allow patients to see prescriptions written for them
CREATE POLICY "doctor_prescriptions_patient_view"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    patient_id = auth.uid()
  );

-- Allow admins to see all
CREATE POLICY "doctor_prescriptions_admin_view"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
