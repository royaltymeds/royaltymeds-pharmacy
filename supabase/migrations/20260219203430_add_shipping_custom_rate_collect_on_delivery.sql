-- Add shipping_custom_rate_collect_on_delivery column to orders table
-- This allows admins to enable COD collection for custom shipping rates
-- Different from shipping_collect_on_delivery which is set from cart

ALTER TABLE public.orders
ADD COLUMN shipping_custom_rate_collect_on_delivery boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.shipping_custom_rate_collect_on_delivery IS 
'Flag to enable cash on delivery collection for custom shipping rates set by admin. 
When true, the custom shipping rate is not included in the order total and must be collected on delivery.
Separate from shipping_collect_on_delivery which is set during checkout.';
