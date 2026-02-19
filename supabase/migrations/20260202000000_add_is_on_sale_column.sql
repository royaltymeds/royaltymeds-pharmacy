-- Add is_on_sale column to otc_drugs table
ALTER TABLE public.otc_drugs
ADD COLUMN is_on_sale boolean DEFAULT false;

-- Add is_on_sale column to prescription_drugs table
ALTER TABLE public.prescription_drugs
ADD COLUMN is_on_sale boolean DEFAULT false;

-- Create indexes for better query performance on sale items
CREATE INDEX IF NOT EXISTS idx_otc_drugs_is_on_sale ON public.otc_drugs(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_prescription_drugs_is_on_sale ON public.prescription_drugs(is_on_sale);

-- Update is_on_sale based on sale_start_date and sale_end_date for otc_drugs
UPDATE public.otc_drugs
SET is_on_sale = true
WHERE sale_start_date IS NOT NULL 
  AND sale_end_date IS NOT NULL 
  AND now() >= sale_start_date 
  AND now() <= sale_end_date;

-- Update is_on_sale based on sale_start_date and sale_end_date for prescription_drugs
UPDATE public.prescription_drugs
SET is_on_sale = true
WHERE sale_start_date IS NOT NULL 
  AND sale_end_date IS NOT NULL 
  AND now() >= sale_start_date 
  AND now() <= sale_end_date;
