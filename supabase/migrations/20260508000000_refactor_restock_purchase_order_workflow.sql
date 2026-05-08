-- Refactor restock management into supplier schedules and purchase-order driven receiving.

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS reorder_schedule_type text CHECK (reorder_schedule_type IN ('weekly', 'bi_weekly', 'monthly', 'custom')),
  ADD COLUMN IF NOT EXISTS reorder_schedule_start_date date,
  ADD COLUMN IF NOT EXISTS reorder_schedule_custom_dates date[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reorder_schedule_is_recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reorder_schedule_notes text;

ALTER TABLE public.restock_requests
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid;

ALTER TABLE public.restock_items
  ADD COLUMN IF NOT EXISTS purchase_order_item_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restock_requests_status_check'
      AND conrelid = 'public.restock_requests'::regclass
  ) THEN
    ALTER TABLE public.restock_requests DROP CONSTRAINT restock_requests_status_check;
  END IF;
END $$;

UPDATE public.restock_requests
SET status = CASE
  WHEN status IN ('approved', 'submitted') THEN 'linked_to_po'
  WHEN status = 'pending' THEN 'requested'
  WHEN status = 'rejected' THEN 'cancelled'
  ELSE status
END
WHERE status IN ('pending', 'approved', 'submitted', 'rejected');

ALTER TABLE public.restock_requests
  ADD CONSTRAINT restock_requests_status_check
  CHECK (status IN ('requested', 'linked_to_po', 'received', 'cancelled'));

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'received', 'cancelled')),
  reorder_date date NOT NULL,
  is_custom_reorder_date boolean DEFAULT false,
  total_amount numeric DEFAULT 0,
  notes text,
  received_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL,
  restock_request_id uuid,
  restock_item_id uuid,
  product_id uuid NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('otc', 'prescription')),
  product_name text NOT NULL,
  quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
  quantity_received integer DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_items_restock_request_id_fkey FOREIGN KEY (restock_request_id) REFERENCES public.restock_requests(id) ON DELETE SET NULL,
  CONSTRAINT purchase_order_items_restock_item_id_fkey FOREIGN KEY (restock_item_id) REFERENCES public.restock_items(id) ON DELETE SET NULL,
  CONSTRAINT purchase_order_items_received_not_over_ordered CHECK (quantity_received <= quantity_ordered)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restock_requests_purchase_order_id_fkey'
      AND conrelid = 'public.restock_requests'::regclass
  ) THEN
    ALTER TABLE public.restock_requests
      ADD CONSTRAINT restock_requests_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restock_items_purchase_order_item_id_fkey'
      AND conrelid = 'public.restock_items'::regclass
  ) THEN
    ALTER TABLE public.restock_items
      ADD CONSTRAINT restock_items_purchase_order_item_id_fkey
      FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "purchase_orders_insert" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "purchase_orders_update" ON public.purchase_orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "purchase_orders_delete" ON public.purchase_orders FOR DELETE USING (true);

CREATE POLICY "purchase_order_items_select" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "purchase_order_items_insert" ON public.purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "purchase_order_items_update" ON public.purchase_order_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "purchase_order_items_delete" ON public.purchase_order_items FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_suppliers_reorder_schedule ON public.suppliers(reorder_schedule_type, reorder_schedule_start_date);
CREATE INDEX IF NOT EXISTS idx_restock_requests_purchase_order_id ON public.restock_requests(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_restock_items_purchase_order_item_id ON public.restock_items(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_reorder_date ON public.purchase_orders(reorder_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_restock_request_id ON public.purchase_order_items(restock_request_id);
