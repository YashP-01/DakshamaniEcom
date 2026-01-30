# Admin Authentication Setup Guide

## Overview
The admin panel now uses Supabase Auth for secure authentication. Admins must:
1. Have a Supabase Auth account
2. Have a customer profile with `is_admin = true`

## Setup Steps

### 1. Run the SQL Migration
Run the SQL script in Supabase SQL Editor:
```sql
-- File: supabase/add-admin-support.sql
```

This will:
- Add `is_admin` column to `customers` table
- Create RLS policies for admin access
- Create helper function to check admin status

### 2. Create Admin User in Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** → **"Create New User"**
3. Enter:
   - **Email**: `admin@dakshamani.com` (or your admin email)
   - **Password**: Choose a strong password
   - **Auto Confirm User**: ✅ (check this)
4. Click **"Create User"**

### 3. Create Customer Profile

After creating the user, you'll get a User ID (UUID). Now create the customer profile:

1. Go to **Supabase Dashboard** → **Table Editor** → **customers**
2. Click **"Insert"** → **"Insert Row"**
3. Fill in:
   - **id**: Paste the User ID from step 2
   - **email**: Same email as in step 2
   - **is_admin**: ✅ **true** (IMPORTANT!)
   - **is_active**: ✅ **true**
   - **first_name**: Admin
   - **last_name**: User
4. Click **"Save"**

### 4. Alternative: Use SQL to Set Admin

If you already have a user in Supabase Auth, you can set them as admin using SQL:

```sql
-- First, create customer profile if it doesn't exist
INSERT INTO customers (id, email, is_admin, is_active, first_name, last_name)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID from auth.users
  'admin@dakshamani.com',
  true,
  true,
  'Admin',
  'User'
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, is_active = true;

-- To find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'admin@dakshamani.com';
```

### 5. Test Admin Login

1. Go to `/admin/login`
2. Enter your admin email and password
3. You should be redirected to `/admin/dashboard`

## Security Features

- ✅ **Supabase Auth**: Secure password-based authentication
- ✅ **RLS Policies**: Database-level access control
- ✅ **Admin Check**: Only users with `is_admin = true` can access admin panel
- ✅ **Session Management**: Automatic logout on token expiry
- ✅ **Role-based Access**: Admins can view all reviews (pending + approved)

## Troubleshooting

### "You don't have admin access"
- Verify `is_admin = true` in customers table
- Verify `is_active = true` in customers table
- Check that the user ID matches between `auth.users` and `customers`

### "Login failed"
- Verify email exists in Supabase Auth
- Check password is correct
- Verify email confirmation (if required)

### "Reviews not showing"
- Verify RLS policies are applied (run `supabase/add-admin-support.sql`)
- Check browser console for errors
- Verify admin is logged in (check Supabase Auth session)

## Creating Additional Admin Users

To add more admin users:

1. Create user in Supabase Auth (Authentication → Users)
2. Create customer profile with `is_admin = true`
3. They can now login at `/admin/login`

## Removing Admin Access

To remove admin access:
```sql
UPDATE customers 
SET is_admin = false 
WHERE email = 'user@example.com';
```

Or deactivate:
```sql
UPDATE customers 
SET is_active = false 
WHERE email = 'user@example.com';
```










