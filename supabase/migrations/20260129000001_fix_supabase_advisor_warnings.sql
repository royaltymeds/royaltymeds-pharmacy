-- Fix Supabase Advisor Warnings
-- Date: January 29, 2026

-- 1. Fix Function Search Path Mutable warnings
-- Add SET search_path = public to all functions to prevent privilege escalation

-- Fix expire_old_refill_requests function
CREATE OR REPLACE FUNCTION expire_old_refill_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE refill_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND prescription_id IN (
      SELECT id FROM prescriptions
      WHERE status IN ('filled', 'partially_filled')
        AND refill_count >= refill_limit
        AND requested_at < now() - INTERVAL '90 days'
    );
END;
$$;

-- Fix can_refill_prescription function
CREATE OR REPLACE FUNCTION can_refill_prescription(p_prescription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  refill_count INT;
  refill_limit INT;
BEGIN
  SELECT refill_count, refill_limit INTO refill_count, refill_limit
  FROM prescriptions
  WHERE id = p_prescription_id;
  
  RETURN (refill_count < refill_limit);
END;
$$;

-- Fix expire_completed_sales function
CREATE OR REPLACE FUNCTION expire_completed_sales()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix get_monthly_transaction_summary function
CREATE OR REPLACE FUNCTION get_monthly_transaction_summary(p_user_id UUID, p_month INT, p_year INT)
RETURNS TABLE(
  total_payments DECIMAL,
  total_refunds DECIMAL,
  total_adjustments DECIMAL,
  transaction_count INT,
  completed_count INT,
  failed_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix get_transaction_stats function
CREATE OR REPLACE FUNCTION get_transaction_stats(p_days INT DEFAULT 30)
RETURNS TABLE(
  total_revenue DECIMAL,
  total_refunds DECIMAL,
  net_revenue DECIMAL,
  transaction_count INT,
  average_transaction DECIMAL,
  payment_methods TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix get_conversations_with_latest_message function
CREATE OR REPLACE FUNCTION get_conversations_with_latest_message(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  participant_ids UUID[],
  subject VARCHAR,
  conversation_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  latest_message_content TEXT,
  latest_message_sender_id UUID,
  latest_message_created_at TIMESTAMP WITH TIME ZONE,
  unread_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.participant_ids,
    c.subject,
    c.conversation_type,
    c.created_at,
    c.updated_at,
    m.content,
    m.sender_id,
    m.created_at,
    COUNT(CASE WHEN NOT (m.read_by @> ARRAY[p_user_id]::uuid[]) AND m.sender_id != p_user_id THEN 1 END)::INT
  FROM conversations c
  LEFT JOIN LATERAL (
    SELECT * FROM messages
    WHERE messages.conversation_id = c.id
    ORDER BY messages.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE p_user_id = ANY(c.participant_ids)
  GROUP BY c.id, c.participant_ids, c.subject, c.conversation_type, c.created_at, c.updated_at, m.content, m.sender_id, m.created_at;
END;
$$;

-- Fix mark_conversation_as_read function
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark all messages in the conversation as read by the user
  UPDATE messages
  SET read_by = ARRAY_APPEND(read_by, p_user_id)
  WHERE conversation_id = p_conversation_id
    AND NOT (read_by @> ARRAY[p_user_id]::uuid[])
    AND sender_id != p_user_id;
END;
$$;

-- 2. Fix RLS Policy "Always True" warnings
-- Replace overly permissive policies with proper role checks

-- Fix email_templates table policies
DROP POLICY IF EXISTS "Allow email template operations" ON email_templates;

-- Admin/service role can manage all templates
CREATE POLICY email_templates_admin_all ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'pharmacist')
    )
  );

-- Fix email_logs table policies
DROP POLICY IF EXISTS "Allow email log operations" ON email_logs;

-- Admin/service role can view and manage logs
CREATE POLICY email_logs_admin_all ON email_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'pharmacist')
    )
  );

-- Fix email_preferences table policies
DROP POLICY IF EXISTS "Allow email preference operations" ON email_preferences;

-- Users can manage their own preferences
CREATE POLICY email_preferences_user_self ON email_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY email_preferences_admin_select ON email_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
