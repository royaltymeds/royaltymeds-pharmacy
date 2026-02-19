-- =====================
-- Add prescription_number column to doctor_prescriptions table
-- =====================

ALTER TABLE public.doctor_prescriptions
ADD COLUMN IF NOT EXISTS prescription_number TEXT UNIQUE;

-- Create index for prescription number lookups
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_prescription_number 
ON public.doctor_prescriptions(prescription_number);
