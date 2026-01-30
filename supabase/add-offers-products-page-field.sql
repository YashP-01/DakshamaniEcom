-- Add field to show offers on products page
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS show_on_products_page BOOLEAN DEFAULT false;

ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS products_page_position INTEGER DEFAULT 0; -- Position after how many products to show

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_offers_products_page 
ON offers(show_on_products_page, products_page_position) 
WHERE show_on_products_page = true AND is_active = true;










