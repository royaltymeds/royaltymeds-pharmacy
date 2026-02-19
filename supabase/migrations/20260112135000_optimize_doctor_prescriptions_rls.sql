-- =====================
-- Optimize doctor_prescriptions RLS Policies
-- Replace multiple permissive policies with optimized single policies
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_access" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_insert" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_doctor_delete" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_admin_access" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_admin_update" ON doctor_prescriptions;
DROP POLICY IF EXISTS "doctor_prescriptions_patient_access" ON doctor_prescriptions;

-- Optimized SELECT policy - combines doctor, admin, and patient access
CREATE POLICY "doctor_prescriptions_select"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    doctor_id = (SELECT auth.uid()) OR
    patient_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Optimized INSERT policy - doctors can insert their own prescriptions
CREATE POLICY "doctor_prescriptions_insert"
  ON doctor_prescriptions
  FOR INSERT
  WITH CHECK (doctor_id = (SELECT auth.uid()));

-- Optimized UPDATE policy - admins can update
CREATE POLICY "doctor_prescriptions_update"
  ON doctor_prescriptions
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Optimized DELETE policy - doctors can delete their own pending prescriptions
CREATE POLICY "doctor_prescriptions_delete"
  ON doctor_prescriptions
  FOR DELETE
  USING (
    doctor_id = (SELECT auth.uid()) AND status = 'pending'
  );
