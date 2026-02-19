-- Add quantity_filled column to prescription_items and doctor_prescriptions_items
-- This tracks how much of the prescription has been filled

ALTER TABLE public.prescription_items
ADD COLUMN IF NOT EXISTS quantity_filled INTEGER DEFAULT 0;

ALTER TABLE public.doctor_prescriptions_items
ADD COLUMN IF NOT EXISTS quantity_filled INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescription_items_quantity_filled ON public.prescription_items(quantity_filled);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_quantity_filled ON public.doctor_prescriptions_items(quantity_filled);
