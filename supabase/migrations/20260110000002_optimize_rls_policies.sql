-- Optimize RLS policies by combining multiple permissive policies for same action
-- This resolves "Multiple Permissive Policies" performance warnings from Supabase Advisor

-- Drop old policies and replace with optimized combined versions
-- Users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own user record" ON users;
CREATE POLICY "Users can view users they have access to"
  ON users FOR SELECT
  USING (current_user_role() = 'admin' OR id::text = current_user_id());

-- User Profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Users can view profiles they have access to"
  ON user_profiles FOR SELECT
  USING (user_id::text = current_user_id() OR current_user_role() = 'admin');

-- Prescriptions table - SELECT
DROP POLICY IF EXISTS "Patients can view own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view their submitted prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Admins can view all prescriptions" ON prescriptions;
CREATE POLICY "Users can view prescriptions they have access to"
  ON prescriptions FOR SELECT
  USING (
    patient_id::text = current_user_id() 
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- Prescriptions table - INSERT
DROP POLICY IF EXISTS "Patients can insert prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can insert prescriptions" ON prescriptions;
CREATE POLICY "Patients and doctors can insert prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (
    patient_id::text = current_user_id() OR doctor_id::text = current_user_id()
  );

-- Orders table
DROP POLICY IF EXISTS "Patients can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Users can view orders they have access to"
  ON orders FOR SELECT
  USING (patient_id::text = current_user_id() OR current_user_role() = 'admin');

-- Prescription Items table
DROP POLICY IF EXISTS "Users can view prescription items for their prescriptions" ON prescription_items;
DROP POLICY IF EXISTS "Admins can view all prescription items" ON prescription_items;
CREATE POLICY "Users can view prescription items they have access to"
  ON prescription_items FOR SELECT
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE patient_id::text = current_user_id() 
         OR doctor_id::text = current_user_id()
    )
    OR current_user_role() = 'admin'
  );

-- Refills table
DROP POLICY IF EXISTS "Patients can view their own refills" ON refills;
DROP POLICY IF EXISTS "Doctors can view refills for their prescriptions" ON refills;
DROP POLICY IF EXISTS "Admins can view all refills" ON refills;
CREATE POLICY "Users can view refills they have access to"
  ON refills FOR SELECT
  USING (
    patient_id::text = current_user_id()
    OR prescription_id IN (SELECT id FROM prescriptions WHERE doctor_id::text = current_user_id())
    OR current_user_role() = 'admin'
  );

-- Deliveries table
DROP POLICY IF EXISTS "Users can view deliveries for their orders" ON deliveries;
DROP POLICY IF EXISTS "Couriers can view their assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can view all deliveries" ON deliveries;
CREATE POLICY "Users can view deliveries they have access to"
  ON deliveries FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE patient_id::text = current_user_id())
    OR courier_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- Payments table
DROP POLICY IF EXISTS "Patients can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Users can view payments they have access to"
  ON payments FOR SELECT
  USING (patient_id::text = current_user_id() OR current_user_role() = 'admin');

-- Testimonials table
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON testimonials;
CREATE POLICY "Public can view approved testimonials, admins view all"
  ON testimonials FOR SELECT
  USING (is_approved = true OR current_user_role() = 'admin');

-- Messages and Reviews don't have multiple permissive policies, so they stay as-is
-- Audit Logs doesn't have multiple permissive policies, so it stays as-is
