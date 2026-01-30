-- Professional Ecommerce Database Schema for Dakshamani Naturo Food
-- Food Industry Specific with Nutrition, Allergens, Stock Management, Customer Accounts, Returns & Tracking

-- ==========================================
-- CUSTOMERS & AUTHENTICATION
-- ==========================================

-- Customers table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  profile_image_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Customer addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- Home, Work, Other, etc.
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ENHANCED PRODUCTS WITH FOOD SPECIFICATIONS
-- ==========================================

-- Products table (enhanced for food industry)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2), -- Original price before discount
  discount_percentage INTEGER DEFAULT 0,
  image_url TEXT,
  gallery_images TEXT[], -- Array of image URLs
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  
  -- Stock Management
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  
  -- Food Industry Specific
  weight_grams DECIMAL(10, 2), -- Product weight
  weight_unit VARCHAR(20) DEFAULT 'grams', -- grams, kg, ml, etc.
  shelf_life_days INTEGER, -- Shelf life in days
  storage_instructions TEXT, -- Storage instructions
  origin_country VARCHAR(100),
  certification TEXT[], -- Array of certifications (Organic, FSSAI, etc.)
  
  -- Status & Visibility
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0.00, -- Average rating (0-5)
  review_count INTEGER DEFAULT 0,
  
  -- SEO & Marketing
  meta_title VARCHAR(255),
  meta_description TEXT,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product nutrition information
CREATE TABLE IF NOT EXISTS product_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serving_size VARCHAR(50), -- e.g., "100g", "1 piece"
  calories DECIMAL(10, 2),
  protein DECIMAL(10, 2), -- grams
  carbohydrates DECIMAL(10, 2), -- grams
  sugar DECIMAL(10, 2), -- grams
  fiber DECIMAL(10, 2), -- grams
  fat DECIMAL(10, 2), -- grams
  saturated_fat DECIMAL(10, 2), -- grams
  trans_fat DECIMAL(10, 2), -- grams
  cholesterol DECIMAL(10, 2), -- mg
  sodium DECIMAL(10, 2), -- mg
  potassium DECIMAL(10, 2), -- mg
  calcium DECIMAL(10, 2), -- mg
  iron DECIMAL(10, 2), -- mg
  vitamin_a DECIMAL(10, 2), -- IU
  vitamin_c DECIMAL(10, 2), -- mg
  other_vitamins JSONB, -- Store other vitamins as JSON
  other_minerals JSONB, -- Store other minerals as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product allergens
CREATE TABLE IF NOT EXISTS product_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_name VARCHAR(100) NOT NULL, -- Gluten, Nuts, Dairy, etc.
  severity VARCHAR(20) DEFAULT 'moderate', -- mild, moderate, severe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product ingredients
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100), -- e.g., "10%", "5g"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (if applicable - size, flavor, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL, -- e.g., "500g", "1kg"
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- OFFERS & MARKETING
-- ==========================================

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed_amount
  discount_value DECIMAL(10, 2),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- COUPONS
-- ==========================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed_amount
  discount_percentage INTEGER,
  discount_amount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER, -- Total usage limit
  usage_limit_per_customer INTEGER DEFAULT 1, -- Per customer limit
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_categories TEXT[], -- Specific categories
  excluded_products UUID[], -- Excluded product IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ORDERS & ORDER MANAGEMENT
-- ==========================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order number
  
  -- Customer Information
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Shipping Address
  shipping_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
  shipping_full_name VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_pincode VARCHAR(10) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'India',
  shipping_phone VARCHAR(20),
  
  -- Billing Address (if different)
  billing_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
  billing_full_name VARCHAR(255),
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_pincode VARCHAR(10),
  billing_country VARCHAR(100),
  
  -- Order Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  coupon_discount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  
  -- Coupon & Promotions
  coupon_code VARCHAR(50),
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Payment Information
  payment_method VARCHAR(50) DEFAULT 'razorpay', -- razorpay, cod, etc.
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  
  -- Order Status & Tracking
  order_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  shipping_status VARCHAR(50) DEFAULT 'pending', -- pending, packed, shipped, in_transit, out_for_delivery, delivered
  delivery_date TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Shipping Provider
  shiprocket_order_id VARCHAR(255),
  shiprocket_shipment_id VARCHAR(255),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_variant_id UUID REFERENCES product_variants(id),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  product_image_url TEXT,
  product_price DECIMAL(10, 2) NOT NULL, -- Price at time of order
  discount_percentage INTEGER DEFAULT 0,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history (for tracking)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  comment TEXT,
  updated_by VARCHAR(100), -- admin email or system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon usage tracking (moved here because it references orders)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- RETURNS & EXCHANGES
-- ==========================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  reason VARCHAR(100) NOT NULL, -- defective, wrong_item, not_as_described, size_issue, etc.
  description TEXT,
  
  return_type VARCHAR(20) DEFAULT 'refund', -- refund, exchange, store_credit
  exchange_product_id UUID REFERENCES products(id),
  
  quantity INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, processed, completed
  admin_notes TEXT,
  
  -- Return shipping
  pickup_address TEXT,
  pickup_scheduled_date TIMESTAMP WITH TIME ZONE,
  pickup_completed_date TIMESTAMP WITH TIME ZONE,
  return_tracking_number VARCHAR(255),
  
  -- Refund information
  refund_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, completed
  refund_amount DECIMAL(10, 2),
  refund_method VARCHAR(50), -- original_payment, bank_transfer, store_credit
  refund_transaction_id VARCHAR(255),
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  return_product_id UUID NOT NULL REFERENCES products(id),
  exchange_product_id UUID NOT NULL REFERENCES products(id),
  return_variant_id UUID REFERENCES product_variants(id),
  exchange_variant_id UUID REFERENCES product_variants(id),
  
  quantity INTEGER NOT NULL,
  price_difference DECIMAL(10, 2) DEFAULT 0, -- Positive if exchange costs more
  
  reason VARCHAR(100),
  description TEXT,
  
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, return_shipped, exchange_shipped, completed
  admin_notes TEXT,
  
  -- Return shipping
  return_pickup_scheduled TIMESTAMP WITH TIME ZONE,
  return_tracking_number VARCHAR(255),
  
  -- Exchange shipping
  exchange_shipping_address TEXT,
  exchange_tracking_number VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT REVIEWS & RATINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  images TEXT[],
  
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- WISHLIST & FAVORITES
-- ==========================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ==========================================
-- CART (Persistent cart for logged-in users)
-- ==========================================

CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest users
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ADMIN USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, manager, support
  permissions TEXT[], -- Array of permissions
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_order ON exchanges(order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON product_reviews(customer_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(customer_id);

CREATE INDEX IF NOT EXISTS idx_carts_customer ON shopping_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON shopping_carts(session_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  new_order_number VARCHAR(50);
BEGIN
  new_order_number := 'DN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  NEW.order_number := new_order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger to auto-generate order number
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Function to update product stock when order is created
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reduce stock when order item is created
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Also update variant stock if applicable
    IF NEW.product_variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock_quantity = stock_quantity - NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.product_variant_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Restore stock when order item is deleted (order cancelled)
    UPDATE products
    SET stock_quantity = stock_quantity + OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
    
    IF OLD.product_variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock_quantity = stock_quantity + OLD.quantity,
          updated_at = NOW()
      WHERE id = OLD.product_variant_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock on order items
CREATE TRIGGER trigger_update_stock_on_order
  AFTER INSERT OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Function to update product rating when review is added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product rating
CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Function to update order status history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO order_status_history (order_id, status, comment, updated_by)
    VALUES (NEW.id, NEW.order_status, 'Status changed from ' || OLD.order_status || ' to ' || NEW.order_status, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log order status changes
CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

-- Products: Public can view active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE USING (true);

-- Offers: Public can view active offers
CREATE POLICY "Public can view active offers" ON offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert offers" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update offers" ON offers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete offers" ON offers FOR DELETE USING (true);

-- Coupons: Public can view active coupons
CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert coupons" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update coupons" ON coupons FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete coupons" ON coupons FOR DELETE USING (true);

-- Orders: Anyone can create orders, customers can view their own
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON order_items FOR SELECT USING (true);

-- Customers: Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON customers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON customers
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Customer addresses: Users can manage their own addresses
CREATE POLICY "Users can view own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Users can delete own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = customer_id);

-- Reviews: Public can view approved reviews, users can create own
CREATE POLICY "Public can view approved reviews" ON product_reviews
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = customer_id);

-- Wishlists: Users can manage their own wishlist
CREATE POLICY "Users can view own wishlist" ON wishlists
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = customer_id);

-- Shopping carts: Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON shopping_carts
  FOR ALL USING (auth.uid() = customer_id OR session_id = current_setting('app.session_id', true));

-- Returns: Users can view/create their own returns
CREATE POLICY "Users can view own returns" ON returns
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create own returns" ON returns
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Exchanges: Users can view/create their own exchanges
CREATE POLICY "Users can view own exchanges" ON exchanges
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create own exchanges" ON exchanges
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
