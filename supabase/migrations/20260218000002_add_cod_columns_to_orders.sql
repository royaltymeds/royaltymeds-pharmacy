-- Add columns to support Cash On Delivery (COD) shipping handling
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_collect_on_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_estimated_amount numeric;

-- No RLS changes required; admin and server code will populate these fields
