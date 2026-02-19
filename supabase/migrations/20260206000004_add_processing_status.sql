-- Add processing status to prescriptions table
-- This migration expands the status CHECK constraint to include 'processing'

-- Drop the existing CHECK constraint
ALTER TABLE prescriptions
DROP CONSTRAINT prescriptions_status_check;

-- Add the new constraint with all valid statuses including 'processing'
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'filled', 'partially_filled', 'dispensing', 'processing', 'refill_requested'));
