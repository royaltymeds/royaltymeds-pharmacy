-- Optimize UPDATE policies by combining multiple permissive policies
-- Reduces query evaluation overhead for better performance

-- =====================
-- User Profiles - Combine UPDATE policies
-- =====================

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any user profile" ON user_profiles;

CREATE POLICY "Users can update user profiles they own or admins can update any"
  ON user_profiles FOR UPDATE
  USING (
    user_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- =====================
-- Prescriptions - Combine UPDATE policies
-- =====================

DROP POLICY IF EXISTS "Admins can update prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Users can update prescriptions they own" ON prescriptions;

CREATE POLICY "Users can update prescriptions they own or admins can update any"
  ON prescriptions FOR UPDATE
  USING (
    patient_id::text = current_user_id()
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- =====================
-- Orders - Combine UPDATE policies (and remove duplicate)
-- =====================

DROP POLICY IF EXISTS "Patients can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can update any order" ON orders;

CREATE POLICY "Patients can update their own orders or admins can update any"
  ON orders FOR UPDATE
  USING (
    patient_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- =====================
-- Refills - Combine UPDATE policies
-- =====================

DROP POLICY IF EXISTS "Patients can update their own refills" ON refills;
DROP POLICY IF EXISTS "Doctors can update refill status for their prescriptions" ON refills;
DROP POLICY IF EXISTS "Admins can update any refill" ON refills;

CREATE POLICY "Users can update refills they own or manage"
  ON refills FOR UPDATE
  USING (
    patient_id::text = current_user_id()
    OR prescription_id IN (SELECT id FROM prescriptions WHERE doctor_id::text = current_user_id())
    OR current_user_role() = 'admin'
  );

-- =====================
-- Deliveries - Combine UPDATE policies
-- =====================

DROP POLICY IF EXISTS "Couriers can update their assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can update delivery status" ON deliveries;

CREATE POLICY "Couriers can update their deliveries or admins can update any"
  ON deliveries FOR UPDATE
  USING (
    courier_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );
