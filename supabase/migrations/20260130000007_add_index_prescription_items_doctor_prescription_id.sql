-- Add index for doctor_prescription_id foreign key in prescription_items
CREATE INDEX IF NOT EXISTS idx_prescription_items_doctor_prescription_id ON public.prescription_items(doctor_prescription_id);
