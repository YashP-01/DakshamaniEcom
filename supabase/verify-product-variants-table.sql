-- Verify Product Variants Table
-- Run this to check if the table exists and has the correct structure

-- Check if table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'product_variants'
ORDER BY ordinal_position;

-- If table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL, -- e.g., "500g", "1kg"
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_active 
ON product_variants(is_active) 
WHERE is_active = true;

