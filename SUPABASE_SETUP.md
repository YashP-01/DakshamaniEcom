# Supabase Database Setup Guide

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one if you haven't)

### 2. Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"** button (top right)

### 3. Copy and Paste the Schema
1. Open the file `supabase/schema.sql` from this project
2. Copy ALL the SQL code from that file
3. Paste it into the SQL Editor in Supabase

### 4. Run the SQL Script
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for it to complete - you should see "Success. No rows returned"

### 5. Verify Tables Were Created
1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - ✅ `products`
   - ✅ `offers`
   - ✅ `coupons`
   - ✅ `orders`
   - ✅ `order_items`
   - ✅ `admin_users`

### 6. Test the Setup (Optional)
You can verify by running this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

This should show all 6 tables listed above.

## What Each Table Does

- **products**: Stores all your products (dry fruits, masalas, etc.)
- **offers**: Stores banner offers for homepage hero section
- **coupons**: Stores discount coupon codes
- **orders**: Stores customer orders
- **order_items**: Stores individual items in each order
- **admin_users**: Stores admin user credentials (for admin panel)

## Next Steps After Setup

1. **Add Sample Products**: 
   - Go to `/admin/login` in your app
   - Login with: `admin@dakshamani.com` / `admin123`
   - Add some test products

2. **Add Sample Offers** (Optional):
   - In admin panel, go to Offers
   - Add banner images for homepage

3. **Add Coupons** (Optional):
   - In admin panel, go to Coupons
   - Create test coupon codes

## Troubleshooting

If you get errors:
- Make sure you're running the SQL in the correct project
- Check that you copied the entire schema.sql file
- Ensure Row Level Security (RLS) policies are created (they're in the schema)

If tables already exist:
- The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again
- If you want to start fresh, you can drop tables first (not recommended unless needed)

