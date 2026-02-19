-- Add frequency column to doctor_prescriptions_items table
-- This column stores how often to take the medication (e.g., "twice daily", "once daily")

ALTER TABLE public.doctor_prescriptions_items
ADD COLUMN frequency TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_frequency 
ON public.doctor_prescriptions_items(frequency);
