-- Invoice Template Settings Table
-- This table stores PDF invoice template configuration
CREATE TABLE IF NOT EXISTS invoice_template_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) DEFAULT 'DAKSHAMANI NATURO FOOD',
  company_legal_name VARCHAR(255) DEFAULT 'Dakshamani Naturo Food Pvt LTD',
  company_address TEXT,
  company_city VARCHAR(100),
  company_state VARCHAR(100),
  company_pincode VARCHAR(10),
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  
  -- PDF Settings
  font_size_normal INTEGER DEFAULT 10,
  font_size_large INTEGER DEFAULT 12,
  font_size_title INTEGER DEFAULT 20,
  primary_color JSONB DEFAULT '{"r": 34, "g": 197, "b": 94}', -- Green color
  page_margin INTEGER DEFAULT 20,
  
  -- Component Visibility and Order
  components_order JSONB DEFAULT '[
    {"id": "header", "enabled": true, "order": 1},
    {"id": "invoice_details", "enabled": true, "order": 2},
    {"id": "bill_to", "enabled": true, "order": 3},
    {"id": "ship_to", "enabled": true, "order": 4},
    {"id": "items_table", "enabled": true, "order": 5},
    {"id": "summary", "enabled": true, "order": 6},
    {"id": "footer", "enabled": true, "order": 7}
  ]',
  
  -- Component Settings
  show_company_logo BOOLEAN DEFAULT false,
  company_logo_url TEXT,
  show_payment_method BOOLEAN DEFAULT true,
  show_payment_status BOOLEAN DEFAULT true,
  show_tracking_info BOOLEAN DEFAULT false,
  show_customer_notes BOOLEAN DEFAULT false,
  footer_text TEXT DEFAULT 'Thank you for your business!',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoice_template_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view invoice settings (for generating invoices)
CREATE POLICY "Public can view invoice settings" ON invoice_template_settings
  FOR SELECT USING (true);

-- Admins can manage invoice settings
CREATE POLICY "Admins can manage invoice settings" ON invoice_template_settings
  FOR ALL USING (is_admin_user() = true);

-- Insert default settings
INSERT INTO invoice_template_settings (
  company_name,
  company_legal_name,
  company_address,
  company_city,
  company_state,
  company_pincode,
  company_phone,
  company_email
) VALUES (
  'DAKSHAMANI NATURO FOOD',
  'Dakshamani Naturo Food Pvt LTD',
  'Your Company Address',
  'City',
  'State',
  'Pincode',
  '+91 XXXXX XXXXX',
  'info@dakshamani.com'
) ON CONFLICT DO NOTHING;

