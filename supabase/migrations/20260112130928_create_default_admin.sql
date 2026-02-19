-- Create default admin account
-- Admin ID: 550e8400-e29b-41d4-a716-446655440000
-- Email: royaltymedsadmin@royaltymeds.com
-- Note: The auth user must be created separately in Supabase Auth

-- Insert admin user record
INSERT INTO public.users (id, email, role, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'royaltymedsadmin@royaltymeds.com',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert admin user profile
INSERT INTO public.user_profiles (user_id, full_name, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'RoyaltyMeds Admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Grant proper permissions for admin to manage their data
-- This ensures RLS policies work correctly for the default admin
