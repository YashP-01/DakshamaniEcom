-- Fix RLS Policies for Exchanges Table
-- This ensures customers can only view their own exchanges and admins can view all
-- Run this in Supabase SQL Editor

-- IMPORTANT: First ensure is_admin_user() function exists
-- If you haven't run add-admin-support.sql yet, run that first

-- Drop existing policies on exchanges
DROP POLICY IF EXISTS "Users can view own exchanges" ON exchanges;
DROP POLICY IF EXISTS "Users can create own exchanges" ON exchanges;
DROP POLICY IF EXISTS "Admins can view all exchanges" ON exchanges;
DROP POLICY IF EXISTS "Admins can update exchanges" ON exchanges;

-- SELECT Policies (OR logic - user can see row if ANY policy matches):
-- 1. Customers can view their own exchanges (where customer_id matches auth.uid())
CREATE POLICY "Users can view own exchanges" ON exchanges
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND customer_id IS NOT NULL 
    AND auth.uid() = customer_id
  );

-- 2. Admins can view all exchanges (for admin panel)
CREATE POLICY "Admins can view all exchanges" ON exchanges
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
-- Users can create their own exchanges
CREATE POLICY "Users can create own exchanges" ON exchanges
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND customer_id IS NOT NULL 
    AND auth.uid() = customer_id
  );

-- UPDATE Policy:
-- Admins can update any exchange
CREATE POLICY "Admins can update exchanges" ON exchanges
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

-- DELETE Policy (if needed):
-- Admins can delete exchanges
CREATE POLICY "Admins can delete exchanges" ON exchanges
  FOR DELETE 
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

