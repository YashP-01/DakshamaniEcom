-- Fix Foreign Key Constraint Issue
-- Run this if you're getting "orders_customer_id_fkey" errors

-- Option 1: Make customer_id nullable and allow NULL (if already nullable, skip)
-- The schema already has customer_id as nullable, so this should be fine

-- Option 2: Create missing customer profiles for existing auth users
-- This will create customer profiles for any Supabase Auth users that don't have profiles

-- First, check if there are any auth users without customer profiles
-- Then manually create them or use this trigger:

-- Create a function to auto-create customer profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create customer profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- If you have existing auth users without customer profiles, create them manually:
-- Replace 'user-uuid-here' with actual user IDs from auth.users

-- INSERT INTO customers (id, email, first_name, last_name)
-- SELECT id, email, 
--   COALESCE(raw_user_meta_data->>'first_name', ''),
--   COALESCE(raw_user_meta_data->>'last_name', '')
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM customers)
-- ON CONFLICT (id) DO NOTHING;

