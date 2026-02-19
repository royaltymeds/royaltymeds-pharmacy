-- Add total_amount column to prescription_items table
-- This tracks the initial quantity of medication added
-- Unlike quantity (which decreases as prescription is filled),
-- total_amount remains constant
ALTER TABLE prescription_items
ADD COLUMN IF NOT EXISTS total_amount INTEGER;

-- Update existing records to set total_amount equal to current quantity
UPDATE prescription_items
SET total_amount = quantity
WHERE total_amount IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescription_items_total_amount 
ON prescription_items(total_amount);
