-- Create doctor_patient_links table to track which patients are linked to which doctors
CREATE TABLE IF NOT EXISTS doctor_patient_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure a doctor can only link a patient once
  UNIQUE(doctor_id, patient_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctor_patient_links_doctor_id ON doctor_patient_links(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_links_patient_id ON doctor_patient_links(patient_id);

-- Enable RLS
ALTER TABLE doctor_patient_links ENABLE ROW LEVEL SECURITY;

-- RLS policy: Doctors can see their own links
CREATE POLICY "Doctors can view their patient links" ON doctor_patient_links
  FOR SELECT
  USING (
    doctor_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- RLS policy: Doctors can create links to patients
CREATE POLICY "Doctors can create patient links" ON doctor_patient_links
  FOR INSERT
  WITH CHECK (
    doctor_id = auth.uid()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'doctor'
  );

-- RLS policy: Doctors can delete their own links
CREATE POLICY "Doctors can delete their patient links" ON doctor_patient_links
  FOR DELETE
  USING (
    doctor_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
