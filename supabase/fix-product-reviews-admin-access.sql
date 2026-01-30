-- Fix RLS Policies for Product Reviews - Admin Access
-- This allows admins to view and manage all reviews (pending and approved)
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on product_reviews to start fresh
DROP POLICY IF EXISTS "Public can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated users can view all reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON product_reviews;

-- SELECT Policies:
-- 1. Anyone (including unauthenticated) can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT 
  USING (is_approved = true);

-- 2. Authenticated users can view ALL reviews (for admin dashboard)
-- This allows logged-in users (including admins) to see pending reviews
CREATE POLICY "Authenticated can view all reviews" ON product_reviews
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policies:
-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- UPDATE Policies:
-- 1. Authenticated users can update any review (for admin approval/rejection)
CREATE POLICY "Authenticated can update any review" ON product_reviews
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- 2. Users can update their own unapproved reviews
CREATE POLICY "Users can update own unapproved reviews" ON product_reviews
  FOR UPDATE 
  USING (auth.uid() = customer_id AND is_approved = false);

-- DELETE Policies:
-- Authenticated users can delete any review (for admin rejection)
CREATE POLICY "Authenticated can delete reviews" ON product_reviews
  FOR DELETE 
  USING (auth.role() = 'authenticated');
