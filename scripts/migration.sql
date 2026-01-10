-- Using public schema (Supabase default)
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TABLE: users
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT CHECK (role IN ('patient', 'admin', 'doctor')) NOT NULL DEFAULT 'patient',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================
-- TABLE: user_profiles
-- =====================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  license_number TEXT,
  license_state TEXT,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- =====================
-- TABLE: prescriptions
-- =====================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'filled')) NOT NULL DEFAULT 'pending',
  file_url TEXT NOT NULL,
  medication_name TEXT,
  dosage TEXT,
  quantity INTEGER,
  refills_allowed INTEGER DEFAULT 0,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- =====================
-- TABLE: orders
-- =====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'in_transit', 'delivered', 'cancelled')) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  delivery_type TEXT CHECK (delivery_type IN ('pickup', 'delivery')) DEFAULT 'delivery',
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  tracking_number TEXT,
  estimated_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_prescription_id ON orders(prescription_id);
CREATE INDEX idx_orders_status ON orders(status);

-- =====================
-- TABLE: prescription_items
-- =====================
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id UUID,
  brand_choice TEXT CHECK (brand_choice IN ('brand', 'generic')) DEFAULT 'generic',
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescription_items_prescription_id ON prescription_items(prescription_id);

-- =====================
-- TABLE: refills
-- =====================
CREATE TABLE refills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refill_number INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'requested', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refills_prescription_id ON refills(prescription_id);
CREATE INDEX idx_refills_patient_id ON refills(patient_id);
CREATE INDEX idx_refills_status ON refills(status);

-- =====================
-- TABLE: deliveries
-- =====================
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed')) DEFAULT 'pending',
  tracking_url TEXT,
  delivery_notes TEXT,
  signature_required BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_courier_id ON deliveries(courier_id);

-- =====================
-- TABLE: messages
-- =====================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);

-- =====================
-- TABLE: reviews
-- =====================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_patient_id ON reviews(patient_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);

-- =====================
-- TABLE: testimonials
-- =====================
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- TABLE: payments
-- =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_id TEXT,
  transaction_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);

-- =====================
-- TABLE: audit_logs
-- =====================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================
-- RLS: Row Level Security Policies
-- =====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refills ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can view/edit only their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (user_id::text = current_user_id());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id::text = current_user_id());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (current_user_role() = 'admin');

-- Prescriptions: Patients see their own, Admins see all, Doctors see their submissions
CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Doctors can view their submitted prescriptions"
  ON prescriptions FOR SELECT
  USING (doctor_id::text = current_user_id());

CREATE POLICY "Admins can view all prescriptions"
  ON prescriptions FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "Patients can insert prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

CREATE POLICY "Doctors can insert prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (doctor_id::text = current_user_id());

CREATE POLICY "Admins can update prescriptions"
  ON prescriptions FOR UPDATE
  USING (current_user_role() = 'admin');

-- Orders: Patients see their own, Admins see all
CREATE POLICY "Patients can view own orders"
  ON orders FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "Patients can insert orders"
  ON orders FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (current_user_role() = 'admin');

-- Messages: Users can view messages they are part of
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id::text = current_user_id() OR recipient_id::text = current_user_id());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id::text = current_user_id());

-- Reviews: Users can view reviews, Patients can create reviews for their orders
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Patients can create reviews for their orders"
  ON reviews FOR INSERT
  WITH CHECK (patient_id::text = current_user_id());

-- Testimonials: Public read, Admin approval required
CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Admins can view all testimonials"
  ON testimonials FOR SELECT
  USING (current_user_role() = 'admin');

-- Payments: Patients see their own, Admins see all
CREATE POLICY "Patients can view own payments"
  ON payments FOR SELECT
  USING (patient_id::text = current_user_id());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (current_user_role() = 'admin');

-- Audit Logs: Admins only
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (current_user_role() = 'admin');

-- =====================
-- FUNCTIONS
-- =====================

-- Get current user ID (from JWT claim)
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    ''
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Get current user role (from JWT claim)
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'patient'
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create audit log entry
CREATE OR REPLACE FUNCTION audit_log_action(
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

-- =====================
-- TRIGGERS
-- =====================

-- Update updated_at on users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on prescriptions
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on refills
CREATE TRIGGER update_refills_updated_at BEFORE UPDATE ON refills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on deliveries
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on reviews
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on testimonials
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on payments
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- SAMPLE DATA (Optional, for testing)
-- =====================

-- INSERT INTO users (email, role) VALUES
-- ('admin@com', 'admin'),
-- ('patient@example.com', 'patient'),
-- ('doctor@example.com', 'doctor');
