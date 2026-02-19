-- This migration creates the default admin account
-- Admin Email: royaltymedsadmin@royaltymeds.com  
-- Admin Password: Options123$
-- Note: The auth user will be created via the Supabase dashboard or the API
-- This just creates the user record in the public.users table

-- Wait for auth user to be created first, then create the user profile
-- If auth user ID: [TO_BE_FILLED_FROM_SUPABASE]

-- For now, we'll create a note about how to create this
-- The actual creation will be done via SQL in Supabase dashboard

-- Steps to create default admin:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Create new user"
-- 3. Email: royaltymedsadmin@royaltymeds.com
-- 4. Password: Options123$
-- 5. Get the user ID from the created user
-- 6. Run the following SQL in Supabase SQL Editor:

/*
INSERT INTO public.users (id, email, role, is_active)
VALUES (
  '[USER_ID_FROM_STEP_5]',
  'royaltymedsadmin@royaltymeds.com',
  'admin',
  true
);

INSERT INTO public.user_profiles (user_id, full_name)
VALUES (
  '[USER_ID_FROM_STEP_5]',
  'RoyaltyMeds Admin'
);
*/
