-- Add doctor_prescription_id column to prescription_items to support doctor prescriptions
ALTER TABLE public.prescription_items
ADD COLUMN IF NOT EXISTS doctor_prescription_id uuid;

-- Add foreign key constraint for doctor_prescriptions
ALTER TABLE public.prescription_items
ADD CONSTRAINT prescription_items_doctor_prescription_id_fkey 
FOREIGN KEY (doctor_prescription_id) REFERENCES public.doctor_prescriptions(id) ON DELETE CASCADE;
