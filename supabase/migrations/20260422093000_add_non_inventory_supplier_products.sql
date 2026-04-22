-- Allow linking non-inventory restock items to suppliers
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS is_inventory_item boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_supplier_products_inventory_flag
  ON public.supplier_products(is_inventory_item);
