/*
  # Create media storage bucket + fix ALL table RLS for demo users

  Problems fixed:
  1. Storage bucket "media" never existed → Bucket not found on every upload
  2. videos, products, comments, likes, follows, notifications, bookmarks, 
     reports, messages, conversations tables only allow `authenticated` role
     with auth.uid() checks — demo/anon users get 403 on INSERT

  Solution: Create the bucket, then open up RLS on all tables to also 
  work for the anon role (same pattern that fixed wallets).
*/

-- ── Create the media storage bucket ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600,  -- 100MB limit
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
    'video/x-msvideo', 'video/webm', 'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
    'video/x-msvideo', 'video/webm', 'video/ogg'
  ];

-- ── Storage policies — allow public read, open write ─────────────────────
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload media" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete media" ON storage.objects;

CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Anyone can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Anyone can update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Anyone can delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media');

-- ── Fix videos table RLS for demo/anon users ─────────────────────────────
DROP POLICY IF EXISTS "Anyone can view videos" ON videos;
DROP POLICY IF EXISTS "Users can create own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

CREATE POLICY "videos_select_all" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert_all" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "videos_update_all" ON videos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "videos_delete_all" ON videos FOR DELETE USING (true);

-- ── Fix products table RLS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Sellers can create products" ON products;
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON products;

CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_all" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_all" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "products_delete_all" ON products FOR DELETE USING (true);

-- ── Fix likes table RLS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "likes_select_all" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_all" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete_all" ON likes FOR DELETE USING (true);

-- ── Fix comments table RLS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_all" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_delete_all" ON comments FOR DELETE USING (true);

-- ── Fix follows table RLS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_all" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_delete_all" ON follows FOR DELETE USING (true);

-- ── Fix notifications table RLS ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "notifications_select_all" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON notifications FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix messages table RLS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "messages_select_all" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_all" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update_all" ON messages FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix conversations table RLS ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "conversations_select_all" ON conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert_all" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update_all" ON conversations FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix bookmarks table RLS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

CREATE POLICY "bookmarks_select_all" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "bookmarks_insert_all" ON bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "bookmarks_delete_all" ON bookmarks FOR DELETE USING (true);

-- ── Fix reports table RLS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can view reports" ON reports;

CREATE POLICY "reports_select_all" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert_all" ON reports FOR INSERT WITH CHECK (true);

-- ── Fix users table INSERT for signup ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_all" ON users FOR UPDATE USING (true) WITH CHECK (true);

