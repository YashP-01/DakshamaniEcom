-- Enhance Exchanges Table for Exchange Order Tracking
-- Add exchange_order_id to track the new order created for exchange

ALTER TABLE exchanges 
ADD COLUMN IF NOT EXISTS exchange_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_pickup_tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS exchange_shipment_id VARCHAR(255);

-- Create Return & Exchange Policy Settings Table
CREATE TABLE IF NOT EXISTS return_exchange_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy Content
  title VARCHAR(255) DEFAULT 'Return & Exchange Policy',
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Policy Rules
  return_window_days INTEGER DEFAULT 7,
  exchange_window_days INTEGER DEFAULT 7,
  refund_processing_days INTEGER DEFAULT 5,
  exchange_processing_days INTEGER DEFAULT 3,
  
  -- Eligibility
  eligible_conditions TEXT[], -- Array of conditions
  non_eligible_conditions TEXT[], -- Array of non-eligible conditions
  
  -- Contact Info
  policy_contact_email VARCHAR(255),
  policy_contact_phone VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE return_exchange_policy ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view policy
CREATE POLICY "Public can view policy" ON return_exchange_policy
  FOR SELECT USING (true);

-- Admins can manage policy
CREATE POLICY "Admins can manage policy" ON return_exchange_policy
  FOR ALL USING (is_admin_user() = true);

-- Insert default policy
INSERT INTO return_exchange_policy (
  title,
  content,
  return_window_days,
  exchange_window_days,
  refund_processing_days,
  exchange_processing_days,
  eligible_conditions,
  non_eligible_conditions
) VALUES (
  'Return & Exchange Policy',
  'We want you to be completely satisfied with your purchase. If you are not happy with your order, you can return or exchange it within 7 days of delivery.

**Return Policy:**
- Items must be unused, unwashed, and in original packaging
- Return requests must be made within 7 days of delivery
- Refunds will be processed within 5-7 business days
- Original shipping charges are non-refundable

**Exchange Policy:**
- Exchanges can be requested within 7 days of delivery
- Exchange requests are subject to product availability
- Price differences will be charged or refunded accordingly
- Exchange orders are processed within 3-5 business days

**Non-Returnable Items:**
- Perishable items
- Items without original packaging
- Items damaged by customer misuse

For any questions, please contact our customer support team.',
  7,
  7,
  5,
  3,
  ARRAY['Unused items', 'Original packaging', 'Within 7 days of delivery', 'Valid proof of purchase'],
  ARRAY['Perishable items', 'Damaged by misuse', 'Missing original packaging', 'Beyond 7 days']
) ON CONFLICT DO NOTHING;

-- Update exchanges table to track delivery date for 7-day window calculation
-- This will be populated from the original order's delivery_date

