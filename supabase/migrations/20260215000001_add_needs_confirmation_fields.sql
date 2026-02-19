-- Add needs_confirmation field for OTC items that require customer confirmation before order processing
-- Date: February 15, 2026
-- Purpose: Track which OTC items require customer confirmation for orders

-- Add column to otc_drugs table
ALTER TABLE public.otc_drugs
ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN DEFAULT FALSE;

-- Add column to order_items table to track confirmation status
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN DEFAULT FALSE;

-- Create index for querying items that need confirmation
CREATE INDEX IF NOT EXISTS idx_otc_drugs_needs_confirmation ON public.otc_drugs(needs_confirmation) 
WHERE needs_confirmation = TRUE;

CREATE INDEX IF NOT EXISTS idx_order_items_needs_confirmation ON public.order_items(needs_confirmation) 
WHERE needs_confirmation = TRUE;
