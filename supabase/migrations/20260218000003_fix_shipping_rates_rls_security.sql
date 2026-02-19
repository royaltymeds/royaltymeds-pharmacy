-- Fix RLS security issue: admins_update_rates policy needs proper USING clause
-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "admins_update_rates" ON public.shipping_rates;

-- Recreate the UPDATE policy with proper USING clause
-- This ensures both the rows being updated (USING) and the values (WITH CHECK) are restricted to admin access
CREATE POLICY "admins_update_rates" ON public.shipping_rates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
