-- Fix remaining auth_rls_initplan warnings in e-commerce tables
-- Wrap auth.uid() calls in SELECT subqueries for optimal performance

-- =====================
-- ORDERS TABLE
-- =====================
-- Fix: "View orders based on authorization" policy
DROP POLICY IF EXISTS "View orders based on authorization" ON orders;
CREATE POLICY "View orders based on authorization"
  ON orders FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR current_user_role() = 'admin'
  );

-- Fix: "Patients can create their own orders" policy
DROP POLICY IF EXISTS "Patients can create their own orders" ON orders;
CREATE POLICY "Patients can create their own orders"
  ON orders FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================
-- ORDER_ITEMS TABLE
-- =====================
-- Fix: "Users can view order items of their orders" policy
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
CREATE POLICY "Users can view order items of their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND ((SELECT auth.uid()) = orders.user_id OR current_user_role() = 'admin')
    )
  );

-- Fix: "Only authorized users can insert order items" policy
DROP POLICY IF EXISTS "Only authorized users can insert order items" ON order_items;
CREATE POLICY "Only authorized users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND ((SELECT auth.uid()) = orders.user_id OR current_user_role() = 'admin')
    )
  );

-- =====================
-- CART_ITEMS TABLE
-- =====================
-- Fix: "Users can manage their own cart" policy
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
