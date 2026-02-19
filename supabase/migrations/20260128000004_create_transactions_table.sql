-- Create transactions table for tracking all financial transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund', 'adjustment', 'credit')),
  method VARCHAR(50) NOT NULL CHECK (method IN ('card', 'bank_transfer', 'cash', 'insurance', 'wallet')),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(100), -- External payment gateway reference (Stripe, PayPal, etc.)
  description TEXT,
  metadata JSONB, -- Additional context (payment_method_id, customer_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT
);

-- Add transaction_id to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Patients can view their own transactions
CREATE POLICY transactions_patient_select ON transactions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can insert transactions (for payment processing)
CREATE POLICY transactions_admin_insert ON transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update transactions
CREATE POLICY transactions_admin_update ON transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to calculate monthly transaction summary
CREATE OR REPLACE FUNCTION get_monthly_transaction_summary(p_user_id UUID, p_month INT, p_year INT)
RETURNS TABLE(
  total_payments DECIMAL,
  total_refunds DECIMAL,
  total_adjustments DECIMAL,
  transaction_count INT,
  completed_count INT,
  failed_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'payment' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COALESCE(SUM(CASE WHEN type = 'adjustment' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COUNT(*)::INT,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INT,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INT
  FROM transactions
  WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_monthly_transaction_summary(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_transaction_summary(UUID, INT, INT) TO service_role;

-- Create function to get transaction stats for admin dashboard
CREATE OR REPLACE FUNCTION get_transaction_stats(p_days INT DEFAULT 30)
RETURNS TABLE(
  total_revenue DECIMAL,
  total_refunds DECIMAL,
  net_revenue DECIMAL,
  transaction_count INT,
  average_transaction DECIMAL,
  payment_methods TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'payment' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COALESCE(SUM(CASE WHEN type = 'payment' AND status = 'completed' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0::DECIMAL),
    COUNT(*)::INT,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END), 0::DECIMAL),
    ARRAY_AGG(DISTINCT method)
  FROM transactions
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_transaction_stats(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_stats(INT) TO service_role;
