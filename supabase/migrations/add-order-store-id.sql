-- Add store_id column to orders table to track fulfillment store
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- Add index for better performance when filtering orders by store
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
