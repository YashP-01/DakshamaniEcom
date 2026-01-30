# Razorpay Test API Setup Guide

This guide will help you set up Razorpay Test API for testing the ecommerce payment functionality.

## Step 1: Get Razorpay Test API Keys

1. **Sign up/Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/
   - Sign up for a new account or login to your existing account

2. **Access Test Mode**
   - Razorpay provides test mode by default for new accounts
   - Test mode uses test API keys that start with `rzp_test_`
   - You can toggle between Test and Live mode in the dashboard

3. **Get Your Test API Keys**
   - Go to **Settings** → **API Keys** in the Razorpay dashboard
   - You'll see two keys:
     - **Key ID** (starts with `rzp_test_`)
     - **Key Secret** (starts with `rzp_test_`)
   - Click on "Reveal" to see your Key Secret

## Step 2: Configure Environment Variables

1. **Create/Update `.env.local` file** in the root of your project:

```env
# Razorpay Test API Keys
# Get these from Razorpay Dashboard → Settings → API Keys

# Server-side (used in API routes)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx          # ← Your Key ID from dashboard
RAZORPAY_KEY_SECRET=rzp_test_xxxxxxxxxxxxx       # ← Your Key Secret from dashboard

# Client-side (used in browser/checkout page)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx  # ← Same Key ID as above
```

**Important Notes:**
- Replace `rzp_test_xxxxxxxxxxxxx` with your actual test keys from Razorpay dashboard
- **Key ID**: Use the same value for both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Key Secret**: Only use for `RAZORPAY_KEY_SECRET` (server-side only)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is used on the client-side (browser) for the Razorpay checkout popup
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are used on the server-side for order creation and verification
- See `RAZORPAY_ENV_VARIABLES.md` for detailed explanation

2. **Restart your development server** after updating environment variables:
   ```bash
   npm run dev
   ```

## Step 3: Test Payment Flow

### Test Cards for Razorpay Test Mode

Razorpay provides test cards that you can use to simulate different payment scenarios:

#### Successful Payment
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name

#### Failed Payment
- **Card Number**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Name**: Any name

#### Other Test Scenarios
- **Card Number**: `4000 0000 0000 0010` - Payment declined
- **Card Number**: `4000 0000 0000 0069` - Payment timeout

### Testing Steps

1. **Add products to cart** on your ecommerce site
2. **Go to checkout page** (`/checkout`)
3. **Fill in shipping information**
4. **Click "Place Order"**
5. **Razorpay payment popup will open**
6. **Use test card details**:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Name: `Test User`
7. **Complete the payment**
8. **Verify**:
   - Order is created in database
   - Payment status is "paid"
   - Order appears in customer dashboard
   - Order appears in admin panel

## Step 4: Verify Integration

### Check Server Logs
- Check your terminal/console for any Razorpay API errors
- Look for successful order creation messages

### Check Database
- Verify order is saved in `orders` table
- Check `order_items` table for order items
- Verify `razorpay_order_id` and `razorpay_payment_id` are saved

### Check Razorpay Dashboard
- Go to **Payments** section in Razorpay dashboard
- You should see test payments with status "Captured"
- Click on a payment to see full details

## Troubleshooting

### Issue: "Razorpay Key ID is not configured"
**Solution**: Make sure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set in `.env.local` and restart the dev server.

### Issue: "Razorpay SDK not loaded"
**Solution**: Check your internet connection. The Razorpay checkout script loads from CDN.

### Issue: Payment succeeds but order not created
**Solution**: 
- Check server logs for errors
- Verify `RAZORPAY_KEY_SECRET` is correct for signature verification
- Check Supabase connection and RLS policies

### Issue: "Invalid signature" error
**Solution**: 
- Ensure `RAZORPAY_KEY_SECRET` matches your Key ID
- Make sure you're using test keys (not live keys) in test mode
- Restart the server after updating environment variables

### Issue: Payment popup doesn't open
**Solution**:
- Check browser console for JavaScript errors
- Verify Razorpay script is loaded (check Network tab)
- Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is accessible on client-side

## Test Mode vs Live Mode

- **Test Mode**: Use test API keys (starts with `rzp_test_`)
  - No real money is charged
  - Use test cards for payments
  - Perfect for development and testing

- **Live Mode**: Use live API keys (starts with `rzp_live_`)
  - Real money transactions
  - Use real cards (only in production)
  - Requires account activation and KYC

## Security Notes

⚠️ **Important**: 
- Never commit `.env.local` to version control
- Test keys are safe to use in development
- Live keys should only be used in production
- Keep your Key Secret secure and never expose it to client-side code

## Next Steps

Once test mode is working:
1. Test all payment scenarios (success, failure, timeout)
2. Test order creation and database updates
3. Test order tracking and customer dashboard
4. Test admin order management
5. When ready for production, switch to live API keys

## Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Test Cards: https://razorpay.com/docs/payments/test-cards/
- Razorpay Dashboard: https://dashboard.razorpay.com/

