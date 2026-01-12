-- =====================
-- TABLE: doctor_prescriptions
-- This table stores prescriptions submitted directly by doctors
-- =====================
CREATE TABLE IF NOT EXISTS doctor_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  quantity TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_doctor_id ON doctor_prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_patient_id ON doctor_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_status ON doctor_prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_created_at ON doctor_prescriptions(created_at);

-- =====================
-- RLS (Row Level Security) Policies for doctor_prescriptions
-- =====================
ALTER TABLE doctor_prescriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Doctors can view their own prescriptions
CREATE POLICY "doctor_prescriptions_doctor_access"
  ON doctor_prescriptions
  FOR SELECT
  USING (doctor_id = auth.uid());

-- Policy 2: Doctors can insert their own prescriptions
CREATE POLICY "doctor_prescriptions_doctor_insert"
  ON doctor_prescriptions
  FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- Policy 3: Doctors can delete their own pending prescriptions
CREATE POLICY "doctor_prescriptions_doctor_delete"
  ON doctor_prescriptions
  FOR DELETE
  USING (doctor_id = auth.uid() AND status = 'pending');

-- Policy 4: Admins can view all prescriptions
CREATE POLICY "doctor_prescriptions_admin_access"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 5: Admins can update prescription status
CREATE POLICY "doctor_prescriptions_admin_update"
  ON doctor_prescriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 6: Patients can view prescriptions submitted for them (optional)
CREATE POLICY "doctor_prescriptions_patient_access"
  ON doctor_prescriptions
  FOR SELECT
  USING (
    patient_id = auth.uid()
  );
