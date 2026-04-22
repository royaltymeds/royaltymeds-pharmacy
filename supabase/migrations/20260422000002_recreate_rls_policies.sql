-- Recreate RLS policies after function recreation
-- All policies use current_user_id() function which was just recreated

-- ========================================
-- PRESCRIPTIONS TABLE POLICIES
-- ========================================
CREATE POLICY "Patients can request refills"
  ON prescriptions FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Users can view prescriptions they have access to"
  ON prescriptions FOR SELECT
  USING (
    patient_id::text = current_user_id() 
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Patients and doctors can insert prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (
    patient_id::text = current_user_id()
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Update prescriptions if owner or admin"
  ON prescriptions FOR UPDATE
  USING (
    patient_id::text = current_user_id()
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  )
  WITH CHECK (
    patient_id::text = current_user_id()
    OR doctor_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- ========================================
-- PRESCRIPTION_ITEMS TABLE POLICIES
-- ========================================
CREATE POLICY "Users can view prescription items they have access to"
  ON prescription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
      AND (
        prescriptions.patient_id::text = current_user_id()
        OR prescriptions.doctor_id::text = current_user_id()
        OR current_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Insert prescription items if authorized"
  ON prescription_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
      AND (
        prescriptions.patient_id::text = current_user_id()
        OR prescriptions.doctor_id::text = current_user_id()
        OR current_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Update prescription items if authorized"
  ON prescription_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
      AND (
        prescriptions.patient_id::text = current_user_id()
        OR prescriptions.doctor_id::text = current_user_id()
        OR current_user_role() = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
      AND (
        prescriptions.patient_id::text = current_user_id()
        OR prescriptions.doctor_id::text = current_user_id()
        OR current_user_role() = 'admin'
      )
    )
  );

-- ========================================
-- REFILLS TABLE POLICIES
-- ========================================
CREATE POLICY "Patients can request refills"
  ON refills FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Users can view refills they have access to"
  ON refills FOR SELECT
  USING (
    patient_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Users can update refills they own or manage"
  ON refills FOR UPDATE
  USING (
    patient_id::text = current_user_id()
    OR current_user_role() = 'admin'
  )
  WITH CHECK (
    patient_id::text = current_user_id()
    OR current_user_role() = 'admin'
  );

-- ========================================
-- TESTIMONIALS TABLE POLICIES
-- ========================================
CREATE POLICY "Users can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

CREATE POLICY "Users can delete their own testimonials"
  ON testimonials FOR DELETE
  USING (patient_id::text = current_user_id());
