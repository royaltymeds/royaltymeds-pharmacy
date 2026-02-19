-- Make users and user_profiles tables accessible to doctors for their linked patients
-- Remove restrictive policies and make them more permissive

-- First, drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own user record" ON users;
DROP POLICY IF EXISTS "Doctors can view linked patient user info" ON users;

-- Create new permissive policies for users
CREATE POLICY "Users can view their own user record" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can view users for their linked patients" ON users
  FOR SELECT
  USING (
    -- Doctor can view any user that is linked to them
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = id
    )
  );

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    -- Check if current user is admin
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Drop ALL existing policies on user_profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their profile" ON user_profiles;
DROP POLICY IF EXISTS "Doctors can view linked patient profiles" ON user_profiles;

-- Create new permissive policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view profiles for their linked patients" ON user_profiles
  FOR SELECT
  USING (
    -- Doctor can view profile for any patient linked to them
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patient_links WHERE patient_id = user_id
    )
  );

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT
  USING (
    -- Check if current user is admin
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
