# VMS Quick Start Guide

## 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

## 2. Load Seed Data

The easiest way to load seed data is through the Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy the entire contents of `seed/seed.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute

This will populate your database with:
- 8 demo users (4 sellers, 4 buyers)
- 12 videos/posts with hashtags and product tags
- 20 products across categories
- Social engagement data (likes, comments, follows)
- Conversations and messages
- Notifications

## 3. Run the App

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:5173

## 4. Demo Login

On the auth page, click one of the **Quick Demo Access** buttons:

**Seller Demo** (ada.pepper@vms.ng)
- Fresh Peppers seller
- Has products, posts, and followers
- Verified account

**Buyer Demo** (tunde.buyer@vms.ng)
- Regular user
- Can browse, like, comment, message

## 5. Explore Features

### As a Seller:
1. View your profile with products and posts
2. Check notifications
3. Access messages
4. View admin dashboard (Settings → Admin)
5. Toggle light/dark theme (Settings)

### As a Buyer:
1. Scroll through vertical video feed
2. Search for products and users
3. Browse top products
4. Follow sellers
5. Like and comment on posts
6. Message sellers about products

## Key Pages

- **/** - Home feed (Following/For You)
- **/explore** - Search, trending hashtags, top products
- **/notifications** - Activity notifications
- **/profile** - Your profile
- **/settings** - Theme toggle, verification
- **/smart-city** - VMS vision
- **/admin** - Admin dashboard

## Theme Toggle

Press **Settings** → Toggle at the top
- **Light Mode**: White bg, black text
- **Dark Mode**: Black bg, white text

## Next Steps

1. Explore the codebase structure (see README.md)
2. Review database schema in `seed/seed.sql`
3. Check DEPLOYMENT.md for production setup
4. Customize for your needs

## Troubleshooting

**No data showing?**
- Make sure you ran the seed SQL
- Check browser console for errors
- Verify Supabase connection in .env

**Videos not playing?**
- Demo videos use public URLs
- Check network connectivity
- Some videos may be slow to load

**Login issues?**
- Use demo login buttons
- Check that seed data loaded correctly
- Verify user exists in Supabase dashboard

## Tech Stack

- React 18 + TypeScript
- Vite for build
- Supabase for backend
- Tailwind CSS for styling
- React Router for navigation

## Support

For issues, check:
1. README.md - Full documentation
2. DEPLOYMENT.md - Production setup
3. src/ - Source code with comments
