-- Create OTC Drugs table
CREATE TABLE otc_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., "Pain Relief", "Cold & Flu", "Digestive"
  sub_category TEXT NOT NULL, -- e.g., "Acetaminophen", "Ibuprofen", "Antacid"
  manufacturer TEXT,
  sku TEXT UNIQUE NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  unit_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  description TEXT,
  indications TEXT, -- What it's used for
  warnings TEXT, -- Important warnings
  side_effects TEXT, -- Possible side effects
  dosage TEXT, -- Recommended dosage
  active_ingredient TEXT, -- e.g., "Ibuprofen 200mg"
  strength TEXT, -- e.g., "200mg", "500mg"
  pack_size TEXT, -- e.g., "30 tablets", "100ml"
  expiration_date DATE,
  lot_number TEXT,
  status TEXT CHECK (status IN ('active', 'discontinued', 'out_of_stock')) DEFAULT 'active',
  low_stock_alert BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Prescription Drugs table
CREATE TABLE prescription_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., "Antibiotics", "Pain Management", "Cardiovascular"
  sub_category TEXT NOT NULL, -- e.g., "Penicillin", "Opioid", "ACE Inhibitor"
  manufacturer TEXT,
  sku TEXT UNIQUE NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 20,
  reorder_quantity INTEGER NOT NULL DEFAULT 100,
  unit_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  description TEXT,
  indications TEXT, -- What it's used for
  warnings TEXT, -- Important warnings and contraindications
  side_effects TEXT, -- Possible side effects
  dosage TEXT, -- Standard dosage
  active_ingredient TEXT, -- e.g., "Amoxicillin 500mg"
  strength TEXT, -- e.g., "500mg", "1000mg"
  pack_size TEXT, -- e.g., "30 tablets", "100ml"
  requires_refrigeration BOOLEAN DEFAULT false,
  controlled_substance BOOLEAN DEFAULT false, -- DEA schedule tracking
  expiration_date DATE,
  lot_number TEXT,
  status TEXT CHECK (status IN ('active', 'discontinued', 'out_of_stock')) DEFAULT 'active',
  low_stock_alert BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_otc_drugs_category ON otc_drugs(category);
CREATE INDEX idx_otc_drugs_status ON otc_drugs(status);
CREATE INDEX idx_otc_drugs_sku ON otc_drugs(sku);
CREATE INDEX idx_otc_drugs_name ON otc_drugs(name);
CREATE INDEX idx_otc_drugs_quantity ON otc_drugs(quantity_on_hand);

CREATE INDEX idx_prescription_drugs_category ON prescription_drugs(category);
CREATE INDEX idx_prescription_drugs_status ON prescription_drugs(status);
CREATE INDEX idx_prescription_drugs_sku ON prescription_drugs(sku);
CREATE INDEX idx_prescription_drugs_name ON prescription_drugs(name);
CREATE INDEX idx_prescription_drugs_quantity ON prescription_drugs(quantity_on_hand);

-- Create RLS policies for OTC drugs (allow admins full access)
ALTER TABLE otc_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view OTC drugs"
  ON otc_drugs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert OTC drugs"
  ON otc_drugs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can update OTC drugs"
  ON otc_drugs FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can delete OTC drugs"
  ON otc_drugs FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for Prescription drugs (allow admins full access)
ALTER TABLE prescription_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view prescription drugs"
  ON prescription_drugs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert prescription drugs"
  ON prescription_drugs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can update prescription drugs"
  ON prescription_drugs FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can delete prescription drugs"
  ON prescription_drugs FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create Inventory Transactions table for audit trail
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id UUID NOT NULL,
  drug_type TEXT NOT NULL CHECK (drug_type IN ('otc', 'prescription')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('adjustment', 'purchase', 'sale', 'expiration', 'damage')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_transactions_drug ON inventory_transactions(drug_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(created_at);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view inventory transactions"
  ON inventory_transactions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
