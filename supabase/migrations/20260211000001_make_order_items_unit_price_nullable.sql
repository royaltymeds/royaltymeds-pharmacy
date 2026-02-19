-- Make unit_price nullable in order_items table
-- Since prescription orders don't use unit pricing (only total price per item)
ALTER TABLE public.order_items
ALTER COLUMN unit_price DROP NOT NULL;
