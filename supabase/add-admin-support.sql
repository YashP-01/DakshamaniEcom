-- Add Admin Support to Supabase Auth
-- This script adds admin functionality to the customers table
-- Run this in Supabase SQL Editor

-- Add is_admin column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_customers_is_admin ON customers(is_admin) WHERE is_admin = true;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM customers 
    WHERE id = auth.uid() 
    AND is_admin = true
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for product_reviews to allow admins
DROP POLICY IF EXISTS "Public can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated can view all reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated can update any review" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated can delete reviews" ON product_reviews;

-- SELECT Policies:
-- 1. Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT 
  USING (is_approved = true);

-- 2. Admins can view ALL reviews (pending and approved)
CREATE POLICY "Admins can view all reviews" ON product_reviews
  FOR SELECT 
  USING (is_admin_user() = true);

-- INSERT Policies:
-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- UPDATE Policies:
-- 1. Admins can update any review (for approval/rejection)
CREATE POLICY "Admins can update any review" ON product_reviews
  FOR UPDATE 
  USING (is_admin_user() = true);

-- 2. Users can update their own unapproved reviews
CREATE POLICY "Users can update own unapproved reviews" ON product_reviews
  FOR UPDATE 
  USING (auth.uid() = customer_id AND is_approved = false);

-- DELETE Policies:
-- Admins can delete any review (for rejection)
CREATE POLICY "Admins can delete reviews" ON product_reviews
  FOR DELETE 
  USING (is_admin_user() = true);

-- Create admin user (you'll need to create this user in Supabase Auth first)
-- Example: After creating a user in Supabase Auth, run:
-- UPDATE customers SET is_admin = true WHERE email = 'admin@dakshamani.com';

