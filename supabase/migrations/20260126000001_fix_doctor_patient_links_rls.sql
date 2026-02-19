-- Fix RLS policies for doctor_patient_links table
-- The issue is that the RLS policies are trying to access the users table in their WITH CHECK clause,
-- which can cause RLS violations when the query itself tries to join with users table

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view their patient links" ON doctor_patient_links;
DROP POLICY IF EXISTS "Doctors can create patient links" ON doctor_patient_links;
DROP POLICY IF EXISTS "Doctors can delete their patient links" ON doctor_patient_links;

-- RLS policy: Doctors can see their own links
CREATE POLICY "Doctors can view their patient links" ON doctor_patient_links
  FOR SELECT
  USING (
    auth.uid() = doctor_id
    OR auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- RLS policy: Doctors can create links to patients
CREATE POLICY "Doctors can create patient links" ON doctor_patient_links
  FOR INSERT
  WITH CHECK (
    auth.uid() = doctor_id
    AND auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'doctor'
    )
  );

-- RLS policy: Doctors can delete their own links
CREATE POLICY "Doctors can delete their patient links" ON doctor_patient_links
  FOR DELETE
  USING (
    auth.uid() = doctor_id
    OR auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Also ensure users and user_profiles tables have appropriate RLS for this join
-- Allow doctors to view user_profiles for their linked patients
DROP POLICY IF EXISTS "Doctors can view linked patient profiles" ON user_profiles;

CREATE POLICY "Doctors can view linked patient profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = user_id
    )
    OR auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow doctors to view users table entries for their linked patients
DROP POLICY IF EXISTS "Doctors can view linked patient user info" ON users;

CREATE POLICY "Doctors can view linked patient user info" ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = id
    )
    OR auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
