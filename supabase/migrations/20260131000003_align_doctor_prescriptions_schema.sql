-- Align doctor_prescriptions table with prescriptions table
-- Add missing columns to doctor_prescriptions to match prescriptions table structure

ALTER TABLE public.doctor_prescriptions
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS medication_name TEXT,
ADD COLUMN IF NOT EXISTS dosage TEXT,
ADD COLUMN IF NOT EXISTS refills_allowed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS prescription_number TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS filled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pharmacist_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_phone TEXT,
ADD COLUMN IF NOT EXISTS doctor_email TEXT,
ADD COLUMN IF NOT EXISTS practice_name TEXT,
ADD COLUMN IF NOT EXISTS practice_address TEXT,
ADD COLUMN IF NOT EXISTS refill_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS refill_limit INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_refilled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_refillable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refill_status VARCHAR(20) DEFAULT 'active';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_prescription_number ON public.doctor_prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_refill_count ON public.doctor_prescriptions(refill_count);
