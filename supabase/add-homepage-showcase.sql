-- Add homepage showcase fields to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homepage_display_order INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_homepage_showcase 
ON products(show_on_homepage, homepage_display_order) 
WHERE show_on_homepage = true;

-- Optional: Update existing featured products to show on homepage
-- Only runs if is_featured column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_featured'
    ) THEN
        UPDATE products 
        SET show_on_homepage = true, homepage_display_order = 1 
        WHERE is_featured = true 
        AND (show_on_homepage IS NULL OR show_on_homepage = false);
    END IF;
END $$;

