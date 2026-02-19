-- Align doctor_prescriptions_items table with prescription_items table
-- Add missing columns to doctor_prescriptions_items to match prescription_items structure

ALTER TABLE public.doctor_prescriptions_items
ADD COLUMN IF NOT EXISTS medication_id UUID,
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS dosage TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_medication_id ON public.doctor_prescriptions_items(medication_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_dosage ON public.doctor_prescriptions_items(dosage);

-- Ensure frequency and duration columns exist as TEXT for consistency
-- (may already exist from previous migrations, but ensuring uniformity)
