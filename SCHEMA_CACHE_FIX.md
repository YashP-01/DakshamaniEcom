# Fixing Supabase Schema Cache Error

## Problem
After adding new columns (`show_on_homepage`, `homepage_display_order`) to the database, you're getting an error:
```
Could not find the 'homepage_display_order' column of 'products' in the schema cache
```

## Solution

### Option 1: Refresh Schema Cache (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Settings** → **API** (or **Database** → **API**)

2. **Refresh Schema Cache**
   - Look for a "Refresh Schema" or "Reload Schema" button
   - Or restart your Supabase project (Settings → General → Restart)

3. **Wait 2-3 minutes**
   - Supabase automatically refreshes the schema cache every few minutes
   - The error should disappear once the cache is updated

### Option 2: Verify Columns Exist

Run this query in Supabase SQL Editor to verify columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('show_on_homepage', 'homepage_display_order');
```

If the columns don't appear, run the migration again:
- Copy `supabase/add-homepage-showcase.sql`
- Paste in SQL Editor
- Click "Run"

### Option 3: Temporary Workaround

The code has been updated to handle missing columns gracefully:
- Admin panel will work even if columns don't exist yet
- Homepage will fall back to loading regular products if showcase columns aren't available
- Once schema cache refreshes, everything will work automatically

## After Schema Cache Refreshes

Once the cache is updated (usually within 2-5 minutes):
1. The error will disappear
2. Homepage showcase features will work
3. You can start selecting products for homepage display

## Quick Check

To see if cache has refreshed, check the browser console:
- No more errors about missing columns = cache refreshed ✅
- Still seeing errors = wait a bit longer ⏳












