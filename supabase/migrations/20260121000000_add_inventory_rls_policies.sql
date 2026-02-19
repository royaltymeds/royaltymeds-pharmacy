-- Add RLS policies for inventory tables (otc_drugs and prescription_drugs)
-- These policies allow admins to perform full CRUD operations

-- Drop existing policies if they exist (from manual application)
DROP POLICY IF EXISTS "Admin can select OTC drugs" ON otc_drugs;
DROP POLICY IF EXISTS "Admin can insert OTC drugs" ON otc_drugs;
DROP POLICY IF EXISTS "Admin can update OTC drugs" ON otc_drugs;
DROP POLICY IF EXISTS "Admin can delete OTC drugs" ON otc_drugs;
DROP POLICY IF EXISTS "Admin can select prescription drugs" ON prescription_drugs;
DROP POLICY IF EXISTS "Admin can insert prescription drugs" ON prescription_drugs;
DROP POLICY IF EXISTS "Admin can update prescription drugs" ON prescription_drugs;
DROP POLICY IF EXISTS "Admin can delete prescription drugs" ON prescription_drugs;
DROP POLICY IF EXISTS "Admin can select inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Admin can insert inventory transactions" ON inventory_transactions;

-- OTC Drugs Policies
CREATE POLICY "Admin can select OTC drugs"
  ON otc_drugs FOR SELECT
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can insert OTC drugs"
  ON otc_drugs FOR INSERT
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can update OTC drugs"
  ON otc_drugs FOR UPDATE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can delete OTC drugs"
  ON otc_drugs FOR DELETE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- Prescription Drugs Policies
CREATE POLICY "Admin can select prescription drugs"
  ON prescription_drugs FOR SELECT
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can insert prescription drugs"
  ON prescription_drugs FOR INSERT
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can update prescription drugs"
  ON prescription_drugs FOR UPDATE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can delete prescription drugs"
  ON prescription_drugs FOR DELETE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- Inventory Transactions Policies
CREATE POLICY "Admin can select inventory transactions"
  ON inventory_transactions FOR SELECT
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

