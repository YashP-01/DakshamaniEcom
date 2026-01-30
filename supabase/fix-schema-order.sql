-- Fixed Schema with Correct Table Dependencies
-- Run this in Supabase SQL Editor

-- ==========================================
-- STEP 1: Drop old tables first (if exists)
-- ==========================================
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS shopping_carts CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_ingredients CASCADE;
DROP TABLE IF EXISTS product_allergens CASCADE;
DROP TABLE IF EXISTS product_nutrition CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_product_stock() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS log_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==========================================
-- STEP 2: Now run the fixed schema.sql file
-- ==========================================
-- After running this cleanup script, copy and paste
-- the entire contents of supabase/schema.sql

