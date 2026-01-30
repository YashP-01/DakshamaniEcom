-- Contact Settings Table
-- This table stores all contact information displayed on the contact page
CREATE TABLE IF NOT EXISTS contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Phone Numbers
  primary_phone VARCHAR(20) NOT NULL,
  primary_phone_hours VARCHAR(255),
  urgent_phone VARCHAR(20),
  
  -- Email Addresses
  general_email VARCHAR(255) NOT NULL,
  support_email VARCHAR(255),
  orders_email VARCHAR(255),
  
  -- Address
  company_name VARCHAR(255),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  
  -- Support Hours
  support_hours_weekdays VARCHAR(255),
  support_hours_weekend VARCHAR(255),
  
  -- Live Chat
  live_chat_enabled BOOLEAN DEFAULT true,
  live_chat_url TEXT,
  
  -- Hero Section
  hero_title VARCHAR(255),
  hero_subtitle TEXT,
  hero_features JSONB, -- Array of feature objects
  
  -- FAQ Section (optional, can be managed separately)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view contact settings
CREATE POLICY "Public can view contact settings" ON contact_settings
  FOR SELECT USING (true);

-- Admins can manage contact settings
CREATE POLICY "Admins can manage contact settings" ON contact_settings
  FOR ALL USING (is_admin_user() = true);

-- Insert default data
INSERT INTO contact_settings (
  primary_phone,
  primary_phone_hours,
  urgent_phone,
  general_email,
  support_email,
  orders_email,
  company_name,
  address_line1,
  city,
  state,
  pincode,
  country,
  support_hours_weekdays,
  support_hours_weekend,
  live_chat_enabled,
  hero_title,
  hero_subtitle,
  hero_features
) VALUES (
  '+91 XXXXX XXXXX',
  'Mon - Sat: 9:00 AM - 9:00 PM',
  '+91 XXXXX XXXXX',
  'info@dakshamani.com',
  'support@dakshamani.com',
  'orders@dakshamani.com',
  'Dakshamani Naturo Food Pvt LTD',
  'Your Address Here',
  'City',
  'State',
  '000000',
  'India',
  'Mon - Sat: 9:00 AM - 9:00 PM',
  'Sunday: 10:00 AM - 8:00 PM',
  true,
  'We''re Here to Help',
  'Have a question? Need support? Our customer care team is ready to assist you 24/7.',
  '["24/7 Support", "Quick Response", "Expert Help"]'::jsonb
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_settings_timestamp
  BEFORE UPDATE ON contact_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_settings_updated_at();


