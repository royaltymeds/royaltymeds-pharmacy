# Admin Setup Guide

## Default Admin Account

**Email**: `royaltymedsadmin@royaltymeds.com`  
**Password**: `Options123$`  
**Role**: Admin

## Creating the Default Admin Account

### Option 1: Using the Setup API (Recommended)

Call the setup endpoint to automatically create the default admin:

```bash
curl -X POST http://localhost:3000/api/setup/create-default-admin \
  -H "Content-Type: application/json"
```

Or from PowerShell:

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/setup/create-default-admin" `
  -Method POST `
  -ContentType "application/json" `
  -Body "{}" `
  -UseBasicParsing

$response.Content | ConvertFrom-Json
```

Expected response:
```json
{
  "success": true,
  "message": "Default admin account created successfully",
  "admin": {
    "email": "royaltymedsadmin@royaltymeds.com",
    "password": "Options123$"
  }
}
```

### Option 2: Manual Setup via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **Create new user**
5. Fill in:
   - Email: `royaltymedsadmin@royaltymeds.com`
   - Password: `Options123$`
6. Click **Create user**
7. Copy the User ID from the created user
8. Go to **SQL Editor**
9. Run the following SQL:

```sql
INSERT INTO public.users (id, email, role, is_active)
VALUES (
  '[USER_ID_FROM_STEP_7]',
  'royaltymedsadmin@royaltymeds.com',
  'admin',
  true
);

INSERT INTO public.user_profiles (user_id, full_name)
VALUES (
  '[USER_ID_FROM_STEP_7]',
  'RoyaltyMeds Admin'
);
```

## Admin Login

1. Go to `http://localhost:3000/admin-login`
2. Enter:
   - Email: `royaltymedsadmin@royaltymeds.com`
   - Password: `Options123$`
3. Click **Sign In**
4. You will be redirected to `/admin/dashboard`

## Admin Routes

Once logged in, admins have access to:

- `/admin/dashboard` - Overview and statistics
- `/admin/prescriptions` - Manage all prescriptions
- `/admin/orders` - Manage all orders
- `/admin/refills` - Manage refill requests
- `/admin/users` - Create and manage admin accounts

## Creating Additional Admin Accounts

As an admin, you can create new admin accounts:

1. Go to `/admin/users`
2. Click **Create Admin** button
3. Fill in:
   - Full Name
   - Email Address
   - Password (minimum 8 characters)
   - Confirm Password
4. Click **Create Admin**

The new admin account will be created and can log in immediately.

## API Endpoints

### Create Admin Account
**POST** `/api/admin/create-user`

**Headers**: 
```
Content-Type: application/json
Cookie: [session cookie from login]
```

**Body**:
```json
{
  "email": "neweadmin@royaltymeds.com",
  "password": "SecurePassword123",
  "fullName": "New Admin"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "user": {
    "id": "user-id-uuid",
    "email": "newadmin@royaltymeds.com",
    "fullName": "New Admin"
  }
}
```

### Get All Admin Users
**GET** `/api/admin/users`

**Headers**:
```
Cookie: [session cookie from login]
```

**Response** (200 OK):
```json
[
  {
    "id": "user-id-uuid",
    "email": "royaltymedsadmin@royaltymeds.com",
    "fullName": "RoyaltyMeds Admin",
    "createdAt": "2026-01-12T13:04:27.123Z"
  }
]
```

## Security Notes

- Admin passwords are hashed and never stored in plain text
- Admin accounts require email verification
- Only existing admins can create new admin accounts
- All admin actions are subject to RLS (Row Level Security) policies
- Change the default admin password after first login
- Use strong passwords for all admin accounts
