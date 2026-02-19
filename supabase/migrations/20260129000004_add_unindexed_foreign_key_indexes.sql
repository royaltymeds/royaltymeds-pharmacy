-- Add indexes for unindexed foreign keys
-- Improves query performance for foreign key lookups
-- Date: January 29, 2026

-- Add index for orders.transaction_id foreign key
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);

-- Add index for refill_requests.approved_by foreign key
CREATE INDEX IF NOT EXISTS idx_refill_requests_approved_by ON refill_requests(approved_by);
