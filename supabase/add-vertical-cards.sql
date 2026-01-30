-- Add vertical content cards table for homepage
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vertical_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL, -- Video URL or image URL
  media_type VARCHAR(20) NOT NULL DEFAULT 'image', -- 'image' or 'video'
  thumbnail_url TEXT, -- For videos, a thumbnail image
  link_url TEXT, -- Optional link when clicked
  position VARCHAR(20) DEFAULT 'left', -- 'left' or 'right' side of products
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vertical_cards_active_position 
ON vertical_cards(is_active, position, display_order);

-- Enable RLS
ALTER TABLE vertical_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read active cards
CREATE POLICY "Anyone can view active vertical cards" ON vertical_cards
  FOR SELECT USING (is_active = true);

-- Policy: Only admins can manage (you'll need to set up admin authentication properly)
-- For now, this is a basic policy - adjust based on your admin setup
CREATE POLICY "Admins can manage vertical cards" ON vertical_cards
  FOR ALL USING (true);

