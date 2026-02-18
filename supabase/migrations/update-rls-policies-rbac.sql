-- ==========================================
-- UPDATE RLS POLICIES FOR RBAC INTEGRATION
-- ==========================================
-- This migration updates existing RLS policies to work with the new RBAC system
-- while maintaining backward compatibility with legacy is_admin checks
--
-- PERFORMANCE OPTIMIZATIONS:
-- 1. Uses authorize() function which reads from JWT (no DB queries)
-- 2. Early return for legacy admins
-- 3. Maintains existing policies as fallbacks
-- 4. All checks use indexed columns

-- ==========================================
-- ORDERS TABLE - Store-Scoped Access
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

-- SELECT: Admins and authorized users can view orders
-- OPTIMIZED: Uses authorize() which reads from JWT (no database query)
CREATE POLICY "Store-scoped order view access" ON orders
  FOR SELECT
  TO authenticated
  USING (
    -- Legacy admin (backward compatible)
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    -- New RBAC system - uses JWT, very fast
    authorize('orders.view'::app_permission, store_id)
    OR
    -- Customer can view their own orders
    customer_id = auth.uid()
  );

-- INSERT: Authenticated users and those with permission can create orders
CREATE POLICY "Authorized order creation" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Anyone can create orders (for customer orders)
    auth.uid() IS NOT NULL
    OR
    -- Or have explicit permission
    authorize('orders.create'::app_permission, store_id)
  );

-- UPDATE: Admins and authorized users can edit orders
CREATE POLICY "Store-scoped order edit access" ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.edit'::app_permission, store_id)
  );

-- DELETE: Admins and authorized users can delete orders
CREATE POLICY "Store-scoped order delete access" ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.delete'::app_permission, store_id)
  );

-- ==========================================
-- PRODUCTS TABLE - Store-Scoped Access (if needed)
-- ==========================================
-- Note: Products might not have store_id yet
-- These policies prepare for future multi-store product management

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Keep public view policy for active products
-- This is already optimal

-- INSERT: Only authorized users can create products
CREATE POLICY "Authorized product creation" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('products.edit'::app_permission)
  );

-- UPDATE: Only authorized users can edit products
CREATE POLICY "Authorized product editing" ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('products.edit'::app_permission)
  );

-- DELETE: Only authorized users can delete products
CREATE POLICY "Authorized product deletion" ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('products.delete'::app_permission)
  );

-- ==========================================
-- OFFERS TABLE - Admin Only
-- ==========================================

DROP POLICY IF EXISTS "Anyone can insert offers" ON offers;
DROP POLICY IF EXISTS "Anyone can update offers" ON offers;
DROP POLICY IF EXISTS "Anyone can delete offers" ON offers;

CREATE POLICY "Admins can manage offers" ON offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('settings.edit'::app_permission)
  );

-- ==========================================
-- COUPONS TABLE - Admin Only
-- ==========================================

DROP POLICY IF EXISTS "Anyone can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can update coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can delete coupons" ON coupons;

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('settings.edit'::app_permission)
  );

-- ==========================================
-- RETURNS TABLE - Store-Scoped Access
-- ==========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Admins can manage returns" ON returns;

-- Add policy for admins to view all returns
CREATE POLICY "Admins can view all returns" ON returns
  FOR SELECT
  TO authenticated
  USING (
    -- Existing customer policy allows viewing own returns
    auth.uid() = customer_id
    OR
    -- Admins can view returns (if orders have store_id in future)
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.view'::app_permission)
  );

CREATE POLICY "Admins can manage returns" ON returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.edit'::app_permission)
  );

-- ==========================================
-- EXCHANGES TABLE - Store-Scoped Access
-- ==========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all exchanges" ON exchanges;
DROP POLICY IF EXISTS "Admins can manage exchanges" ON exchanges;

CREATE POLICY "Admins can view all exchanges" ON exchanges
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.view'::app_permission)
  );

CREATE POLICY "Admins can manage exchanges" ON exchanges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('orders.edit'::app_permission)
  );

-- ==========================================
-- PRODUCT REVIEWS - Enhanced Access Control
-- ==========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;

-- Admins can approve/manage all reviews
CREATE POLICY "Admins can manage all reviews" ON product_reviews
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = customer_id -- Own reviews
    OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    authorize('products.edit'::app_permission)
  );

-- ==========================================
-- CUSTOMERS TABLE - Admin Access for Reports
-- ==========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can edit customer data" ON customers;

-- Add policy for admins to view all customers
CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id -- Own profile
    OR
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = auth.uid() AND c.is_admin = true AND c.is_active = true
    )
    OR
    authorize('customers.view'::app_permission)
  );

CREATE POLICY "Admins can edit customer data" ON customers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id -- Own profile
    OR
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = auth.uid() AND c.is_admin = true AND c.is_active = true
    )
    OR
    authorize('customers.edit'::app_permission)
  );

-- ==========================================
-- PERFORMANCE NOTES
-- ==========================================
-- 1. All authorize() calls use JWT claims (no DB queries)
-- 2. Legacy admin checks use indexed customers.id column
-- 3. Customer-owned record checks use indexed foreign keys
-- 4. Policies are evaluated in order - fastest checks first
-- 5. Early return pattern for legacy admins

-- To monitor RLS performance:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

COMMENT ON POLICY "Store-scoped order view access" ON orders IS 'Uses JWT claims for fast permission checks';
COMMENT ON POLICY "Authorized product creation" ON products IS 'Optimized with early return for legacy admins';
