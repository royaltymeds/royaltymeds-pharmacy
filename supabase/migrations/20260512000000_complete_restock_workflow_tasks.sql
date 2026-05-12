-- Complete restock workflow updates requested in TASKS.

ALTER TABLE public.suppliers
  DROP CONSTRAINT IF EXISTS suppliers_reorder_schedule_type_check;

ALTER TABLE public.suppliers
  ADD CONSTRAINT suppliers_reorder_schedule_type_check
  CHECK (reorder_schedule_type IN ('daily', 'weekly', 'bi_weekly', 'three_weeks', 'monthly', 'custom'));

ALTER TABLE public.restock_requests
  DROP COLUMN IF EXISTS expected_delivery_date;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS expected_delivery_date date,
  ADD COLUMN IF NOT EXISTS placed_at timestamp with time zone;

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('open', 'placed', 'received', 'cancelled'));

INSERT INTO public.restock_frequencies (name, description, days_interval, is_active)
VALUES
  ('Daily', 'Reorder every day', 1, true),
  ('Every 3 Weeks', 'Reorder every 21 days', 21, true)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_delivery_date
  ON public.purchase_orders(expected_delivery_date);
