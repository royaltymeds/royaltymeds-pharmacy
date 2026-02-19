-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on payment_config" ON public.payment_config;
DROP POLICY IF EXISTS "Allow authenticated users to read payment config" ON public.payment_config;

-- Drop and recreate RLS on payment_config table
ALTER TABLE public.payment_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Create a single permissive policy that allows all operations
CREATE POLICY "Enable all operations on payment_config"
  ON public.payment_config
  FOR ALL
  USING (true)
  WITH CHECK (true);
