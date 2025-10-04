# VMS Deployment Guide

## Seed Data Loading

The demo data is in `seed/seed.sql`. To load it:

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `seed/seed.sql`
4. Paste and run the SQL

### Option 2: Via psql (if available)
\`\`\`bash
psql $SUPABASE_DB_URL -f seed/seed.sql
\`\`\`

## Demo Accounts

After loading seed data, you can login with:

**Sellers:**
- ada.pepper@vms.ng - Fresh Peppers (Verified)
- chidi.shoes@vms.ng - Footwear (Verified)
- mama.bisi@vms.ng - Groceries
- zara.fashion@vms.ng - Fashion (Verified)

**Buyers:**
- tunde.buyer@vms.ng - Food lover
- ngozi.style@vms.ng - Fashion enthusiast
- emeka.tech@vms.ng - Tech professional
- aisha.market@vms.ng - Market explorer

## Production Checklist

### Before Going Live

1. **Environment Variables**
   - Update Supabase URL and keys for production instance
   - Add rate limiting configuration
   - Configure CORS settings

2. **Database**
   - Review and optimize RLS policies
   - Set up database backups
   - Configure connection pooling
   - Add performance indexes

3. **CDN Integration**
   - Set up Cloudinary or Mux for video hosting
   - Configure video transcoding pipelines
   - Implement thumbnail generation
   - Add image optimization

4. **Payments**
   - Integrate Paystack for NGN
   - Integrate Stripe for international
   - Set up webhook handlers
   - Implement refund logic

5. **Push Notifications**
   - Integrate OneSignal or FCM
   - Request permissions properly
   - Handle notification clicks
   - Implement quiet hours

6. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure analytics (Mixpanel/Google Analytics)
   - Add performance monitoring
   - Set up logging

7. **Security**
   - Enable rate limiting
   - Add CAPTCHA for auth
   - Implement content moderation
   - Set up abuse detection

## Packaging as Mobile App

Since you requested no Expo, here are options:

### Option 1: Capacitor (Recommended)
\`\`\`bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npm run build
npx cap copy
npx cap open ios
npx cap open android
\`\`\`

### Option 2: Cordova
\`\`\`bash
npm install -g cordova
cordova create vms-app com.vms.app VMS
cd vms-app
cordova platform add ios
cordova platform add android
# Copy dist/ to www/
cordova build
\`\`\`

### Option 3: PWA (Progressive Web App)
Add to `index.html`:
\`\`\`html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
\`\`\`

Create `public/manifest.json`:
\`\`\`json
{
  "name": "VMS - Virtual Market Space",
  "short_name": "VMS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
\`\`\`

## Deployment Platforms

### Vercel (Recommended for web)
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm run build
# Drag dist/ folder to Netlify dashboard
\`\`\`

### AWS Amplify
\`\`\`bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
\`\`\`

## Post-Deployment

1. Test all demo login flows
2. Verify video playback
3. Test theme toggle
4. Check mobile responsiveness
5. Verify RLS policies work correctly
6. Test search and discovery
7. Verify notifications work
8. Test messaging system

## Admin Dashboard (Next Steps)

Create a separate Next.js project for admin:

\`\`\`bash
npx create-next-app@latest vms-admin
cd vms-admin
npm install @supabase/supabase-js
\`\`\`

Key admin features to implement:
- User management
- Content moderation
- Verification approvals
- Analytics dashboard
- Report management
- System settings
