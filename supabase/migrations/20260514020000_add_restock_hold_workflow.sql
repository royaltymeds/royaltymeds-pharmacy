-- Add restock hold support for supplier out-of-stock scenarios.

ALTER TABLE public.restock_requests
  DROP CONSTRAINT IF EXISTS restock_requests_status_check;

ALTER TABLE public.restock_requests
  ADD CONSTRAINT restock_requests_status_check
  CHECK (status IN ('requested', 'linked_to_po', 'received', 'cancelled', 'on_hold'));

ALTER TABLE public.restock_items
  ALTER COLUMN restock_request_id DROP NOT NULL;

ALTER TABLE public.restock_items
  ADD COLUMN IF NOT EXISTS held_from_request_id uuid,
  ADD COLUMN IF NOT EXISTS hold_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS held_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS held_by uuid,
  ADD COLUMN IF NOT EXISTS hold_notes text;

ALTER TABLE public.restock_items
  DROP CONSTRAINT IF EXISTS restock_items_hold_status_check;

ALTER TABLE public.restock_items
  ADD CONSTRAINT restock_items_hold_status_check
  CHECK (hold_status IN ('active', 'on_hold'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restock_items_held_from_request_id_fkey'
      AND conrelid = 'public.restock_items'::regclass
  ) THEN
    ALTER TABLE public.restock_items
      ADD CONSTRAINT restock_items_held_from_request_id_fkey
      FOREIGN KEY (held_from_request_id) REFERENCES public.restock_requests(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restock_items_held_by_fkey'
      AND conrelid = 'public.restock_items'::regclass
  ) THEN
    ALTER TABLE public.restock_items
      ADD CONSTRAINT restock_items_held_by_fkey
      FOREIGN KEY (held_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restock_items_hold_status ON public.restock_items(hold_status);
CREATE INDEX IF NOT EXISTS idx_restock_items_held_from_request_id ON public.restock_items(held_from_request_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status_supplier_hold ON public.restock_requests(status, supplier_id);
