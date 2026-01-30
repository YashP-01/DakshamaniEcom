-- Migration Script: Drop Old Tables and Create New Schema
-- ⚠️ WARNING: This will DELETE ALL DATA from your database
-- Only run this if you're okay with losing existing data
-- For production, backup data first!

-- ==========================================
-- STEP 1: Drop old tables (if they exist)
-- ==========================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop any old sequences
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;

-- ==========================================
-- STEP 2: Drop old functions/triggers
-- ==========================================

DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_product_stock() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS log_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==========================================
-- STEP 3: Now run the new schema.sql file
-- ==========================================
-- After running this script, copy and paste the entire contents
-- of supabase/schema.sql and run it

