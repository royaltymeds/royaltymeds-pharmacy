-- Add duration column to doctor_prescriptions_items table
-- This column stores the medication duration per item instead of per prescription

ALTER TABLE public.doctor_prescriptions_items
ADD COLUMN duration TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_duration 
ON public.doctor_prescriptions_items(duration);
