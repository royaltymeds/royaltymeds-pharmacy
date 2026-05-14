-- Tracks whether a purchase order came from scheduled/request automation or was manually created.
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'scheduled';

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_source_check;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_source_check
  CHECK (source IN ('scheduled', 'manual'));

CREATE INDEX IF NOT EXISTS idx_purchase_orders_source ON public.purchase_orders(source);
