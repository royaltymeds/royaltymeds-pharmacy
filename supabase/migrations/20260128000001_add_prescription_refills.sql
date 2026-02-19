-- Prescription Refills Implementation
-- Migration for adding refill functionality to prescriptions
-- Date: January 28, 2026

-- 1. Add refill-related columns to prescriptions table
ALTER TABLE prescriptions
ADD COLUMN refill_count INT DEFAULT 0,
ADD COLUMN refill_limit INT DEFAULT 5,
ADD COLUMN last_refilled_at TIMESTAMP,
ADD COLUMN is_refillable BOOLEAN DEFAULT FALSE;

-- 2. Create refill_requests table for managing refill requests
CREATE TABLE refill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP NOT NULL DEFAULT now(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, fulfilled, expired
  notes TEXT,
  reason TEXT, -- Patient's reason for refill request
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX idx_refill_requests_prescription_id ON refill_requests(prescription_id);
CREATE INDEX idx_refill_requests_patient_id ON refill_requests(patient_id);
CREATE INDEX idx_refill_requests_status ON refill_requests(status);
CREATE INDEX idx_refill_requests_requested_at ON refill_requests(requested_at DESC);
CREATE INDEX idx_prescriptions_refill_count ON prescriptions(refill_count);

-- 4. Update prescriptions table to track refill status
-- Add refill_status column to prescriptions to help identify refillable prescriptions
ALTER TABLE prescriptions
ADD COLUMN refill_status VARCHAR(20) DEFAULT 'active'; -- active, refill_pending, refill_rejected, expired

-- 5. Create RLS (Row Level Security) policies for refill_requests

-- Enable RLS on refill_requests table
ALTER TABLE refill_requests ENABLE ROW LEVEL SECURITY;

-- Patients can view their own refill requests
CREATE POLICY patients_view_own_refill_requests ON refill_requests
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can create refill requests for their prescriptions
CREATE POLICY patients_create_refill_requests ON refill_requests
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Doctors/Admins can view all refill requests using service role
-- (This is handled in the API, not via RLS)

-- 6. Create function to auto-mark refills as expired after prescription end date
-- (Optional: scheduled job or trigger-based)
CREATE OR REPLACE FUNCTION expire_old_refill_requests()
RETURNS void AS $$
BEGIN
  UPDATE refill_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND prescription_id IN (
      SELECT id FROM prescriptions
      WHERE status IN ('filled', 'partially_filled')
        AND refill_count >= refill_limit
        AND requested_at < now() - INTERVAL '90 days'
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to validate refill eligibility
CREATE OR REPLACE FUNCTION can_refill_prescription(p_prescription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  refill_count INT;
  refill_limit INT;
BEGIN
  SELECT refill_count, refill_limit INTO refill_count, refill_limit
  FROM prescriptions
  WHERE id = p_prescription_id;
  
  RETURN (refill_count < refill_limit);
END;
$$ LANGUAGE plpgsql;
