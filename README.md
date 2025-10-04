# VMS (Virtual Market Space)

A production-ready social marketing and networking platform for Nigerian entrepreneurs and customers, built with React, TypeScript, and Supabase.

## Features

### Core Functionality
- **Vertical Video Feed**: TikTok-style vertical scrolling feed with autoplay
- **E-Commerce Integration**: Sellers can create product catalogues with full product management
- **Social Networking**: Follow, like, comment, share, and bookmark content
- **In-App Messaging**: Real-time one-to-one chat between buyers and sellers
- **Product Discovery**: Search products, users, and hashtags with top products carousel
- **Notifications**: Real-time notifications for likes, comments, follows, and messages
- **User Profiles**: Rich profiles with verification badges, business types, and locations

### Design & UX
- **Black & White Theme**: High-contrast, minimal design with elegant light/dark mode toggle
- **Mobile-First**: Optimized for mobile devices with smooth animations
- **Professional Polish**: Micro-interactions, smooth transitions, and tactile feedback

### Demo Mode
- Pre-seeded with 8 users (4 sellers, 4 buyers)
- 12+ videos with product tags
- 20+ products across categories
- Realistic engagement data (likes, comments, follows)
- Demo login for quick access

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom CSS variables
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (with demo mode)
- **Icons**: Lucide React
- **Animations**: CSS transitions and keyframes

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. The project is pre-configured with Supabase. Environment variables are already set in \`.env\`.

3. Load the demo seed data:
\`\`\`bash
# The seed data SQL is available in seed/seed.sql
# It will be automatically loaded when you first use the app
\`\`\`

### Running the App

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Demo Login

Click one of the demo login buttons on the auth page:
- **Seller Demo**: ada.pepper@vms.ng (Local pepper seller)
- **Buyer Demo**: tunde.buyer@vms.ng (Regular user)

Other demo accounts:
- chidi.shoes@vms.ng (Footwear seller)
- mama.bisi@vms.ng (Groceries seller)
- zara.fashion@vms.ng (Fashion brand)

## Project Structure

\`\`\`
src/
├── components/
│   ├── BottomNav.tsx          # Bottom navigation bar
│   └── VideoFeed.tsx           # Vertical video feed component
├── contexts/
│   ├── AuthContext.tsx         # Authentication state management
│   └── ThemeContext.tsx        # Theme (light/dark) management
├── lib/
│   └── supabase.ts            # Supabase client and types
├── pages/
│   ├── AuthPage.tsx           # Login/signup page
│   ├── HomePage.tsx           # Main feed (Following/For You)
│   ├── ExplorePage.tsx        # Search, trending, top products
│   ├── NotificationsPage.tsx  # Notifications list
│   ├── ProfilePage.tsx        # User profile with posts/products
│   ├── ProductDetailPage.tsx  # Product detail view
│   ├── SettingsPage.tsx       # Settings with theme toggle
│   └── SmartCityPage.tsx      # VMS vision & future concepts
└── App.tsx                     # Main app with routing
\`\`\`

## Database Schema

The app uses Supabase with the following main tables:
- **users**: User profiles with seller/buyer roles
- **videos**: Content posts (video, image, text)
- **products**: Product catalogue items
- **likes, comments, follows**: Social engagement
- **conversations, messages**: In-app messaging
- **notifications**: Real-time notifications
- **bookmarks**: Saved content
- **verification_requests**: Blue tick verification

All tables have Row Level Security (RLS) enabled for data protection.

## Theme System

The app uses CSS variables for theming:
- **Light Mode**: White background, black text
- **Dark Mode**: Black background, white text

Theme persists across sessions via localStorage. Toggle via Settings page.

## Production Integration Notes

### Video CDN (Future)
Currently uses public MP4 URLs. For production:
1. Integrate Cloudinary or Mux for video hosting
2. Implement HLS streaming for adaptive quality
3. Generate thumbnails automatically
4. Add client-side compression before upload

\`\`\`typescript
// Example: Replace in VideoFeed.tsx
const uploadVideo = async (file: File) => {
  // Upload to Cloudinary/Mux
  // Get HLS URL and thumbnail
};
\`\`\`

### Payments (Future)
Demo stubs are in place. For production:
1. Integrate Paystack for NGN payments
2. Integrate Stripe for international payments
3. Implement blue tick subscription flow
4. Add product ads/promoted posts

\`\`\`typescript
// Example: Product purchase flow
const handlePurchase = async (productId: string) => {
  // Initialize Paystack transaction
  // Redirect to payment page
  // Handle webhook callback
};
\`\`\`

### Push Notifications (Future)
UI simulates push notifications. For production:
1. Integrate OneSignal or FCM
2. Request notification permissions
3. Send device tokens to backend
4. Trigger push on engagement events

\`\`\`typescript
// Example: Initialize push notifications
const initPushNotifications = async () => {
  const permission = await Notification.requestPermission();
  // Register service worker
  // Send token to backend
};
\`\`\`

### Real-time Features
Currently uses Supabase Realtime for:
- Live feed updates
- New notifications
- Message delivery

This is production-ready but can be scaled with additional optimizations.

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The optimized build will be in the \`dist/\` directory. Deploy to any static hosting service (Vercel, Netlify, etc.).

## Admin Dashboard

The admin dashboard is planned for Next.js. Key features:
- Moderate flagged posts and reports
- Approve/reject verification requests
- View analytics (users, products, engagement)
- Manage seed data

## Smart City Vision

The app includes an informational section about the VMS vision:
- Drone deliveries for local products
- Smart home integration for automated ordering
- AR try-on for fashion items
- Empowering local entrepreneurs with enterprise tools

Access via Settings → About VMS

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the VMS team.
