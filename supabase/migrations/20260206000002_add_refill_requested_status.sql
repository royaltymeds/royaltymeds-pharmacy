-- Add refill_requested status to prescriptions table
-- This migration expands the status CHECK constraint to include 'refill_requested'

-- First, update any prescriptions with invalid/unexpected statuses to 'pending'
-- This is a safety measure in case there are orphaned rows from development
UPDATE prescriptions
SET status = 'pending'
WHERE status NOT IN ('pending', 'approved', 'rejected', 'filled', 'partially_filled', 'dispensing');

-- Drop the existing CHECK constraint
ALTER TABLE prescriptions
DROP CONSTRAINT prescriptions_status_check;

-- Add the new constraint with all valid statuses including 'refill_requested'
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'filled', 'partially_filled', 'dispensing', 'refill_requested'));
