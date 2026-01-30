# Dakshamani Ecommerce - Setup Instructions

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Database**: Supabase
- **Payment**: Razorpay
- **Shipping**: Shiprocket API
- **Animations**: Framer Motion

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:
   ```env
   # Supabase (REQUIRED)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Razorpay (OPTIONAL - Leave empty for test mode)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

   # Shiprocket (OPTIONAL - Leave empty for test mode)
   SHIPROCKET_EMAIL=your_shiprocket_email
   SHIPROCKET_PASSWORD=your_shiprocket_password
   ```

**Note**: For testing, you only need Supabase credentials. The app will automatically use test mode if Razorpay/Shiprocket credentials are missing. See `TEST_MODE.md` for details.

### 3. Setup Supabase Database

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Update the environment variables with your Supabase credentials

### 4. Test Mode (No Payment APIs Required)

**For testing without Razorpay/Shiprocket:**
- Leave Razorpay and Shiprocket credentials empty in `.env.local`
- The app will automatically use test mode
- Payments will be simulated
- Orders will still be saved to database
- See `TEST_MODE.md` for complete testing guide

### 5. Setup Razorpay (Production)

1. Create a Razorpay account
2. Get your API keys from the dashboard
3. Add them to your environment variables
4. Test mode will automatically be disabled

### 6. Setup Shiprocket (Production)

1. Create a Shiprocket account
2. Set up a pickup location in Shiprocket dashboard
3. Update the pickup location name in `app/api/payment/route.ts` (currently set to "Primary")
4. Add credentials to environment variables

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Admin Panel

- **URL**: `/admin/login`
- **Default Credentials**:
  - Email: `admin@dakshamani.com`
  - Password: `admin123`

**Note**: Update the authentication logic in production to use proper authentication (Supabase Auth or your preferred auth solution).

## Features

### Customer Features
- ✅ Homepage with hero section and offer banners
- ✅ Product listing with categories and search
- ✅ Product detail pages
- ✅ Shopping cart
- ✅ Checkout with Razorpay integration
- ✅ Coupon code system
- ✅ Order tracking
- ✅ Welcome popup on first visit
- ✅ Beautiful animations throughout

### Admin Features
- ✅ Product management (CRUD)
- ✅ Offer/Banner management
- ✅ Coupon code management
- ✅ Order management
- ✅ Dashboard overview

## Payment Flow

1. Customer adds products to cart
2. Proceeds to checkout
3. Enters shipping information
4. Razorpay payment gateway opens
5. After successful payment:
   - Order is saved to database
   - Shiprocket order is automatically created
   - Customer is redirected to success page

## Important Notes

1. **Images**: Products and offers require image URLs. You can use Supabase Storage or any image hosting service.

2. **Shiprocket Integration**: Make sure to:
   - Set up pickup location in Shiprocket
   - Update the pickup location name in the code
   - Test the API integration

3. **Razorpay**: Ensure your Razorpay account is activated and you have the correct keys.

4. **Security**: 
   - Update admin authentication in production
   - Use Supabase RLS policies properly
   - Secure API routes

5. **Styling**: The project uses Tailwind CSS with custom animations. All components are styled with shadcn/ui for consistency.

## Deployment

1. Build the project: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred hosting platform
3. Update environment variables in your hosting platform
4. Ensure Supabase, Razorpay, and Shiprocket APIs are accessible from your domain

## Support

For issues or questions, refer to the documentation of:
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Razorpay](https://razorpay.com/docs)
- [Shiprocket](https://apidocs.shiprocket.in)

