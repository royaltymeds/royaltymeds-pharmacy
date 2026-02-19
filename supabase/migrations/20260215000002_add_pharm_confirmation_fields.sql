-- Add pharmacist confirmation requirement for OTC items
-- Date: February 15, 2026
-- Purpose: Track which OTC items require pharmacist confirmation before order processing

-- Add column to otc_drugs table
ALTER TABLE public.otc_drugs
ADD COLUMN IF NOT EXISTS pharm_confirm BOOLEAN DEFAULT FALSE;

-- Add column to order_items table to track confirmation status
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS pharm_confirm BOOLEAN DEFAULT FALSE;

-- Create index for querying items that need pharmacist confirmation
CREATE INDEX IF NOT EXISTS idx_otc_drugs_pharm_confirm ON public.otc_drugs(pharm_confirm) 
WHERE pharm_confirm = TRUE;

CREATE INDEX IF NOT EXISTS idx_order_items_pharm_confirm ON public.order_items(pharm_confirm) 
WHERE pharm_confirm = TRUE;
