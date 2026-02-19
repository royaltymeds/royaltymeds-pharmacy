-- Expand RLS policies for better UX permissiveness
-- Adds INSERT, UPDATE, DELETE operations where appropriate for application functionality
-- While maintaining security by restricting to own records or admin role

-- =====================
-- User Profiles - Add INSERT and UPDATE for admins
-- =====================

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id::text = current_user_id());

CREATE POLICY "Admins can update any user profile"
  ON user_profiles FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Prescriptions - Add UPDATE and DELETE
-- =====================

CREATE POLICY "Users can update prescriptions they own"
  ON prescriptions FOR UPDATE
  USING (
    patient_id::text = current_user_id() 
    OR doctor_id::text = current_user_id()
  );

CREATE POLICY "Admins can delete prescriptions"
  ON prescriptions FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Orders - Add UPDATE and DELETE
-- =====================

CREATE POLICY "Patients can update their own orders"
  ON orders FOR UPDATE
  USING (patient_id::text = current_user_id());

CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Prescription Items - Add INSERT, UPDATE, DELETE
-- =====================

CREATE POLICY "Users can insert prescription items for their prescriptions"
  ON prescription_items FOR INSERT
  WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE patient_id::text = current_user_id() 
         OR doctor_id::text = current_user_id()
    )
  );

CREATE POLICY "Users can update prescription items in their prescriptions"
  ON prescription_items FOR UPDATE
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE patient_id::text = current_user_id() 
         OR doctor_id::text = current_user_id()
    )
  );

CREATE POLICY "Admins can delete prescription items"
  ON prescription_items FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Refills - Add UPDATE
-- =====================

CREATE POLICY "Doctors can update refill status for their prescriptions"
  ON refills FOR UPDATE
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE doctor_id::text = current_user_id()
    )
  );

CREATE POLICY "Admins can update any refill"
  ON refills FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "Patients can update their own refills"
  ON refills FOR UPDATE
  USING (patient_id::text = current_user_id());

-- =====================
-- Deliveries - Add UPDATE and DELETE
-- =====================

CREATE POLICY "Couriers can update their assigned deliveries"
  ON deliveries FOR UPDATE
  USING (courier_id::text = current_user_id());

CREATE POLICY "Admins can delete deliveries"
  ON deliveries FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Payments - Add INSERT and UPDATE
-- =====================

CREATE POLICY "Patients can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

CREATE POLICY "Admins can update any payment"
  ON payments FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- Messages - Add UPDATE and DELETE
-- =====================

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id::text = current_user_id());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (sender_id::text = current_user_id());

-- =====================
-- Testimonials - Add INSERT, UPDATE, DELETE
-- =====================

CREATE POLICY "Users can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update any testimonial"
  ON testimonials FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "Users can delete their own testimonials"
  ON testimonials FOR DELETE
  USING (patient_id::text = current_user_id() OR patient_id IS NULL);

-- =====================
-- Audit Logs - Add INSERT (for audit trail)
-- =====================

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

