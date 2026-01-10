-- Security Fix: Add search_path to all functions to prevent privilege escalation
-- Issue: Supabase Advisor warning "Function Search Path Mutable"
-- Solution: Explicitly set search_path = public for all functions

-- Fix 1: Get current user ID
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    ''
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Fix 2: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'patient'
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Fix 3: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 4: Create audit log entry
CREATE OR REPLACE FUNCTION public.audit_log_action(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_changes)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
