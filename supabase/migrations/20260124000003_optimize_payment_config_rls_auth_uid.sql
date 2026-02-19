-- Further optimize RLS performance for payment_config table
-- Issue: auth.uid() calls in INSERT, UPDATE, DELETE policies are being re-evaluated for each row
-- Solution: Wrap auth.uid() with SELECT statement to evaluate once per query

-- Drop the policies that need further optimization
DROP POLICY IF EXISTS "Allow admins to create payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow admins to update payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow admins to delete payment config" ON public.payment_config;

-- Policy 2: Allow only admins to INSERT new payment config
-- Optimized: Wrapped auth.uid() with SELECT to avoid per-row re-evaluation
CREATE POLICY "Allow admins to create payment config"
  ON public.payment_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Policy 3: Allow only admins to UPDATE payment config
-- Optimized: Wrapped auth.uid() with SELECT in both USING and WITH CHECK
CREATE POLICY "Allow admins to update payment config"
  ON public.payment_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Policy 4: Allow only admins to DELETE payment config
-- Optimized: Wrapped auth.uid() with SELECT to avoid per-row re-evaluation
CREATE POLICY "Allow admins to delete payment config"
  ON public.payment_config
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );
