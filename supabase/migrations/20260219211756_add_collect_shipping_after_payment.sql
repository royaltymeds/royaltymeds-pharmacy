-- Add collect_shipping_after_payment column to orders table
-- Flag to indicate shipping should be collected online after payment is verified
-- Used for custom shipping rates on payment verified orders

ALTER TABLE public.orders
ADD COLUMN collect_shipping_after_payment boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.collect_shipping_after_payment IS 
'Flag to indicate that custom shipping should be collected online after initial payment is verified.
When true, an online payment option is presented to the customer for the delivery fee.
Only applicable to orders with custom shipping rates.';
