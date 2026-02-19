-- Add file upload columns to doctor_prescriptions table
ALTER TABLE public.doctor_prescriptions
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text;

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_patient_id ON public.doctor_prescriptions(patient_id);

-- Create index on doctor_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_doctor_id ON public.doctor_prescriptions(doctor_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_status ON public.doctor_prescriptions(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_created_at ON public.doctor_prescriptions(created_at DESC);
