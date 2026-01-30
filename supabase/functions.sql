-- Additional SQL function for incrementing coupon usage (optional)
-- This can be added to Supabase if you want to use RPC calls

CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;

