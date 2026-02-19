-- Add sales/clearance category columns to OTC drugs
ALTER TABLE otc_drugs ADD COLUMN category_type VARCHAR(20) DEFAULT 'regular' CHECK (category_type IN ('regular', 'sale', 'clearance'));
ALTER TABLE otc_drugs ADD COLUMN sale_price DECIMAL(10, 2);
ALTER TABLE otc_drugs ADD COLUMN sale_discount_percent INT;
ALTER TABLE otc_drugs ADD COLUMN sale_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE otc_drugs ADD COLUMN sale_end_date TIMESTAMP WITH TIME ZONE;

-- Add sales/clearance category columns to Prescription drugs
ALTER TABLE prescription_drugs ADD COLUMN category_type VARCHAR(20) DEFAULT 'regular' CHECK (category_type IN ('regular', 'sale', 'clearance'));
ALTER TABLE prescription_drugs ADD COLUMN sale_price DECIMAL(10, 2);
ALTER TABLE prescription_drugs ADD COLUMN sale_discount_percent INT;
ALTER TABLE prescription_drugs ADD COLUMN sale_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescription_drugs ADD COLUMN sale_end_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for sale filtering
CREATE INDEX idx_otc_drugs_category_type ON otc_drugs(category_type);
CREATE INDEX idx_otc_drugs_sale_dates ON otc_drugs(sale_start_date, sale_end_date);

CREATE INDEX idx_prescription_drugs_category_type ON prescription_drugs(category_type);
CREATE INDEX idx_prescription_drugs_sale_dates ON prescription_drugs(sale_start_date, sale_end_date);

-- Create function to auto-expire sales based on end date
CREATE OR REPLACE FUNCTION expire_completed_sales()
RETURNS void AS $$
BEGIN
  -- Update OTC drugs that have passed their sale_end_date
  UPDATE otc_drugs 
  SET category_type = 'regular', sale_price = NULL, sale_discount_percent = NULL, sale_start_date = NULL, sale_end_date = NULL
  WHERE category_type = 'sale' AND sale_end_date < CURRENT_TIMESTAMP;

  -- Update Prescription drugs that have passed their sale_end_date
  UPDATE prescription_drugs 
  SET category_type = 'regular', sale_price = NULL, sale_discount_percent = NULL, sale_start_date = NULL, sale_end_date = NULL
  WHERE category_type = 'sale' AND sale_end_date < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (for scheduled jobs)
GRANT EXECUTE ON FUNCTION expire_completed_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_completed_sales() TO anon;
