-- Mock Product Data for Dakshamani Naturo Food
-- Run this after creating the schema

-- ==========================================
-- PRODUCTS
-- ==========================================

-- Dry Fruits
INSERT INTO products (
  name, slug, description, short_description, price, compare_at_price, discount_percentage,
  image_url, gallery_images, category, subcategory, brand, sku, stock_quantity,
  weight_grams, weight_unit, shelf_life_days, storage_instructions, origin_country,
  certification, is_active, is_featured
) VALUES
(
  'Premium Almonds',
  'premium-almonds',
  'Fresh, crunchy premium almonds sourced from California. Rich in healthy fats, protein, and Vitamin E. Perfect for snacking or adding to your meals.',
  'Premium California almonds, rich in protein and Vitamin E',
  899.00,
  1099.00,
  18,
  'https://images.unsplash.com/photo-1599599810769-4c2c48ef6f5b?w=800',
  ARRAY['https://images.unsplash.com/photo-1599599810769-4c2c48ef6f5b?w=800'],
  'dry_fruits',
  'nuts',
  'Dakshamani',
  'DK-ALM-500',
  150,
  500,
  'grams',
  365,
  'Store in a cool, dry place in an airtight container',
  'USA',
  ARRAY['FSSAI', 'Organic'],
  true,
  true
),
(
  'Cashew Nuts',
  'cashew-nuts',
  'Premium whole cashew nuts, creamy and delicious. Great source of healthy monounsaturated fats. Perfect for cooking or snacking.',
  'Whole premium cashew nuts, creamy and delicious',
  799.00,
  950.00,
  16,
  'https://images.unsplash.com/photo-1618397384642-9f7c7b4f5b5e?w=800',
  ARRAY['https://images.unsplash.com/photo-1618397384642-9f7c7b4f5b5e?w=800'],
  'dry_fruits',
  'nuts',
  'Dakshamani',
  'DK-CAS-500',
  120,
  500,
  'grams',
  365,
  'Store in a cool, dry place. Refrigerate for longer shelf life',
  'India',
  ARRAY['FSSAI'],
  true,
  true
),
(
  'Premium Dates',
  'premium-dates',
  'Sweet and chewy premium dates, naturally rich in fiber and potassium. Perfect natural sweetener for desserts and smoothies.',
  'Natural sweet dates, rich in fiber and potassium',
  599.00,
  750.00,
  20,
  'https://images.unsplash.com/photo-1599599810769-4c2c48ef6f5b?w=800',
  ARRAY['https://images.unsplash.com/photo-1599599810769-4c2c48ef6f5b?w=800'],
  'dry_fruits',
  'dates',
  'Dakshamani',
  'DK-DAT-500',
  200,
  500,
  'grams',
  180,
  'Store in a cool, dry place away from direct sunlight',
  'UAE',
  ARRAY['FSSAI', 'Organic'],
  true,
  false
),
(
  'Garam Masala',
  'garam-masala',
  'Authentic blend of traditional Indian spices. Perfect blend of cardamom, cinnamon, cloves, and black pepper. Enhances the flavor of any dish.',
  'Authentic Indian spice blend for rich flavors',
  299.00,
  350.00,
  15,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebdebd058d?w=800'],
  'masalas',
  'spice_blend',
  'Dakshamani',
  'DK-GM-200',
  250,
  200,
  'grams',
  180,
  'Store in an airtight container away from moisture and sunlight',
  'India',
  ARRAY['FSSAI'],
  true,
  true
),
(
  'Turmeric Powder',
  'turmeric-powder',
  'Pure organic turmeric powder. Known for its anti-inflammatory properties and rich golden color. Essential for Indian cooking.',
  'Pure organic turmeric powder, anti-inflammatory',
  249.00,
  299.00,
  17,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'],
  'masalas',
  'spice_powder',
  'Dakshamani',
  'DK-TUR-200',
  300,
  200,
  'grams',
  365,
  'Keep in airtight container, away from light and moisture',
  'India',
  ARRAY['FSSAI', 'Organic'],
  true,
  false
),
(
  'Cumin Seeds',
  'cumin-seeds',
  'Aromatic whole cumin seeds. Adds earthy, warm flavor to dishes. Essential spice in Indian cuisine.',
  'Aromatic whole cumin seeds for authentic flavor',
  199.00,
  250.00,
  20,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'],
  'masalas',
  'whole_spices',
  'Dakshamani',
  'DK-CUM-200',
  400,
  200,
  'grams',
  365,
  'Store in cool, dry place in airtight container',
  'India',
  ARRAY['FSSAI'],
  true,
  false
),
(
  'Mysore Pak',
  'mysore-pak',
  'Traditional South Indian sweet made with gram flour, ghee, and sugar. Rich, melt-in-mouth texture with authentic flavor.',
  'Traditional South Indian sweet, rich and delicious',
  449.00,
  550.00,
  18,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
  ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'],
  'sweets',
  'traditional',
  'Dakshamani',
  'DK-MP-500',
  80,
  500,
  'grams',
  30,
  'Store in refrigerator. Consume within 30 days',
  'India',
  ARRAY['FSSAI'],
  true,
  true
),
(
  'Kaju Katli',
  'kaju-katli',
  'Premium cashew-based Indian sweet. Thin, diamond-shaped pieces with delicate texture and rich cashew flavor.',
  'Premium cashew-based Indian sweet, diamond-shaped',
  699.00,
  850.00,
  18,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
  ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'],
  'sweets',
  'premium',
  'Dakshamani',
  'DK-KK-500',
  60,
  500,
  'grams',
  25,
  'Store in refrigerator. Best consumed fresh',
  'India',
  ARRAY['FSSAI'],
  true,
  false
),
(
  'Pure Desi Ghee',
  'pure-desi-ghee',
  '100% pure desi ghee made from cow milk. Rich in healthy fats and essential nutrients. Traditional clarified butter with authentic taste.',
  '100% pure desi ghee made from cow milk',
  899.00,
  1100.00,
  18,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'],
  'ghee',
  'cow_ghee',
  'Dakshamani',
  'DK-GHEE-500',
  100,
  500,
  'grams',
  365,
  'Store at room temperature. Keep away from moisture and sunlight',
  'India',
  ARRAY['FSSAI', 'Organic'],
  true,
  true
),
(
  'Organic Moringa Powder',
  'organic-moringa-powder',
  'Pure organic moringa powder from fresh leaves. Rich in vitamins, minerals, and antioxidants. Superfood for daily nutrition.',
  'Pure organic moringa powder, superfood',
  399.00,
  499.00,
  20,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'],
  'moringa_powder',
  'powder',
  'Dakshamani',
  'DK-MOR-200',
  180,
  200,
  'grams',
  365,
  'Store in cool, dry place. Keep away from moisture',
  'India',
  ARRAY['FSSAI', 'Organic'],
  true,
  true
);

-- ==========================================
-- NUTRITION INFORMATION
-- ==========================================

-- Premium Almonds Nutrition
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'premium-almonds'),
  '100g',
  579.00,
  21.15,
  21.55,
  4.35,
  12.50,
  49.93,
  3.80,
  0.00,
  0.00,
  1.00,
  733.00,
  269.00,
  3.71,
  0.00,
  0.00
);

-- Cashew Nuts Nutrition
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'cashew-nuts'),
  '100g',
  553.00,
  18.22,
  30.19,
  5.91,
  3.30,
  43.85,
  7.78,
  0.00,
  0.00,
  12.00,
  660.00,
  37.00,
  6.68,
  0.00,
  0.50
);

-- Premium Dates Nutrition
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'premium-dates'),
  '100g',
  282.00,
  2.45,
  75.03,
  63.35,
  8.00,
  0.39,
  0.00,
  0.00,
  0.00,
  1.00,
  656.00,
  39.00,
  1.02,
  10.00,
  0.40
);

-- Garam Masala Nutrition (per 100g - spice blend)
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'garam-masala'),
  '100g',
  311.00,
  9.80,
  68.00,
  2.50,
  40.00,
  8.00,
  2.50,
  0.00,
  0.00,
  107.00,
  1192.00,
  931.00,
  66.00,
  175.00,
  21.40
);

-- Pure Desi Ghee Nutrition
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'pure-desi-ghee'),
  '100g',
  900.00,
  0.00,
  0.00,
  0.00,
  0.00,
  100.00,
  60.00,
  0.00,
  256.00,
  0.00,
  0.00,
  0.00,
  0.00,
  3069.00,
  0.00
);

-- Organic Moringa Powder Nutrition
INSERT INTO product_nutrition (
  product_id, serving_size, calories, protein, carbohydrates, sugar, fiber,
  fat, saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
  vitamin_a, vitamin_c
) VALUES (
  (SELECT id FROM products WHERE slug = 'organic-moringa-powder'),
  '100g',
  205.00,
  27.10,
  38.20,
  0.00,
  19.20,
  2.30,
  0.40,
  0.00,
  0.00,
  337.00,
  1324.00,
  2003.00,
  28.20,
  378.00,
  51.70
);

-- ==========================================
-- ALLERGENS
-- ==========================================

-- Premium Almonds Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'premium-almonds'), 'Tree Nuts', 'severe');

-- Cashew Nuts Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'cashew-nuts'), 'Tree Nuts', 'severe');

-- Premium Dates Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'premium-dates'), 'Sulfites', 'moderate');

-- Garam Masala Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Spices', 'mild');

-- Mysore Pak Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'mysore-pak'), 'Gluten', 'moderate'),
  ((SELECT id FROM products WHERE slug = 'mysore-pak'), 'Dairy', 'moderate');

-- Kaju Katli Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Tree Nuts', 'severe'),
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Milk', 'moderate');

-- Pure Desi Ghee Allergens
INSERT INTO product_allergens (product_id, allergen_name, severity)
VALUES 
  ((SELECT id FROM products WHERE slug = 'pure-desi-ghee'), 'Dairy', 'moderate');

-- Organic Moringa Powder Allergens
-- (No allergens - naturally allergen-free)

-- ==========================================
-- INGREDIENTS
-- ==========================================

-- Premium Almonds Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'premium-almonds'), 'Almonds', '100%', 1);

-- Cashew Nuts Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'cashew-nuts'), 'Cashew Nuts', '100%', 1);

-- Premium Dates Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'premium-dates'), 'Dates', '100%', 1);

-- Garam Masala Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Cardamom', '25%', 1),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Cinnamon', '20%', 2),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Cloves', '15%', 3),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Black Pepper', '15%', 4),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Cumin', '10%', 5),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Coriander', '10%', 6),
  ((SELECT id FROM products WHERE slug = 'garam-masala'), 'Bay Leaves', '5%', 7);

-- Turmeric Powder Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'turmeric-powder'), 'Organic Turmeric', '100%', 1);

-- Cumin Seeds Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'cumin-seeds'), 'Cumin Seeds', '100%', 1);

-- Mysore Pak Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'mysore-pak'), 'Gram Flour', '35%', 1),
  ((SELECT id FROM products WHERE slug = 'mysore-pak'), 'Ghee', '35%', 2),
  ((SELECT id FROM products WHERE slug = 'mysore-pak'), 'Sugar', '30%', 3);

-- Kaju Katli Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Cashew Nuts', '45%', 1),
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Sugar', '40%', 2),
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Ghee', '10%', 3),
  ((SELECT id FROM products WHERE slug = 'kaju-katli'), 'Cardamom', '5%', 4);

-- Pure Desi Ghee Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'pure-desi-ghee'), 'Cow Milk', '100%', 1);

-- Organic Moringa Powder Ingredients
INSERT INTO product_ingredients (product_id, ingredient_name, quantity, display_order)
VALUES 
  ((SELECT id FROM products WHERE slug = 'organic-moringa-powder'), 'Organic Moringa Leaves', '100%', 1);

-- ==========================================
-- NOTES
-- ==========================================

-- After running this script:
-- 1. All products will be created with complete information
-- 2. Nutrition data is included for most products
-- 3. Allergens are marked appropriately
-- 4. Ingredients lists are complete
-- 5. Products are set as active and some featured
-- 6. Stock quantities are set (adjust as needed)
-- 7. Images use placeholder URLs - replace with actual product images

-- To add more products, follow the same pattern:
-- 1. Insert into products table
-- 2. Insert into product_nutrition (if applicable)
-- 3. Insert into product_allergens (if applicable)
-- 4. Insert into product_ingredients

