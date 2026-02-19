-- Add payment_pending and payment_verified to orders status check constraint
-- Drop the old constraint and create a new one with the additional statuses

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'payment_pending',
    'payment_verified',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  )
);
