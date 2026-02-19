-- Fix overly permissive RLS policy on payment_config table
-- Issue: The current "Enable all operations on payment_config" policy allows unrestricted access
-- Solution: Create specific policies for each operation with proper permission checks

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable all operations on payment_config" ON public.payment_config;

-- Ensure RLS is enabled
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to READ (SELECT) payment config
CREATE POLICY "Allow authenticated users to view payment config"
  ON public.payment_config
  FOR SELECT
  USING (auth.role() = 'authenticated');

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
