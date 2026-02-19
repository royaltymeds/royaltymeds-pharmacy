-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'fulfill'
  resource_type VARCHAR(50) NOT NULL, -- 'prescription', 'order', 'inventory', 'user', 'refill_request'
  resource_id UUID,
  table_name VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Only the fields that were changed
  ip_address VARCHAR(45),
  user_agent TEXT,
  details TEXT, -- Additional context or notes
  status VARCHAR(20), -- 'success', 'failed'
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);

-- RLS Policies: Only admins can view audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_select ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY audit_logs_admin_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- Allow inserts from API layer with service role

CREATE POLICY audit_logs_admin_delete ON audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to log changes automatically
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_table_name VARCHAR,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success'
)
RETURNS void AS $$
DECLARE
  v_changes JSONB;
  v_user_email VARCHAR;
BEGIN
  -- Get user email if user_id is provided
  SELECT email INTO v_user_email FROM users WHERE id = p_user_id;

  -- Calculate changes (only fields that differ)
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    WITH changed_fields AS (
      SELECT key
      FROM jsonb_each(p_new_values)
      WHERE jsonb_extract_path(p_old_values, ARRAY[key]) IS DISTINCT FROM jsonb_extract_path(p_new_values, ARRAY[key])
    )
    SELECT jsonb_object_agg(key, jsonb_extract_path(p_new_values, ARRAY[key]))
    INTO v_changes
    FROM changed_fields;
  ELSIF p_new_values IS NOT NULL THEN
    v_changes := p_new_values;
  ELSIF p_old_values IS NOT NULL THEN
    v_changes := p_old_values;
  END IF;

  -- Insert audit log record
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    table_name,
    old_values,
    new_values,
    changes,
    details,
    status
  ) VALUES (
    p_user_id,
    v_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_table_name,
    p_old_values,
    p_new_values,
    v_changes,
    p_details,
    p_status
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, JSONB, JSONB, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, JSONB, JSONB, TEXT, VARCHAR) TO service_role;

-- Create trigger function to auto-log changes on key tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      TG_TABLE_NAME,
      NULL,
      row_to_json(NEW),
      'Record created'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      TG_TABLE_NAME,
      row_to_json(OLD),
      row_to_json(NEW),
      'Record updated'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      TG_TABLE_NAME,
      row_to_json(OLD),
      NULL,
      'Record deleted'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on key tables
CREATE TRIGGER audit_prescriptions_trigger
AFTER INSERT OR UPDATE OR DELETE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_otc_drugs_trigger
AFTER INSERT OR UPDATE OR DELETE ON otc_drugs
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_prescription_drugs_trigger
AFTER INSERT OR UPDATE OR DELETE ON prescription_drugs
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_refill_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON refill_requests
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
