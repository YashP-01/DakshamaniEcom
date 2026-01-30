-- Add Mock Products for Testing
-- Run this in Supabase SQL Editor to add sample products

INSERT INTO products (
  name, 
  slug, 
  description, 
  short_description, 
  price, 
  compare_at_price, 
  discount_percentage, 
  image_url, 
  category, 
  stock_quantity, 
  is_active,
  show_on_homepage,
  homepage_display_order
) VALUES

-- Dry Fruits
('Premium Almonds (Badam)', 'premium-almonds-badam', 'Finest quality California almonds, rich in protein and healthy fats. Hand-picked and naturally sun-dried.', 'Premium California almonds, rich in protein', 850.00, 950.00, 10, 'https://images.unsplash.com/photo-1611250502101-0d3ffeeda0e8?w=500', 'dry_fruits', 150, true, true, 1),
('Organic Cashews (Kaju)', 'organic-cashews-kaju', 'Premium grade organic cashews, creamy and delicious. Perfect for snacking and cooking.', 'Organic creamy cashews', 650.00, 750.00, 13, 'https://images.unsplash.com/photo-1583241805006-78458de02c0d?w=500', 'dry_fruits', 200, true, true, 2),
('Golden Raisins (Kishmish)', 'golden-raisins-kishmish', 'Sweet and juicy golden raisins, naturally dried without preservatives.', 'Sweet golden raisins', 450.00, 500.00, 10, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 180, true, false, 0),
('Premium Walnuts (Akhrot)', 'premium-walnuts-akhrot', 'Fresh shelled walnuts, rich in omega-3 fatty acids. Great for brain health.', 'Fresh shelled walnuts', 900.00, 1000.00, 10, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 120, true, false, 0),
('Dates (Khajur)', 'dates-khajur', 'Premium Medjool dates, naturally sweet and rich in fiber. Perfect natural sweetener.', 'Premium Medjool dates', 550.00, 600.00, 8, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 250, true, false, 0),
('Pistachios (Pista)', 'pistachios-pista', 'Premium Iranian pistachios, naturally cracked and delicious. Rich in antioxidants.', 'Premium Iranian pistachios', 1200.00, 1350.00, 11, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 100, true, false, 0),
('Dried Apricots (Khumani)', 'dried-apricots-khumani', 'Naturally sun-dried apricots, sweet and tangy. No added sugar or preservatives.', 'Natural sun-dried apricots', 420.00, 480.00, 12, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 160, true, false, 0),
('Premium Figs (Anjeer)', 'premium-figs-anjeer', 'Soft and chewy premium figs, rich in fiber and minerals. Great for digestion.', 'Soft premium figs', 680.00, 750.00, 9, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'dry_fruits', 140, true, false, 0),

-- Masalas & Spices
('Garam Masala Powder', 'garam-masala-powder', 'Aromatic blend of premium spices including cardamom, cinnamon, cloves, and black pepper. Freshly ground.', 'Premium aromatic spice blend', 180.00, 200.00, 10, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 300, true, true, 3),
('Turmeric Powder (Haldi)', 'turmeric-powder-haldi', 'Pure organic turmeric powder, rich in curcumin. Bright yellow color and fresh aroma.', 'Organic turmeric powder', 150.00, 170.00, 12, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 400, true, false, 0),
('Red Chili Powder (Lal Mirch)', 'red-chili-powder-lal-mirch', 'Spicy red chili powder made from premium Kashmiri red chilies. Perfect heat and color.', 'Kashmiri red chili powder', 140.00, 160.00, 12, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 350, true, false, 0),
('Coriander Powder (Dhania)', 'coriander-powder-dhania', 'Freshly ground coriander powder, aromatic and flavorful. Essential for Indian cooking.', 'Fresh coriander powder', 120.00, 140.00, 14, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 380, true, false, 0),
('Cumin Powder (Jeera)', 'cumin-powder-jeera', 'Premium cumin seeds ground to fine powder. Rich aroma and earthy flavor.', 'Premium cumin powder', 130.00, 150.00, 13, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 320, true, false, 0),
('Black Pepper Powder (Kali Mirch)', 'black-pepper-powder-kali-mirch', 'Freshly ground black pepper, pungent and aromatic. Enhances flavor of any dish.', 'Fresh black pepper powder', 160.00, 180.00, 11, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 280, true, false, 0),
('Kitchen King Masala', 'kitchen-king-masala', 'Versatile spice blend for all your cooking needs. Perfect balance of flavors.', 'All-purpose spice blend', 200.00, 220.00, 9, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 290, true, false, 0),
('Chaat Masala', 'chaat-masala', 'Tangy and spicy blend perfect for snacks, fruits, and street food. Adds zing to any dish.', 'Tangy chaat spice blend', 170.00, 190.00, 10, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'masalas', 310, true, false, 0),

-- Sweets
('Premium Kaju Katli', 'premium-kaju-katli', 'Traditional Indian sweet made with premium cashews and pure ghee. Rich and melt-in-mouth.', 'Traditional cashew sweet', 650.00, 700.00, 7, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 80, true, true, 4),
('Badam Halwa', 'badam-halwa', 'Rich and creamy almond halwa, made with premium almonds and pure ghee. Traditional recipe.', 'Creamy almond halwa', 750.00, 800.00, 6, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 60, true, false, 0),
('Gulab Jamun Mix', 'gulab-jamun-mix', 'Ready-to-make gulab jamun mix. Just add water and fry. Makes soft and spongy jamuns.', 'Ready-to-make jamun mix', 280.00, 320.00, 12, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 150, true, false, 0),
('Besan Ladoo', 'besan-ladoo', 'Sweet gram flour ladoos made with pure ghee and jaggery. Traditional and delicious.', 'Traditional gram flour ladoos', 420.00, 450.00, 7, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 100, true, false, 0),
('Premium Soan Papdi', 'premium-soan-papdi', 'Flaky and melt-in-mouth soan papdi, made with gram flour and ghee. Traditional Indian sweet.', 'Flaky soan papdi', 380.00, 420.00, 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 90, true, false, 0),
('Rasgulla (6 Pcs)', 'rasgulla-6pcs', 'Soft and spongy rasgullas in light sugar syrup. Made with fresh chhena.', 'Soft spongy rasgullas', 320.00, 350.00, 9, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 120, true, false, 0),
('Kalakand', 'kalakand', 'Rich and creamy kalakand made with fresh milk and paneer. Traditional recipe with pure ingredients.', 'Creamy milk kalakand', 450.00, 500.00, 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 70, true, false, 0),
('Premium Barfi Assortment', 'premium-barfi-assortment', 'Mixed barfi box with kaju, pista, and badam barfi. Perfect for gifting.', 'Mixed barfi box', 850.00, 950.00, 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 'sweets', 50, true, false, 0),

-- Ghee
('Pure Desi Ghee (500g)', 'pure-desi-ghee-500g', 'Authentic homemade desi ghee made from pure cow milk. Rich aroma and golden color.', 'Pure cow milk ghee', 650.00, 700.00, 7, 'https://images.unsplash.com/photo-1587049352841-22d816b7c0e9?w=500', 'ghee', 200, true, true, 5),
('Pure Desi Ghee (1kg)', 'pure-desi-ghee-1kg', 'Authentic homemade desi ghee made from pure cow milk. Rich aroma and golden color.', 'Pure cow milk ghee - 1kg', 1200.00, 1350.00, 11, 'https://images.unsplash.com/photo-1587049352841-22d816b7c0e9?w=500', 'ghee', 150, true, false, 0),
('A2 Desi Ghee (500g)', 'a2-desi-ghee-500g', 'Premium A2 cow milk ghee, known for better digestibility. Traditional bilona method.', 'A2 cow milk ghee', 850.00, 950.00, 10, 'https://images.unsplash.com/photo-1587049352841-22d816b7c0e9?w=500', 'ghee', 120, true, false, 0),
('Buffalo Ghee (500g)', 'buffalo-ghee-500g', 'Pure buffalo milk ghee, rich and creamy. Perfect for cooking and traditional recipes.', 'Pure buffalo milk ghee', 580.00, 650.00, 11, 'https://images.unsplash.com/photo-1587049352841-22d816b7c0e9?w=500', 'ghee', 180, true, false, 0),

-- Moringa Powder
('Organic Moringa Powder (200g)', 'organic-moringa-powder-200g', 'Pure organic moringa leaf powder, rich in vitamins and antioxidants. Superfood for daily nutrition.', 'Organic moringa superfood', 350.00, 400.00, 12, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'moringa_powder', 250, true, true, 6),
('Organic Moringa Powder (500g)', 'organic-moringa-powder-500g', 'Pure organic moringa leaf powder, rich in vitamins and antioxidants. Superfood for daily nutrition.', 'Organic moringa superfood - 500g', 750.00, 850.00, 12, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'moringa_powder', 200, true, false, 0),
('Moringa Capsules (60 Pcs)', 'moringa-capsules-60pcs', 'Convenient moringa capsules for daily nutrition. Easy to consume, high in nutrients.', 'Moringa nutrition capsules', 450.00, 500.00, 10, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'moringa_powder', 180, true, false, 0),

-- Other Products
('Organic Honey (500g)', 'organic-honey-500g', 'Pure wild forest honey, unprocessed and unfiltered. Rich in natural enzymes and nutrients.', 'Pure wild forest honey', 550.00, 600.00, 8, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500', 'other', 220, true, true, 7),
('Organic Jaggery (1kg)', 'organic-jaggery-1kg', 'Pure organic jaggery made from sugarcane juice. Natural sweetener rich in minerals.', 'Pure organic jaggery', 180.00, 200.00, 10, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 300, true, false, 0),
('Black Sesame Seeds (Til)', 'black-sesame-seeds-til', 'Premium black sesame seeds, rich in calcium and healthy fats. Perfect for winter nutrition.', 'Premium black sesame seeds', 320.00, 360.00, 11, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 190, true, false, 0),
('Flax Seeds (Alsi)', 'flax-seeds-alsi', 'Organic golden flax seeds, high in omega-3 and fiber. Great for heart health.', 'Organic golden flax seeds', 280.00, 320.00, 12, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 210, true, false, 0),
('Chia Seeds (250g)', 'chia-seeds-250g', 'Premium organic chia seeds, superfood packed with omega-3, fiber, and protein.', 'Organic chia seeds superfood', 450.00, 500.00, 10, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 170, true, false, 0),
('Organic Coconut Oil (500ml)', 'organic-coconut-oil-500ml', 'Cold-pressed virgin coconut oil, pure and unrefined. Great for cooking and skincare.', 'Cold-pressed virgin coconut oil', 420.00, 480.00, 12, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 240, true, false, 0),
('Turmeric Root Powder (Haldi)', 'turmeric-root-powder-haldi', 'Freshly ground turmeric root powder, more potent than regular turmeric. High curcumin content.', 'Fresh turmeric root powder', 380.00, 420.00, 10, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500', 'other', 260, true, false, 0),
('Ashwagandha Powder (200g)', 'ashwagandha-powder-200g', 'Pure ashwagandha root powder, known for stress relief and energy. Traditional Ayurvedic herb.', 'Pure ashwagandha root powder', 550.00, 600.00, 8, 'https://images.unsplash.com/photo-1606312619070-d48b4daabc41?w=500', 'other', 140, true, false, 0),
('Organic Green Tea (100g)', 'organic-green-tea-100g', 'Premium organic green tea leaves, rich in antioxidants. Fresh and aromatic.', 'Organic green tea leaves', 320.00, 360.00, 11, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500', 'other', 280, true, false, 0),
('Organic Black Tea (250g)', 'organic-black-tea-250g', 'Full-bodied organic black tea, rich flavor and aroma. Perfect for morning start.', 'Organic black tea', 280.00, 320.00, 12, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500', 'other', 310, true, false, 0);

-- Note: Some products are marked with show_on_homepage = true for homepage showcase
-- Update homepage_display_order as needed

