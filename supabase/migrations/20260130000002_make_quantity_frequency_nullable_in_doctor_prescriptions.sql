-- Make quantity and frequency nullable in doctor_prescriptions
-- Since medications are now stored in prescription_items table
ALTER TABLE public.doctor_prescriptions
ALTER COLUMN quantity DROP NOT NULL,
ALTER COLUMN frequency DROP NOT NULL;
