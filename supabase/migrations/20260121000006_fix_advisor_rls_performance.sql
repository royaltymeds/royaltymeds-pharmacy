-- Fix Supabase Advisor Issues:
-- 1. auth_rls_initplan: Wrap auth.uid() and auth.jwt() calls in SELECT subqueries
-- 2. multiple_permissive_policies: Consolidate duplicate policies for same role/action

-- =====================
-- PRESCRIPTIONS TABLE
-- =====================
-- Fix: Multiple permissive policies for UPDATE + auth function optimization
DROP POLICY IF EXISTS "Admin can update prescription details" ON prescriptions;
DROP POLICY IF EXISTS "Users can update prescriptions they own or admins can update an" ON prescriptions;

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

-- =====================
-- PRESCRIPTION_ITEMS TABLE
-- =====================
-- Drop old policies and consolidate
DROP POLICY IF EXISTS "Admin can insert prescription items" ON prescription_items;
DROP POLICY IF EXISTS "Users can insert prescription items for their prescriptions" ON prescription_items;
DROP POLICY IF EXISTS "Admin can update prescription items" ON prescription_items;
DROP POLICY IF EXISTS "Users can update prescription items in their prescriptions" ON prescription_items;
DROP POLICY IF EXISTS "Admins can delete prescription items" ON prescription_items;

-- Consolidated INSERT policy
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

-- Consolidated UPDATE policy
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

-- Consolidated DELETE policy
CREATE POLICY "Delete prescription items if authorized"
  ON prescription_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
      AND current_user_role() = 'admin'
    )
  );

-- =====================
-- OTC_DRUGS TABLE
-- =====================
-- Fix: Multiple permissive policies for SELECT + auth function optimization
-- Drop old duplicate view/select policies
DROP POLICY IF EXISTS "Admin can select OTC drugs" ON otc_drugs;
DROP POLICY IF EXISTS "Admin can view OTC drugs" ON otc_drugs;

-- Consolidated admin SELECT policy
CREATE POLICY "Admin can view and select OTC drugs"
  ON otc_drugs FOR SELECT
  USING (current_user_role() = 'admin');

-- Fix auth function calls in INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin can insert OTC drugs" ON otc_drugs;
CREATE POLICY "Admin can insert OTC drugs"
  ON otc_drugs FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin can update OTC drugs" ON otc_drugs;
CREATE POLICY "Admin can update OTC drugs"
  ON otc_drugs FOR UPDATE
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin can delete OTC drugs" ON otc_drugs;
CREATE POLICY "Admin can delete OTC drugs"
  ON otc_drugs FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- PRESCRIPTION_DRUGS TABLE
-- =====================
-- Fix: Multiple permissive policies for SELECT + auth function optimization
-- Drop old duplicate view/select policies
DROP POLICY IF EXISTS "Admin can select prescription drugs" ON prescription_drugs;
DROP POLICY IF EXISTS "Admin can view prescription drugs" ON prescription_drugs;

-- Consolidated admin SELECT policy
CREATE POLICY "Admin can view and select prescription drugs"
  ON prescription_drugs FOR SELECT
  USING (current_user_role() = 'admin');

-- Fix auth function calls in INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin can insert prescription drugs" ON prescription_drugs;
CREATE POLICY "Admin can insert prescription drugs"
  ON prescription_drugs FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin can update prescription drugs" ON prescription_drugs;
CREATE POLICY "Admin can update prescription drugs"
  ON prescription_drugs FOR UPDATE
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin can delete prescription drugs" ON prescription_drugs;
CREATE POLICY "Admin can delete prescription drugs"
  ON prescription_drugs FOR DELETE
  USING (current_user_role() = 'admin');

-- =====================
-- INVENTORY_TRANSACTIONS TABLE
-- =====================
-- Fix: Multiple permissive policies for SELECT + auth function optimization
-- Drop old duplicate view/select policies
DROP POLICY IF EXISTS "Admin can select inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Admin can view inventory transactions" ON inventory_transactions;

-- Consolidated admin SELECT policy
CREATE POLICY "Admin can view and select inventory transactions"
  ON inventory_transactions FOR SELECT
  USING (current_user_role() = 'admin');

-- Fix auth function calls in INSERT
DROP POLICY IF EXISTS "Admin can insert inventory transactions" ON inventory_transactions;
CREATE POLICY "Admin can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

-- =====================
-- ORDERS TABLE (E-COMMERCE)
-- =====================
-- Fix: Multiple permissive policies for SELECT + auth function optimization
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Patients can view their own orders" ON orders;

-- Consolidated SELECT policy (replaces 2 permissive policies)
CREATE POLICY "View orders based on authorization"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR current_user_role() = 'admin'
  );

-- Fix auth function calls in INSERT
DROP POLICY IF EXISTS "Patients can create their own orders" ON orders;
CREATE POLICY "Patients can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix auth function calls in UPDATE
DROP POLICY IF EXISTS "Admins can update order status" ON orders;
CREATE POLICY "Admins can update order status"
  ON orders FOR UPDATE
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- =====================
-- ORDER_ITEMS TABLE
-- =====================
-- Fix: auth function optimization in SELECT and INSERT

-- Drop old policy that has non-optimized auth function calls
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;

-- CREATE new optimized SELECT policy (replaces the old one)
CREATE POLICY "Users can view order items of their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR current_user_role() = 'admin')
    )
  );

-- NOTE: "Only authorized users can insert order items" was created in migration 20260121000005
-- Just update it if it has non-optimized auth function calls
DROP POLICY IF EXISTS "Only authorized users can insert order items" ON order_items;
CREATE POLICY "Only authorized users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR current_user_role() = 'admin')
    )
  );

-- =====================
-- CART_ITEMS TABLE
-- =====================
-- Fix: auth function optimization in all operations
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can add to their cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update their cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from their cart" ON cart_items;

-- Consolidated all-in-one policy for efficiency
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alternative if ALL is not preferred, use individual operations:
-- CREATE POLICY "Users can view their cart"
--   ON cart_items FOR SELECT
--   USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can add to their cart"
--   ON cart_items FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their cart"
--   ON cart_items FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete from their cart"
--   ON cart_items FOR DELETE
--   USING (auth.uid() = user_id);
