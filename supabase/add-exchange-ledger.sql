-- Exchange Ledger System
-- This tracks exchange history and prevents re-exchanging already exchanged orders

-- Add column to orders table to track if order has been exchanged
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS has_been_exchanged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS exchange_chain_level INTEGER DEFAULT 0; -- 0 = original order, 1+ = exchange order

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_has_been_exchanged ON orders(has_been_exchanged) WHERE has_been_exchanged = true;
CREATE INDEX IF NOT EXISTS idx_orders_original_order_id ON orders(original_order_id) WHERE original_order_id IS NOT NULL;

-- Create exchange ledger table to track all exchange transactions
CREATE TABLE IF NOT EXISTS exchange_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Exchange details
  exchange_id UUID NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  exchange_number VARCHAR(50) NOT NULL,
  
  -- Order references
  original_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  exchange_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Product details
  return_product_id UUID NOT NULL REFERENCES products(id),
  exchange_product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  exchange_chain_level INTEGER DEFAULT 0, -- Track how many times this has been exchanged
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exchange_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_ledger
-- Customers can view their own exchange ledger entries
CREATE POLICY "Customers can view own exchange ledger" ON exchange_ledger
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND customer_id = auth.uid()
  );

-- Admins can view all exchange ledger entries
CREATE POLICY "Admins can view all exchange ledger" ON exchange_ledger
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 
      FROM customers 
      WHERE id = auth.uid() 
      AND is_admin = true 
      AND is_active = true
    )
  );

-- Function to mark order as exchanged
CREATE OR REPLACE FUNCTION mark_order_as_exchanged(
  p_order_id UUID,
  p_exchange_order_id UUID,
  p_original_order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_chain_level INTEGER;
BEGIN
  -- Determine chain level
  IF p_original_order_id IS NULL THEN
    -- This is the first exchange, so original_order_id is the order being exchanged
    v_chain_level := 1;
    UPDATE orders 
    SET has_been_exchanged = true,
        original_order_id = p_order_id,
        exchange_chain_level = 0
    WHERE id = p_order_id;
    
    -- Set exchange order's original_order_id and chain level
    UPDATE orders
    SET original_order_id = p_order_id,
        exchange_chain_level = v_chain_level
    WHERE id = p_exchange_order_id;
  ELSE
    -- This is a subsequent exchange, find the chain level
    SELECT COALESCE(MAX(exchange_chain_level), 0) + 1 INTO v_chain_level
    FROM orders
    WHERE original_order_id = p_original_order_id OR id = p_original_order_id;
    
    -- Mark the order being exchanged
    UPDATE orders 
    SET has_been_exchanged = true
    WHERE id = p_order_id;
    
    -- Set exchange order's original_order_id and chain level
    UPDATE orders
    SET original_order_id = COALESCE(
      (SELECT original_order_id FROM orders WHERE id = p_order_id),
      p_order_id
    ),
    exchange_chain_level = v_chain_level
    WHERE id = p_exchange_order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if order is eligible for exchange
CREATE OR REPLACE FUNCTION is_order_eligible_for_exchange(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_been_exchanged BOOLEAN;
  v_order_status VARCHAR;
  v_shipping_status VARCHAR;
  v_delivery_date TIMESTAMP WITH TIME ZONE;
  v_seven_days_ago TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if order exists and get its status
  SELECT has_been_exchanged, order_status, shipping_status, delivery_date
  INTO v_has_been_exchanged, v_order_status, v_shipping_status, v_delivery_date
  FROM orders
  WHERE id = p_order_id;
  
  -- If order doesn't exist, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If order has already been exchanged, it's not eligible (unless it's an exchange order itself)
  IF v_has_been_exchanged THEN
    -- Check if this is an exchange order (has original_order_id)
    -- Exchange orders can be exchanged again once delivered
    SELECT original_order_id INTO v_has_been_exchanged
    FROM orders
    WHERE id = p_order_id;
    
    -- If it's an exchange order (has original_order_id), allow exchange if delivered
    IF v_has_been_exchanged IS NOT NULL THEN
      -- Exchange orders can be exchanged again if delivered
      IF v_order_status = 'delivered' OR v_shipping_status = 'delivered' THEN
        -- Check 7-day window
        v_seven_days_ago := NOW() - INTERVAL '7 days';
        IF v_delivery_date IS NOT NULL AND v_delivery_date >= v_seven_days_ago THEN
          RETURN true;
        END IF;
      END IF;
    END IF;
    
    RETURN false;
  END IF;
  
  -- Original orders can be exchanged if delivered and within 7 days
  IF v_order_status = 'delivered' OR v_shipping_status = 'delivered' THEN
    v_seven_days_ago := NOW() - INTERVAL '7 days';
    IF v_delivery_date IS NOT NULL AND v_delivery_date >= v_seven_days_ago THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

