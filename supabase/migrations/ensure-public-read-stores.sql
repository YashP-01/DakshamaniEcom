-- Enable Row Level Security (good practice)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to stores (including serviceable_pincodes)
CREATE POLICY "Public stores are viewable by everyone" 
ON stores FOR SELECT 
USING (true);

-- Allow admins to insert/update/delete stores (assuming admin role or similar)
-- This part depends on your auth setup, but usually admins bypass RLS or have specific role
-- If this fails, standard RLS might be blocking updates if no policy exists for them
-- For now, let's ensure SELECT works for everyone.
