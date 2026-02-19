-- Add tax and shipping configuration columns to payment_config table
ALTER TABLE public.payment_config
ADD COLUMN tax_type text DEFAULT 'inclusive' CHECK (tax_type IN ('none', 'inclusive')),
ADD COLUMN tax_rate numeric DEFAULT 15,
ADD COLUMN kingston_delivery_cost numeric DEFAULT 0;
