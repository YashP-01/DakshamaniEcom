# Vertical Content Cards Setup Guide

## Overview
Interactive vertical cards that display videos or offer banners on the homepage, positioned alongside products for an engaging user experience.

## Database Setup Required

**IMPORTANT:** Run this SQL script in your Supabase SQL Editor before using the feature:

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `supabase/add-vertical-cards.sql`
3. Copy and paste the SQL code
4. Click "Run"

This will create:
- `vertical_cards` table with fields for media, position, display order
- Indexes for performance
- RLS policies for security

## Features

### Admin Panel (`/admin/vertical-cards`)
- ✅ Create, edit, and delete vertical cards
- ✅ Upload images or videos
- ✅ Set position (left or right side)
- ✅ Set display order
- ✅ Enable/disable cards
- ✅ Add optional links (clickable cards)
- ✅ Support for YouTube videos and direct video URLs

### Vertical Card Component
- ✅ **Animated hover effects**: Scale, shimmer, particles
- ✅ **Video support**: YouTube embeds and direct video URLs
- ✅ **Image support**: High-quality images with zoom effects
- ✅ **Interactive**: Click to navigate (if link provided)
- ✅ **Responsive**: Adapts to mobile/tablet/desktop
- ✅ **Smooth animations**: Framer Motion powered

### Homepage Integration
- ✅ Cards appear on left/right sides of products
- ✅ Responsive grid layout
- ✅ Mobile-friendly (cards appear below products on mobile)
- ✅ Smooth scroll animations

## How to Use

### 1. Add a Vertical Card

1. Go to `/admin/login`
2. Login with admin credentials
3. Click "Vertical Cards" in dashboard
4. Click "Add Card"
5. Fill in:
   - **Title**: Card heading
   - **Description**: Optional subtitle
   - **Media Type**: Image or Video
   - **Media URL**: 
     - For images: Direct image URL
     - For videos: YouTube URL or direct video URL
   - **Thumbnail URL**: (For videos) Preview image
   - **Link URL**: (Optional) Where to redirect on click
   - **Position**: Left or Right side
   - **Display Order**: Lower = appears first
   - **Active**: Enable/disable

### 2. Recommended Media Sizes

- **Images**: 400x600px (vertical format)
- **Video Thumbnails**: 400x600px
- **Video Format**: MP4, WebM, or YouTube URLs

### 3. Use Cases

**Factory/Hygiene Videos:**
- Show food processing videos
- Display hygiene practices
- Build trust and authenticity

**Special Offers:**
- Seasonal promotions
- Limited-time deals
- Category-specific offers

**Brand Story:**
- Behind-the-scenes content
- Company values
- Customer testimonials

## Layout

### Desktop (Large Screens)
```
┌─────────────────────────────────────────┐
│  [Left Card]  [Products Grid]  [Right] │
│  (2 cols)    (8 cols)         (2 cols) │
└─────────────────────────────────────────┘
```

### Mobile/Tablet
```
┌─────────────────┐
│  [Products]     │
│  [Products]     │
│  [Vertical Card]│
│  [Vertical Card]│
└─────────────────┘
```

## Animation Features

1. **Hover Effects**:
   - Card scales up slightly
   - Shimmer effect sweeps across
   - Floating particles appear
   - Content overlay fades in

2. **Video Playback**:
   - Videos play on hover
   - Pause when mouse leaves
   - YouTube videos with play button overlay
   - Smooth transitions

3. **Scroll Animations**:
   - Cards slide in from sides
   - Staggered animation delays
   - Smooth fade-in effects

## Tips

- **Best Practice**: Use 1-2 cards per side for optimal layout
- **Video Performance**: Use compressed videos or YouTube embeds
- **Content**: Keep titles and descriptions concise
- **Positioning**: Balance left and right cards for visual harmony
- **Mobile**: Cards appear below products automatically

## Example Content Ideas

1. **"Our Factory Process"** - Video showing food processing
2. **"Hygiene Standards"** - Image/video of clean facilities
3. **"Special Offer: 30% Off"** - Promotional banner
4. **"Farm to Table"** - Journey showcase
5. **"Customer Reviews"** - Testimonials

The vertical cards make your homepage more interactive and engaging!












