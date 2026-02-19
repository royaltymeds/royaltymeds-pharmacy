-- Add file_url column to otc_drugs table for image uploads
ALTER TABLE otc_drugs 
ADD COLUMN file_url TEXT;

-- Add file_url column to prescription_drugs table for image uploads
ALTER TABLE prescription_drugs 
ADD COLUMN file_url TEXT;

-- Create indexes for file_url columns for faster lookups
CREATE INDEX idx_otc_drugs_file_url ON otc_drugs(file_url);
CREATE INDEX idx_prescription_drugs_file_url ON prescription_drugs(file_url);
