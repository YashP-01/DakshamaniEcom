# Homepage Showcase Setup Guide

## Overview
Added functionality to select which products are showcased on the homepage and control their display order through the admin panel.

## Database Setup Required

**IMPORTANT:** Run this SQL script in your Supabase SQL Editor before using the feature:

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `supabase/add-homepage-showcase.sql`
3. Copy and paste the SQL code
4. Click "Run"

This will add:
- `show_on_homepage` (boolean) - Whether product appears on homepage
- `homepage_display_order` (integer) - Order position (lower = first)

## Features Added

### Admin Panel (`/admin/products`)

1. **Homepage Showcase Section** in product form:
   - ✅ Checkbox: "Show on Homepage"
   - ✅ Display Order field (appears when checkbox is checked)
   - ✅ Help text explaining ordering

2. **Visual Indicators**:
   - Products shown on homepage display a blue badge: "Homepage #X"
   - Badge shows the display order number

### Homepage (`/`)

- Automatically loads products where `show_on_homepage = true`
- Sorted by `homepage_display_order` (ascending)
- Limited to 8 products
- Falls back to creation date if order is the same

## How to Use

1. **Enable Homepage Showcase**:
   - Go to `/admin/products`
   - Edit a product
   - Scroll to "Homepage Showcase" section
   - Check "Show on Homepage"
   - Enter a display order number (0-999, lower appears first)

2. **Set Display Order**:
   - Order 0 = appears first
   - Order 1 = appears second
   - Products with same order sorted by creation date

3. **View on Homepage**:
   - Products with `show_on_homepage = true` will appear in the "Featured Products" section
   - Only first 8 products are displayed

## Example

To showcase 3 products in this order:
1. Premium Almonds (Order: 0)
2. Cashew Nuts (Order: 1)
3. Premium Dates (Order: 2)

Set their `show_on_homepage = true` and `homepage_display_order` to 0, 1, and 2 respectively.

## Notes

- Only active products (`is_active = true`) can be showcased
- Maximum 8 products shown on homepage
- Changes take effect immediately after saving
- Products without `show_on_homepage = true` won't appear on homepage












