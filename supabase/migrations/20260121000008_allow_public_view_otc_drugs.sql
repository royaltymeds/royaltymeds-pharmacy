-- Fix: Allow authenticated users to view OTC drugs for checkout
-- The cart checkout needs to read drug prices when creating orders
-- Currently only admins can view otc_drugs, which breaks the checkout flow

-- Drop existing admin-only SELECT policy
DROP POLICY IF EXISTS "Admin can view and select OTC drugs" ON otc_drugs;

-- Create policy that allows viewing but restricts modifications to admins
CREATE POLICY "Public can view OTC drugs"
  ON otc_drugs FOR SELECT
  USING (true);
