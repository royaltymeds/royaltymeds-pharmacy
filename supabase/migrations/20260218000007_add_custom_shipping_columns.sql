-- Add columns for custom shipping rate management
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_custom_rate numeric,
ADD COLUMN IF NOT EXISTS shipping_paid_online boolean DEFAULT false;

-- Add comment to document the columns
COMMENT ON COLUMN public.orders.shipping_custom_rate IS 'Custom shipping rate set by admin for orders without standard rates';
COMMENT ON COLUMN public.orders.shipping_paid_online IS 'Whether custom shipping rate was paid online vs on delivery';
