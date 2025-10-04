/*
  # VMS (Virtual Market Space) Database Schema

  ## Overview
  Complete database schema for VMS social marketplace platform with demo data support.

  ## New Tables
  
  ### 1. users
    - `id` (uuid, primary key) - User unique identifier
    - `email` (text, unique) - User email
    - `phone` (text) - Phone number
    - `display_name` (text) - Public display name
    - `avatar_url` (text) - Profile picture URL
    - `bio` (text) - User biography
    - `business_type` (text) - Type of business (if seller)
    - `location` (text) - User location
    - `is_verified` (boolean) - Blue tick verification status
    - `is_seller` (boolean) - Seller account flag
    - `follower_count` (integer) - Cached follower count
    - `following_count` (integer) - Cached following count
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. videos (posts)
    - `id` (uuid, primary key) - Video post unique identifier
    - `user_id` (uuid, foreign key) - Creator user ID
    - `type` (text) - Content type: video, image, text
    - `video_url` (text) - Video file URL
    - `thumbnail_url` (text) - Video thumbnail URL
    - `image_url` (text) - Image URL for image posts
    - `caption` (text) - Post caption
    - `hashtags` (text[]) - Array of hashtags
    - `product_tags` (uuid[]) - Array of tagged product IDs
    - `like_count` (integer) - Cached like count
    - `comment_count` (integer) - Cached comment count
    - `share_count` (integer) - Cached share count
    - `view_count` (integer) - View count
    - `created_at` (timestamptz) - Post creation timestamp

  ### 3. products
    - `id` (uuid, primary key) - Product unique identifier
    - `seller_id` (uuid, foreign key) - Seller user ID
    - `title` (text) - Product title
    - `description` (text) - Product description
    - `price` (numeric) - Product price in NGN
    - `currency` (text) - Currency code (default NGN)
    - `images` (text[]) - Array of product image URLs
    - `stock` (integer) - Available stock quantity
    - `sku` (text) - Stock keeping unit
    - `category` (text) - Product category
    - `is_featured` (boolean) - Featured product flag
    - `view_count` (integer) - Product view count
    - `purchase_count` (integer) - Times purchased
    - `created_at` (timestamptz) - Product creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 4. likes
    - `id` (uuid, primary key) - Like unique identifier
    - `user_id` (uuid, foreign key) - User who liked
    - `video_id` (uuid, foreign key) - Liked video
    - `created_at` (timestamptz) - Like timestamp
    - Unique constraint on (user_id, video_id)

  ### 5. comments
    - `id` (uuid, primary key) - Comment unique identifier
    - `user_id` (uuid, foreign key) - Comment author
    - `video_id` (uuid, foreign key) - Video being commented on
    - `content` (text) - Comment text
    - `created_at` (timestamptz) - Comment timestamp

  ### 6. follows
    - `id` (uuid, primary key) - Follow relationship unique identifier
    - `follower_id` (uuid, foreign key) - User who follows
    - `following_id` (uuid, foreign key) - User being followed
    - `created_at` (timestamptz) - Follow timestamp
    - Unique constraint on (follower_id, following_id)

  ### 7. conversations
    - `id` (uuid, primary key) - Conversation unique identifier
    - `participant_ids` (uuid[]) - Array of participant user IDs
    - `last_message_at` (timestamptz) - Last message timestamp
    - `created_at` (timestamptz) - Conversation creation timestamp

  ### 8. messages
    - `id` (uuid, primary key) - Message unique identifier
    - `conversation_id` (uuid, foreign key) - Parent conversation
    - `sender_id` (uuid, foreign key) - Message sender
    - `content` (text) - Message text
    - `attachment_url` (text) - Optional attachment URL
    - `is_read` (boolean) - Read status
    - `created_at` (timestamptz) - Message timestamp

  ### 9. notifications
    - `id` (uuid, primary key) - Notification unique identifier
    - `user_id` (uuid, foreign key) - Recipient user
    - `type` (text) - Notification type (like, comment, follow, message, verification)
    - `actor_id` (uuid) - User who triggered the notification
    - `video_id` (uuid) - Related video (optional)
    - `product_id` (uuid) - Related product (optional)
    - `message` (text) - Notification message
    - `is_read` (boolean) - Read status
    - `created_at` (timestamptz) - Notification timestamp

  ### 10. reports
    - `id` (uuid, primary key) - Report unique identifier
    - `reporter_id` (uuid, foreign key) - User who reported
    - `reported_user_id` (uuid) - Reported user (optional)
    - `video_id` (uuid) - Reported video (optional)
    - `product_id` (uuid) - Reported product (optional)
    - `reason` (text) - Report reason
    - `status` (text) - Status: pending, reviewed, resolved
    - `created_at` (timestamptz) - Report timestamp

  ### 11. bookmarks
    - `id` (uuid, primary key) - Bookmark unique identifier
    - `user_id` (uuid, foreign key) - User who bookmarked
    - `video_id` (uuid, foreign key) - Bookmarked video
    - `created_at` (timestamptz) - Bookmark timestamp
    - Unique constraint on (user_id, video_id)

  ### 12. verification_requests
    - `id` (uuid, primary key) - Request unique identifier
    - `user_id` (uuid, foreign key) - Requesting user
    - `status` (text) - Status: pending, approved, rejected
    - `payment_status` (text) - Payment status (demo)
    - `reviewed_at` (timestamptz) - Review timestamp
    - `created_at` (timestamptz) - Request timestamp

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated user access
  - Read policies for public content discovery
  - Write policies restricted to content owners

  ## Indexes
  - Performance indexes on foreign keys and frequently queried fields
  - GIN indexes for array columns (hashtags, product_tags)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text,
  display_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  business_type text,
  location text,
  is_verified boolean DEFAULT false,
  is_seller boolean DEFAULT false,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'video' CHECK (type IN ('video', 'image', 'text')),
  video_url text,
  thumbnail_url text,
  image_url text,
  caption text DEFAULT '',
  hashtags text[] DEFAULT '{}',
  product_tags uuid[] DEFAULT '{}',
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'NGN',
  images text[] DEFAULT '{}',
  stock integer DEFAULT 0 CHECK (stock >= 0),
  sku text,
  category text,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  attachment_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'verification', 'system')),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'demo')),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_hashtags ON videos USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for videos table
CREATE POLICY "Anyone can view videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for products table
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sellers can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- RLS Policies for likes table
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for comments table
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for follows table
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for conversations table
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reports table
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for bookmarks table
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for verification_requests table
CREATE POLICY "Users can view own verification requests"
  ON verification_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification requests"
  ON verification_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);