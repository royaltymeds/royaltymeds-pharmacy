-- Create payment_config table for storing admin bank account details
CREATE TABLE IF NOT EXISTS public.payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_holder VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  routing_number VARCHAR(50),
  iban VARCHAR(34),
  swift_code VARCHAR(11),
  additional_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_config_created_at ON public.payment_config(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Enable RLS (Row Level Security) on payment_config table
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for payment_config
-- Note: Admin operations will use service role key to bypass RLS
CREATE POLICY "Allow all operations on payment_config"
  ON public.payment_config
  FOR ALL
  USING (true)
  WITH CHECK (true);
