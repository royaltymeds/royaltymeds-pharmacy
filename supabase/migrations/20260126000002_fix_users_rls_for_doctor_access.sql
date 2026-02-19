-- Fix RLS policies to allow doctors to view user info for their linked patients
-- This is needed for the GET /api/doctor/linked-patients endpoint

-- Update the users table RLS policy to allow doctors to view their linked patients
DROP POLICY IF EXISTS "Users can view their own user record" ON users;

CREATE POLICY "Users can view their own user record"
  ON users FOR SELECT
  USING (
    id::text = current_user_id()
    OR auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = id
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Also ensure user_profiles has proper RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    user_id::text = current_user_id()
    OR auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = user_id
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
