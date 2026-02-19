-- Add missing RLS policies for users, deliveries, prescription_items, and refills

-- Users: Only admins can view all users, but users can view themselves via their profile
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "Users can view their own user record"
  ON users FOR SELECT
  USING (id::text = current_user_id());

-- Prescription Items: Accessible through prescriptions they belong to
CREATE POLICY "Users can view prescription items for their prescriptions"
  ON prescription_items FOR SELECT
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE patient_id::text = current_user_id() 
         OR doctor_id::text = current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM prescriptions 
      WHERE id = prescription_id 
        AND (patient_id::text = current_user_id() OR doctor_id::text = current_user_id())
    )
  );

CREATE POLICY "Admins can view all prescription items"
  ON prescription_items FOR SELECT
  USING (current_user_role() = 'admin');

-- Refills: Patients and doctors can see their own refills
CREATE POLICY "Patients can view their own refills"
  ON refills FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Doctors can view refills for their prescriptions"
  ON refills FOR SELECT
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions 
      WHERE doctor_id::text = current_user_id()
    )
  );

CREATE POLICY "Admins can view all refills"
  ON refills FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "Patients can request refills"
  ON refills FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

-- Deliveries: Accessible through their orders
CREATE POLICY "Users can view deliveries for their orders"
  ON deliveries FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE patient_id::text = current_user_id()
    )
  );

CREATE POLICY "Admins can view all deliveries"
  ON deliveries FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "Couriers can view their assigned deliveries"
  ON deliveries FOR SELECT
  USING (courier_id::text = current_user_id());

CREATE POLICY "Admins can update delivery status"
  ON deliveries FOR UPDATE
  USING (current_user_role() = 'admin');
