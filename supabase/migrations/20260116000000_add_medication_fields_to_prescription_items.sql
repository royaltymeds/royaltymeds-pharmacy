-- Add medication_name and dosage columns to prescription_items
ALTER TABLE prescription_items
ADD COLUMN IF NOT EXISTS medication_name TEXT,
ADD COLUMN IF NOT EXISTS dosage TEXT;

-- Create index on prescription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_name 
ON prescription_items(medication_name);
