-- Update order status constraint to include payment_submitted
-- Replaces payment_verified workflow with payment_submitted for Fygaro integration
-- Note: payment_verified is retained for bank transfer payment workflow

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'payment_pending',
    'payment_submitted',
    'payment_verified',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  )
);
