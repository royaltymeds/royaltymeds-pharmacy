-- Fix RLS policy for order_items INSERT
-- Remove overly permissive "System can insert order items" policy
-- Replace with proper authorization checks

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert order items" ON public.order_items;

-- Create a proper restrictive policy for order_items INSERT
-- Only allow inserts when:
-- 1. The order belongs to the current user, OR
-- 2. The user is an admin (via service role key)
CREATE POLICY "Only authorized users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR (SELECT auth.jwt() ->> 'role') = 'admin')
    )
  );
