# Test Mode Setup

## Testing Without Razorpay & Shiprocket APIs

The application now supports **Test Mode** which allows you to test the entire checkout flow without real payment or shipping APIs.

### How Test Mode Works

1. **Automatic Detection**: The app automatically detects if Razorpay credentials are missing
2. **Mock Payments**: In test mode, payment processing is simulated - no actual payment gateway is called
3. **Order Creation**: Orders are still saved to your Supabase database
4. **Shiprocket Skip**: Shiprocket integration is skipped if credentials aren't available

### Setup for Testing

1. **Only Supabase Required**: You only need to set up Supabase for testing
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Leave Payment APIs Empty** (or don't add them):
   ```env
   # You can leave these empty or comment them out for testing
   # RAZORPAY_KEY_ID=
   # RAZORPAY_KEY_SECRET=
   # NEXT_PUBLIC_RAZORPAY_KEY_ID=
   # SHIPROCKET_EMAIL=
   # SHIPROCKET_PASSWORD=
   ```

### What Happens in Test Mode

- ✅ **Checkout Flow**: Fully functional
- ✅ **Order Creation**: Orders are created in database
- ✅ **Order Items**: Saved correctly
- ✅ **Payment Simulation**: Payment is automatically "approved"
- ✅ **Order Success**: Redirects to success page
- ✅ **Cart Clearing**: Cart is cleared after order
- ⚠️ **Payment Gateway**: Shows test mode message
- ⚠️ **Shiprocket**: Skips integration (logs message)

### Test Mode Indicators

1. **Yellow Banner**: A test mode banner appears in the bottom-right corner
2. **Checkout Button**: Shows "Complete Order (Test)" instead of "Pay Now"
3. **Warning Message**: Displayed in checkout form

### Testing Checklist

- [ ] Add products to cart
- [ ] View cart with correct totals
- [ ] Apply coupon codes (if you have any in database)
- [ ] Fill checkout form
- [ ] Complete order (will simulate payment)
- [ ] Verify order appears in database
- [ ] Check order success page
- [ ] Verify cart is cleared

### Moving to Production

When you're ready to go live:

1. Add your Razorpay credentials to `.env.local`
2. Add your Shiprocket credentials
3. Test mode will automatically be disabled
4. Real payments will be processed

### Notes

- Test mode orders have payment IDs like `pay_test_1234567890`
- Orders are fully functional except for actual payment processing
- All database operations work normally
- Admin panel can view test orders

