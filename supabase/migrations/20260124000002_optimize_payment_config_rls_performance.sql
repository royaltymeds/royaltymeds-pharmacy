-- Optimize RLS performance for payment_config table
-- Issue: auth.role() was being re-evaluated for each row during query planning
-- Solution: Wrap auth.role() with SELECT statement to evaluate once per query

-- Drop the previously created policies with performance issues
DROP POLICY IF EXISTS "Allow authenticated users to view payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow admins to create payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow admins to update payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow admins to delete payment config" ON public.payment_config;

-- Ensure RLS is enabled
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to READ (SELECT) payment config
-- Optimized: Wrapped auth.role() with SELECT to avoid per-row re-evaluation
CREATE POLICY "Allow authenticated users to view payment config"
  ON public.payment_config
  FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

-- Policy 2: Allow only admins to INSERT new payment config
CREATE POLICY "Allow admins to create payment config"
  ON public.payment_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Policy 3: Allow only admins to UPDATE payment config
CREATE POLICY "Allow admins to update payment config"
  ON public.payment_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Policy 4: Allow only admins to DELETE payment config
CREATE POLICY "Allow admins to delete payment config"
  ON public.payment_config
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );
