-- Migration: Add mandatory variants to all existing products
-- This script creates a variant for each existing product using the product's base data
-- After this migration, products MUST have at least one variant to be visible on the web

-- Step 1: Create variants for all existing products that don't have any variants
-- Use the product's base price, stock, and other data as the default variant

INSERT INTO product_variants (
  product_id,
  variant_name,
  sku,
  price,
  compare_at_price,
  stock_quantity,
  is_active
)
SELECT 
  p.id as product_id,
  COALESCE(
    CASE 
      WHEN p.weight_unit = 'kg' AND p.weight_grams IS NOT NULL THEN 
        CAST(p.weight_grams / 1000.0 AS DECIMAL(10,2)) || ' kg'
      WHEN p.weight_unit = 'grams' AND p.weight_grams IS NOT NULL THEN 
        CAST(p.weight_grams AS DECIMAL(10,0)) || ' g'
      WHEN p.weight_unit = 'ml' AND p.weight_grams IS NOT NULL THEN 
        CAST(p.weight_grams AS DECIMAL(10,0)) || ' ml'
      ELSE 'Standard Pack'
    END,
    'Standard Pack'
  ) as variant_name,
  COALESCE(p.sku, 'VAR-' || SUBSTRING(p.id::text, 1, 8)) as sku,
  p.price,
  p.compare_at_price,
  p.stock_quantity,
  p.is_active
FROM products p
WHERE p.id NOT IN (
  SELECT DISTINCT product_id 
  FROM product_variants 
  WHERE product_id IS NOT NULL
)
AND p.is_active = true;

-- Step 2: Update products table to add a flag indicating if product has variants
-- (This helps with querying performance)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Step 3: Update the has_variants flag for all products
UPDATE products p
SET has_variants = EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
  AND pv.is_active = true
);

-- Step 4: Create a function to check if product can be displayed (has active variants)
CREATE OR REPLACE FUNCTION product_is_available(product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM product_variants 
    WHERE product_variants.product_id = product_id 
    AND product_variants.is_active = true
    AND product_variants.stock_quantity > 0
  );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_active_stock 
ON product_variants(product_id, is_active, stock_quantity) 
WHERE is_active = true;

-- Verification query: Check products without variants
-- SELECT id, name, is_active FROM products 
-- WHERE is_active = true 
-- AND NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = products.id);

