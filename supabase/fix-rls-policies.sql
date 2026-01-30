-- Additional RLS Policies for Admin Panel
-- Run this SQL in Supabase SQL Editor if you're getting RLS errors

-- Products table policies
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
CREATE POLICY "Anyone can insert products" ON products
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update products" ON products;
CREATE POLICY "Anyone can update products" ON products
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete products" ON products;
CREATE POLICY "Anyone can delete products" ON products
  FOR DELETE USING (true);

-- Offers table policies
DROP POLICY IF EXISTS "Anyone can insert offers" ON offers;
CREATE POLICY "Anyone can insert offers" ON offers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update offers" ON offers;
CREATE POLICY "Anyone can update offers" ON offers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete offers" ON offers;
CREATE POLICY "Anyone can delete offers" ON offers
  FOR DELETE USING (true);

-- Coupons table policies
DROP POLICY IF EXISTS "Anyone can insert coupons" ON coupons;
CREATE POLICY "Anyone can insert coupons" ON coupons
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update coupons" ON coupons;
CREATE POLICY "Anyone can update coupons" ON coupons
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete coupons" ON coupons;
CREATE POLICY "Anyone can delete coupons" ON coupons
  FOR DELETE USING (true);

