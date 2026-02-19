-- Make drug_id nullable in order_items table for prescription orders
-- Prescription items don't have a corresponding OTC drug entry

ALTER TABLE public.order_items
  DROP CONSTRAINT order_items_drug_id_fkey,
  ALTER COLUMN drug_id DROP NOT NULL,
  ADD CONSTRAINT order_items_drug_id_fkey FOREIGN KEY (drug_id) REFERENCES public.otc_drugs(id) ON DELETE SET NULL;

-- Add comment explaining nullable drug_id
COMMENT ON COLUMN public.order_items.drug_id IS 'Foreign key to otc_drugs for OTC orders. NULL for prescription orders.';
