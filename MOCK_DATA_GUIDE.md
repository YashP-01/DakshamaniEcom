# Mock Product Data Guide

## 📦 Products Included

I've created **10 mock products** across all categories:

### Dry Fruits (3 products)
1. **Premium Almonds** - ₹899 (18% off)
2. **Cashew Nuts** - ₹799 (16% off)
3. **Premium Dates** - ₹599 (20% off)

### Masalas (3 products)
4. **Garam Masala** - ₹299 (15% off)
5. **Turmeric Powder** - ₹249 (17% off)
6. **Cumin Seeds** - ₹199 (20% off)

### Sweets (2 products)
7. **Mysore Pak** - ₹449 (18% off)
8. **Kaju Katli** - ₹699 (18% off)

### Ghee (1 product)
9. **Pure Desi Ghee** - ₹899 (18% off)

### Moringa Powder (1 product)
10. **Organic Moringa Powder** - ₹399 (20% off)

## 🎯 Features Included

✅ **Complete Product Information:**
- Name, slug, description
- Price with discounts
- Images (using placeholder URLs)
- Category, subcategory, brand
- SKU, weight, shelf life
- Storage instructions
- Origin country
- Certifications (FSSAI, Organic)

✅ **Nutrition Information:**
- Complete nutrition facts for major products
- Calories, protein, carbs, fats
- Vitamins and minerals
- Serving sizes

✅ **Allergens:**
- Tree nuts (severe)
- Dairy (moderate)
- Gluten (moderate)
- Spices (mild)
- Sulfites (moderate)

✅ **Ingredients:**
- Complete ingredient lists
- Quantities where applicable
- Display order

## 📋 How to Use

### Step 1: Run the SQL Script
```sql
-- Copy and paste the entire contents of supabase/mock-data.sql
-- into Supabase SQL Editor and run it
```

### Step 2: Verify Products
- Go to Admin Panel → Products
- You should see all 10 products listed
- Click "Edit" on any product to see full details

### Step 3: Test Features
- View products on `/products` page
- Click any product to see:
  - Product details tab
  - Nutrition tab (if available)
  - Ingredients tab
  - Allergen warnings

## 🔄 Replace Images

The mock data uses placeholder image URLs. To add real images:

1. Upload product images to:
   - Supabase Storage, or
   - Cloudinary, or
   - Any image hosting service

2. Update image URLs in the products table:
```sql
UPDATE products 
SET image_url = 'your-actual-image-url' 
WHERE slug = 'premium-almonds';
```

## 📊 Stock Management

Current stock quantities:
- Almonds: 150 units
- Cashew: 120 units
- Dates: 200 units
- Masalas: 250-400 units
- Sweets: 60-80 units
- Ghee: 100 units
- Moringa: 180 units

**Adjust as needed** by updating the `stock_quantity` field.

## 🎨 Customization

You can easily:
- Add more products following the same pattern
- Modify prices and discounts
- Update nutrition information
- Add/remove allergens
- Change ingredients lists
- Update stock quantities

## ✅ Testing Checklist

- [ ] Products appear in admin panel
- [ ] Products display on frontend
- [ ] Nutrition tabs show data
- [ ] Ingredients lists display correctly
- [ ] Allergen warnings appear
- [ ] Product details are complete
- [ ] Stock quantities show correctly
- [ ] Discounts calculate properly

---

**Ready to test!** 🚀

