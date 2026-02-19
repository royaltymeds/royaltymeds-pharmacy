-- Add refill_requested status to doctor_prescriptions table
-- This migration expands the status CHECK constraint to include 'refill_requested'

-- First, update any doctor_prescriptions with invalid/unexpected statuses to 'pending'
-- This is a safety measure in case there are orphaned rows from development
UPDATE doctor_prescriptions
SET status = 'pending'
WHERE status NOT IN ('pending', 'approved', 'rejected', 'processing', 'partially_filled', 'filled');

-- Drop the existing CHECK constraint
ALTER TABLE doctor_prescriptions
DROP CONSTRAINT doctor_prescriptions_status_check;

-- Add the new constraint with all valid statuses including 'refill_requested'
ALTER TABLE doctor_prescriptions
ADD CONSTRAINT doctor_prescriptions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'partially_filled', 'filled', 'refill_requested'));
