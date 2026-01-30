-- Create Stores/Outlets Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10, 8), -- For map coordinates
  longitude DECIMAL(11, 8), -- For map coordinates
  opening_hours JSONB, -- Store opening hours as JSON
  -- Example: {"monday": "9:00 AM - 9:00 PM", "tuesday": "9:00 AM - 9:00 PM", ...}
  image_url TEXT, -- Store image/photo
  description TEXT,
  display_order INTEGER DEFAULT 0, -- For arranging order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_stores_display_order ON stores(display_order);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- Create table for store map image (only one image for the map)
CREATE TABLE IF NOT EXISTS store_map_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_image_url TEXT NOT NULL, -- The India map image with marked locations
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES customers(id) ON DELETE SET NULL
);

-- Insert default map settings (will be updated from admin)
INSERT INTO store_map_settings (id, map_image_url, description)
VALUES (
  gen_random_uuid(),
  '',
  'India map showing store locations'
)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_map_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
-- Public can view active stores
CREATE POLICY "Public can view active stores" ON stores
  FOR SELECT 
  USING (is_active = true);

-- Admins can manage all stores
CREATE POLICY "Admins can manage stores" ON stores
  FOR ALL 
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

-- RLS Policies for store_map_settings
-- Public can view map settings
CREATE POLICY "Public can view map settings" ON store_map_settings
  FOR SELECT 
  USING (true);

-- Admins can manage map settings
CREATE POLICY "Admins can manage map settings" ON store_map_settings
  FOR ALL 
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

-- Trigger to update updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_map_settings_updated_at BEFORE UPDATE ON store_map_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

