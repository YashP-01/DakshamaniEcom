# Razorpay Environment Variables Explained

## Quick Answer

**YES, they should have the SAME value!** Both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should be set to the **Key ID** you got from Razorpay dashboard.

## From Razorpay Dashboard

You get **2 values**:
1. **Key ID** (e.g., `rzp_test_xxxxxxxxxxxxx`)
2. **Key Secret** (e.g., `rzp_test_xxxxxxxxxxxxx`)

## Environment Variables Setup

In your `.env.local` file, you need to set:

```env
# Server-side (used in API routes)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx          # ← Same Key ID
RAZORPAY_KEY_SECRET=rzp_test_xxxxxxxxxxxxx       # ← Key Secret

# Client-side (used in browser/checkout page)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx  # ← Same Key ID
```

## Why Two Variables for the Same Key ID?

### `RAZORPAY_KEY_ID` (Server-side)
- Used in: `/app/api/payment/route.ts`
- Purpose: Create Razorpay orders on the server
- Security: Not exposed to the browser (safe for server-side use)

### `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Client-side)
- Used in: `/app/checkout/page.tsx`
- Purpose: Initialize Razorpay checkout popup in the browser
- Security: Exposed to the browser (this is safe - Key ID is public)

### `RAZORPAY_KEY_SECRET` (Server-side only)
- Used in: `/app/api/payment/route.ts`
- Purpose: Verify payment signatures
- Security: **NEVER expose this to the browser!** Only use on server-side.

## Next.js Environment Variable Rules

In Next.js:
- Variables **without** `NEXT_PUBLIC_` prefix = **Server-side only** (not accessible in browser)
- Variables **with** `NEXT_PUBLIC_` prefix = **Client-side accessible** (exposed to browser)

## Complete Example

If your Razorpay dashboard shows:
- **Key ID**: `rzp_test_ABC123XYZ456`
- **Key Secret**: `rzp_test_SECRET789DEF012`

Then your `.env.local` should be:

```env
# Server-side variables
RAZORPAY_KEY_ID=rzp_test_ABC123XYZ456
RAZORPAY_KEY_SECRET=rzp_test_SECRET789DEF012

# Client-side variable (same Key ID)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ABC123XYZ456
```

## Summary

| Variable | Value Source | Where Used | Exposed to Browser? |
|----------|-------------|------------|---------------------|
| `RAZORPAY_KEY_ID` | Key ID from dashboard | Server (API routes) | ❌ No |
| `RAZORPAY_KEY_SECRET` | Key Secret from dashboard | Server (API routes) | ❌ No |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Key ID from dashboard | Client (checkout page) | ✅ Yes |

**Important**: The Key ID is safe to expose to the browser. The Key Secret should NEVER be exposed to the browser.




