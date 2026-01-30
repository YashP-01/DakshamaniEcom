# Razorpay API Troubleshooting Guide

## Common Error: 500 Internal Server Error

If you're getting a 500 error when trying to create a Razorpay order, here are the most common causes and solutions:

## 1. Check Your Environment Variables

### Verify `.env.local` file exists and has correct values:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=rzp_test_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Common Issues:
- ❌ **Missing `.env.local` file** - Create it in the root directory
- ❌ **Wrong variable names** - Must match exactly (case-sensitive)
- ❌ **Keys not from test mode** - Make sure you're using test keys (start with `rzp_test_`)
- ❌ **Extra spaces** - No spaces around the `=` sign
- ❌ **Quotes around values** - Don't use quotes: `RAZORPAY_KEY_ID="rzp_test_xxx"` ❌

### ✅ Correct Format:
```env
RAZORPAY_KEY_ID=rzp_test_ABC123XYZ456
RAZORPAY_KEY_SECRET=rzp_test_SECRET789DEF012
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ABC123XYZ456
```

## 2. Restart Development Server

**IMPORTANT**: After changing `.env.local`, you MUST restart your dev server:

1. Stop the server (Ctrl+C)
2. Start again: `npm run dev`

Environment variables are only loaded when the server starts!

## 3. Check Server Console Logs

Look at your terminal/console where `npm run dev` is running. You should see:

### ✅ Success Messages:
```
Razorpay initialized successfully with Key ID: rzp_test_...
Creating Razorpay order with options: { amount: 10000, currency: 'INR', receipt: '...' }
Razorpay order created successfully: order_xxxxx
```

### ❌ Error Messages:
```
Razorpay initialization failed: [error message]
Razorpay order creation error: [error details]
```

## 4. Verify Razorpay API Keys

### Steps:
1. Go to https://dashboard.razorpay.com/
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Settings** → **API Keys**
4. Verify your keys:
   - Key ID should start with `rzp_test_`
   - Key Secret should start with `rzp_test_`
5. If keys don't exist, click **Generate Test Key**

## 5. Check Amount Validation

Razorpay requires:
- ✅ Amount must be > 0
- ✅ Minimum amount: ₹1.00 (100 paise)
- ✅ Amount must be a valid number

### Test with a simple amount:
Try with ₹10.00 first to see if it works.

## 6. Common Razorpay API Errors

### Error: "Invalid key_id"
**Solution**: 
- Check that `RAZORPAY_KEY_ID` matches your dashboard
- Make sure you're using test keys in test mode
- Restart server after updating `.env.local`

### Error: "Invalid key_secret"
**Solution**:
- Verify `RAZORPAY_KEY_SECRET` is correct
- Make sure there are no extra spaces or quotes
- Restart server

### Error: "Invalid amount"
**Solution**:
- Amount must be at least ₹1.00
- Amount is converted to paise (multiply by 100)
- Check that `total` variable in checkout is a valid number

### Error: "Receipt already exists"
**Solution**:
- This is handled automatically - receipt is generated with timestamp
- If you see this, it's a rare timing issue - try again

## 7. Debug Steps

### Step 1: Check if Razorpay is initialized
Look for this in server logs:
```
Razorpay initialized successfully with Key ID: rzp_test_...
```

If you see "Razorpay test mode: No credentials provided", your env variables aren't loaded.

### Step 2: Check the request
In browser DevTools → Network tab:
1. Find the request to `/api/payment`
2. Check the Request payload
3. Check the Response - it should show the error details

### Step 3: Check server response
The improved error handling now returns detailed error messages. Check:
- Browser console (F12)
- Server terminal logs
- Network tab response

## 8. Test Mode vs Live Mode

### Test Mode (Current Setup)
- Uses keys starting with `rzp_test_`
- No real money transactions
- Use test cards: `4111 1111 1111 1111`
- Perfect for development

### Live Mode (Production)
- Uses keys starting with `rzp_live_`
- Real money transactions
- Requires account activation and KYC
- Only use in production

## 9. Quick Fix Checklist

- [ ] `.env.local` file exists in root directory
- [ ] All three Razorpay variables are set
- [ ] Keys start with `rzp_test_` (for test mode)
- [ ] No quotes around values
- [ ] No spaces around `=` sign
- [ ] Server restarted after changing `.env.local`
- [ ] Check server console for initialization message
- [ ] Amount is at least ₹1.00
- [ ] Browser console shows detailed error (if any)

## 10. Still Not Working?

### Enable Detailed Logging

The code now includes detailed error logging. Check:

1. **Server Terminal**: Look for error messages with full details
2. **Browser Console**: Check for error messages
3. **Network Tab**: Check the response from `/api/payment`

### Get Help

If you're still stuck, provide:
1. Error message from server console
2. Error message from browser console
3. Response from Network tab (F12 → Network → `/api/payment`)
4. Your `.env.local` format (without actual keys!)

## Example Error Response

With the improved error handling, you'll now see detailed errors like:

```json
{
  "success": false,
  "error": "Invalid key_id",
  "details": {
    "message": "...",
    "error": {
      "description": "The key_id provided is invalid",
      "reason": "invalid_key_id"
    },
    "statusCode": 401
  }
}
```

This makes it much easier to identify the exact issue!




