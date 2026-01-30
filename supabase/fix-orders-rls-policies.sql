-- Fix RLS Policies for Orders Table
-- This ensures customers can only view their own orders and admins can view all
-- Run this in Supabase SQL Editor

-- IMPORTANT: First ensure is_admin_user() function exists
-- If you haven't run add-admin-support.sql yet, run that first

-- Drop ALL existing conflicting policies on orders
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- SELECT Policies (OR logic - user can see row if ANY policy matches):
-- 1. Customers can view their own orders (where customer_id matches auth.uid())
-- This handles logged-in customers with orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND customer_id IS NOT NULL 
    AND auth.uid() = customer_id
  );

-- 2. Admins can view all orders (for admin panel)
-- This uses the is_admin_user() function from add-admin-support.sql
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 
      FROM customers 
      WHERE id = auth.uid() 
      AND is_admin = true 
      AND is_active = true
    )
  );

-- INSERT Policy:
-- Anyone can create orders (for checkout process - both guest and logged-in)
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- UPDATE Policy:
-- Admins can update any order
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 
      FROM customers 
      WHERE id = auth.uid() 
      AND is_admin = true 
      AND is_active = true
    )
  );

-- Note about guest orders:
-- Guest orders (where customer_id is NULL) will NOT be visible to customers
-- Only admins can see them. If you need customers to see guest orders, 
-- you'll need to link them via email or session_id matching.

