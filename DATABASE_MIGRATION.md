# Database Migration Guide

## ⚠️ IMPORTANT: This will delete all existing data

Since the new schema is completely different from the old one, you need to start fresh.

## Option 1: Clean Slate (Recommended for Development)

### Step 1: Drop Old Tables
1. Open Supabase SQL Editor
2. Copy and run `supabase/drop-old-tables.sql`
3. This safely removes all old tables

### Step 2: Create New Schema
1. Copy the entire contents of `supabase/schema.sql`
2. Paste into Supabase SQL Editor
3. Run it (this creates all new tables)

### Step 3: Verify
Check Table Editor - you should see:
- customers
- customer_addresses
- products
- product_nutrition
- product_allergens
- product_ingredients
- product_variants
- orders
- order_items
- order_status_history
- returns
- exchanges
- product_reviews
- wishlists
- shopping_carts
- offers
- coupons
- coupon_usage
- admin_users

## Option 2: Keep Existing Data (Advanced)

If you have important data you want to keep:

1. **Export your data first:**
   - Go to Table Editor in Supabase
   - Export each table as CSV

2. **Run the migration script** (`drop-old-tables.sql`)

3. **Run the new schema** (`schema.sql`)

4. **Import your data back** (you'll need to adjust column names to match new schema)

## Recommendation

**For development/testing:** Use Option 1 (Clean Slate)
- Faster and cleaner
- No data conflicts
- Easier to test

**For production:** Use Option 2 (Migrate data)
- Preserve customer data
- Preserve order history
- More complex but safer

## After Migration

1. Test customer registration
2. Add some test products via admin panel
3. Test order creation
4. Verify stock reduction works

