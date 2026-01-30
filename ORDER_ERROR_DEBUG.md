# Order Placement Error - Debugging Guide

## 🔍 Common Causes of 500 Error

### 1. **Missing Required Fields**
The API validates these fields:
- `orderData.name` - Customer name
- `orderData.email` - Customer email
- `orderData.phone` - Customer phone
- `orderData.address` - Shipping address
- `orderData.items` - Array of cart items (must not be empty)

### 2. **Database Schema Issues**
Check if these columns exist in `orders` table:
- `order_number` (VARCHAR)
- `customer_id` (UUID, nullable)
- `customer_name` (VARCHAR)
- `customer_email` (VARCHAR)
- `customer_phone` (VARCHAR)
- `shipping_address_id` (UUID, nullable)
- `shipping_full_name` (VARCHAR)
- `shipping_address` (TEXT)
- `shipping_city` (VARCHAR)
- `shipping_state` (VARCHAR)
- `shipping_pincode` (VARCHAR)
- `shipping_country` (VARCHAR)
- `shipping_phone` (VARCHAR)
- `subtotal` (DECIMAL)
- `discount_amount` (DECIMAL)
- `coupon_discount` (DECIMAL)
- `final_amount` (DECIMAL)
- `coupon_code` (VARCHAR, nullable)
- `payment_status` (VARCHAR)
- `payment_id` (VARCHAR)
- `order_status` (VARCHAR)
- `shipping_status` (VARCHAR)
- `razorpay_order_id` (VARCHAR)
- `razorpay_payment_id` (VARCHAR)

### 3. **Check Server Terminal**
Look at your terminal/console where `npm run dev` is running. The actual error message will be logged there.

## 🛠️ How to Debug

### Step 1: Check Server Logs
Look at your terminal output. You should see detailed error messages like:
```
Order save error: [error details]
```

### Step 2: Check Browser Console
Open browser DevTools (F12) → Console tab. The error details will show:
- Which field is missing
- Database constraint violations
- Network errors

### Step 3: Verify Database Schema
Run this SQL in Supabase SQL Editor:
```sql
-- Check if orders table exists and has all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

### Step 4: Test with Minimal Data
Try placing an order with:
- Only required fields filled
- Just one product in cart
- Simple address

## 🔧 Quick Fixes

### If error says "Missing required order data":
- Make sure all form fields are filled
- Check that cart has items

### If error says "Failed to save order":
- Check Supabase table structure matches schema
- Verify RLS policies allow INSERT
- Check database connection

### If error says "Failed to save order items":
- Verify `order_items` table exists
- Check product IDs in cart are valid
- Verify product_ids exist in products table

## 📋 Test Order Data Structure

The API expects `orderData` in this format:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "items": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "price": 100,
      "image": "image-url",
      "quantity": 1,
      "discount": 0
    }
  ],
  "totalAmount": 100,
  "finalAmount": 100,
  "shippingAddressId": null
}
```

## ✅ Next Steps

1. **Check server terminal** for detailed error
2. **Verify database schema** matches expected structure
3. **Test with minimal data** to isolate issue
4. **Check browser console** for client-side errors

The improved error handling will now show you exactly what's wrong!

