-- Enable Row Level Security (if not already enabled)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public stores are viewable by everyone" ON stores;
DROP POLICY IF EXISTS "Public can view stores" ON stores;

-- Allow public read access to ALL columns in stores table
CREATE POLICY "Public stores are viewable by everyone" 
ON stores FOR SELECT 
USING (true);

-- Explicitly grant SELECT permission to anon and authenticated roles
GRANT SELECT ON TABLE "public"."stores" TO "anon";
GRANT SELECT ON TABLE "public"."stores" TO "authenticated";

-- If you are using a separate schema or role, ensure they have access
