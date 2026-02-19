-- Create trigger function to automatically set collect_shipping_after_payment flag
-- when a custom shipping rate is set on a payment_verified order
CREATE OR REPLACE FUNCTION set_collect_shipping_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If shipping_custom_rate is being set/changed AND payment_status is payment_verified
  -- then automatically set collect_shipping_after_payment to true
  IF NEW.shipping_custom_rate IS NOT NULL 
     AND NEW.payment_status = 'payment_verified'
     AND (OLD.shipping_custom_rate IS NULL OR OLD.shipping_custom_rate != NEW.shipping_custom_rate)
  THEN
    NEW.collect_shipping_after_payment := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_collect_shipping_after_payment ON orders;

-- Create trigger that fires before update on orders table
CREATE TRIGGER trigger_collect_shipping_after_payment
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_collect_shipping_after_payment();
