-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('order_confirmation', 'order_shipped', 'prescription_approved', 'refill_approved', 'refill_rejected', 'password_reset', 'verification', 'custom')),
  subject TEXT NOT NULL,
  htmlContent TEXT NOT NULL,
  textContent TEXT,
  variables TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipientEmail TEXT NOT NULL,
  subject TEXT NOT NULL,
  templateType TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked')),
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  failureReason TEXT,
  messageId TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  orderUpdates BOOLEAN DEFAULT true,
  prescriptionUpdates BOOLEAN DEFAULT true,
  promotionalEmails BOOLEAN DEFAULT false,
  weeklyNewsletter BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipientEmail ON email_logs(recipientEmail);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sentAt ON email_logs(sentAt DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_templateType ON email_logs(templateType);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role (admin API) to manage templates
CREATE POLICY "Allow email template operations" ON email_templates
  FOR ALL USING (true);

-- RLS Policy: Allow service role (admin API) to manage logs
CREATE POLICY "Allow email log operations" ON email_logs
  FOR ALL USING (true);

-- RLS Policy: Users can manage their own preferences
CREATE POLICY "Users can manage their preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all preferences
CREATE POLICY "Allow email preference operations" ON email_preferences
  FOR ALL USING (true);

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, htmlContent, textContent, variables, enabled)
VALUES
  (
    'order_confirmation_template',
    'order_confirmation',
    'Order Confirmation - {{orderId}}',
    '<h2>Order Confirmation</h2><p>Thank you for your order!</p><p><strong>Order ID:</strong> {{orderId}}</p><p><strong>Amount:</strong> ${{amount}}</p>',
    'Order Confirmation\n\nThank you for your order!\n\nOrder ID: {{orderId}}\nAmount: ${{amount}}',
    ARRAY['orderId', 'amount', 'items'],
    true
  ),
  (
    'order_shipped_template',
    'order_shipped',
    'Your Order Has Shipped',
    '<h2>Order Shipped</h2><p>Your order has been shipped!</p><p><strong>Tracking Number:</strong> {{trackingNumber}}</p>',
    'Order Shipped\n\nYour order has been shipped!\n\nTracking Number: {{trackingNumber}}',
    ARRAY['orderId', 'trackingNumber', 'estimatedDelivery'],
    true
  ),
  (
    'prescription_approved_template',
    'prescription_approved',
    'Your Prescription Has Been Approved',
    '<h2>Prescription Approved</h2><p>Your prescription has been approved by the pharmacist.</p><p><strong>Medication:</strong> {{medicationName}}</p>',
    'Prescription Approved\n\nYour prescription has been approved.\n\nMedication: {{medicationName}}',
    ARRAY['prescriptionId', 'medicationName', 'quantity'],
    true
  ),
  (
    'refill_approved_template',
    'refill_approved',
    'Your Refill Has Been Approved',
    '<h2>Refill Approved</h2><p>Your prescription refill has been approved!</p><p><strong>Medication:</strong> {{medicationName}}</p>',
    'Refill Approved\n\nYour prescription refill has been approved!\n\nMedication: {{medicationName}}',
    ARRAY['prescriptionId', 'medicationName', 'refillsRemaining'],
    true
  ),
  (
    'refill_rejected_template',
    'refill_rejected',
    'Refill Request Update',
    '<h2>Refill Rejected</h2><p>Your refill request has been rejected.</p><p><strong>Reason:</strong> {{reason}}</p>',
    'Refill Rejected\n\nYour refill request has been rejected.\n\nReason: {{reason}}',
    ARRAY['prescriptionId', 'medicationName', 'reason'],
    true
  )
ON CONFLICT (name) DO NOTHING;
