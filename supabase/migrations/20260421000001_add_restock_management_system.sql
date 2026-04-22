-- Restock Management System
-- Enables pharmacists to manage supplier relationships and submit restock orders

-- Table: suppliers
-- Stores information about suppliers for medications and supplies
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Jamaica'::text,
  payment_terms text,
  lead_time_days integer DEFAULT 3,
  minimum_order_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

-- Table: restock_frequencies
-- Pre-configured ordering frequencies (daily, weekly, monthly, etc.)
CREATE TABLE public.restock_frequencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  days_interval integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT restock_frequencies_pkey PRIMARY KEY (id)
);

-- Table: supplier_products
-- Maps products (OTC and Prescription drugs) to suppliers with pricing
CREATE TABLE public.supplier_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('otc', 'prescription')),
  supplier_sku text,
  supplier_unit_price numeric NOT NULL,
  minimum_order_quantity integer DEFAULT 1,
  reorder_frequency_id uuid,
  last_ordered_at timestamp with time zone,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT supplier_products_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE,
  CONSTRAINT supplier_products_frequency_id_fkey FOREIGN KEY (reorder_frequency_id) REFERENCES public.restock_frequencies(id) ON DELETE SET NULL,
  CONSTRAINT supplier_products_unique_mapping UNIQUE(supplier_id, product_id, product_type)
);

-- Table: restock_requests
-- Main record for each restock submission by pharmacist
CREATE TABLE public.restock_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL,
  pharmacist_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'submitted', 'received', 'cancelled')),
  total_amount numeric,
  requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  approved_at timestamp with time zone,
  approved_by uuid,
  expected_delivery_date date,
  actual_delivery_date date,
  rejection_reason text,
  approval_notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT restock_requests_pkey PRIMARY KEY (id),
  CONSTRAINT restock_requests_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT restock_requests_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.users(id),
  CONSTRAINT restock_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);

-- Table: restock_items
-- Line items for each restock request
CREATE TABLE public.restock_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restock_request_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('otc', 'prescription')),
  product_name text NOT NULL,
  quantity_requested integer NOT NULL CHECK (quantity_requested > 0),
  quantity_received integer DEFAULT 0,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT restock_items_pkey PRIMARY KEY (id),
  CONSTRAINT restock_items_restock_request_id_fkey FOREIGN KEY (restock_request_id) REFERENCES public.restock_requests(id) ON DELETE CASCADE,
  CONSTRAINT restock_items_quantity_not_exceeds_received CHECK (quantity_received <= quantity_requested)
);

-- Table: restock_history
-- Audit trail for restock request status changes
CREATE TABLE public.restock_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restock_request_id uuid NOT NULL,
  action text NOT NULL,
  old_status text,
  new_status text,
  changed_by uuid NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT restock_history_pkey PRIMARY KEY (id),
  CONSTRAINT restock_history_restock_request_id_fkey FOREIGN KEY (restock_request_id) REFERENCES public.restock_requests(id) ON DELETE CASCADE,
  CONSTRAINT restock_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

-- RLS Policies for suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT
  USING (true);

CREATE POLICY "suppliers_insert" ON public.suppliers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "suppliers_update" ON public.suppliers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "suppliers_delete" ON public.suppliers FOR DELETE
  USING (true);

-- RLS Policies for restock_frequencies table
ALTER TABLE public.restock_frequencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_frequencies_select" ON public.restock_frequencies FOR SELECT
  USING (true);

CREATE POLICY "restock_frequencies_insert" ON public.restock_frequencies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "restock_frequencies_update" ON public.restock_frequencies FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for supplier_products table
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_products_select" ON public.supplier_products FOR SELECT
  USING (true);

CREATE POLICY "supplier_products_insert" ON public.supplier_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "supplier_products_update" ON public.supplier_products FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "supplier_products_delete" ON public.supplier_products FOR DELETE
  USING (true);

-- RLS Policies for restock_requests table
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_requests_select" ON public.restock_requests FOR SELECT
  USING (true);

CREATE POLICY "restock_requests_insert" ON public.restock_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "restock_requests_update" ON public.restock_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "restock_requests_delete" ON public.restock_requests FOR DELETE
  USING (true);

-- RLS Policies for restock_items table
ALTER TABLE public.restock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_items_select" ON public.restock_items FOR SELECT
  USING (true);

CREATE POLICY "restock_items_insert" ON public.restock_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "restock_items_update" ON public.restock_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "restock_items_delete" ON public.restock_items FOR DELETE
  USING (true);

-- RLS Policies for restock_history table
ALTER TABLE public.restock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_history_select" ON public.restock_history FOR SELECT
  USING (true);

CREATE POLICY "restock_history_insert" ON public.restock_history FOR INSERT
  WITH CHECK (true);

-- Indexes for performance optimization
CREATE INDEX idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product_id ON public.supplier_products(product_id);
CREATE INDEX idx_restock_requests_supplier_id ON public.restock_requests(supplier_id);
CREATE INDEX idx_restock_requests_pharmacist_id ON public.restock_requests(pharmacist_id);
CREATE INDEX idx_restock_requests_status ON public.restock_requests(status);
CREATE INDEX idx_restock_requests_created_at ON public.restock_requests(created_at);
CREATE INDEX idx_restock_items_restock_request_id ON public.restock_items(restock_request_id);
CREATE INDEX idx_restock_history_restock_request_id ON public.restock_history(restock_request_id);
CREATE INDEX idx_restock_history_created_at ON public.restock_history(created_at);

-- Seed initial restock frequencies
INSERT INTO public.restock_frequencies (name, description, days_interval) VALUES
  ('Daily', 'Replenish daily', 1),
  ('Weekly', 'Replenish weekly', 7),
  ('Bi-weekly', 'Replenish every 2 weeks', 14),
  ('Monthly', 'Replenish monthly', 30),
  ('Quarterly', 'Replenish quarterly', 90),
  ('As Needed', 'Only order when stock runs low', 0)
ON CONFLICT (name) DO NOTHING;
