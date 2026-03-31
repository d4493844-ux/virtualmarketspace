/*
  MASTER FIX MIGRATION — Run this in Supabase SQL Editor
  
  Fixes:
  1. wallets — anon INSERT/UPDATE/SELECT policies (CREATE POLICY IF NOT EXISTS is invalid syntax, policies never ran)
  2. transactions — anon INSERT policy missing entirely
  3. All other tables that block demo/anon users
  4. Storage bucket "media" creation
  5. Storage object policies
*/

-- ═══ WALLETS ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Anon can view wallets" ON wallets;
DROP POLICY IF EXISTS "Anon can update wallets" ON wallets;
DROP POLICY IF EXISTS "Anon can insert wallets" ON wallets;
DROP POLICY IF EXISTS "wallet_select_all" ON wallets;
DROP POLICY IF EXISTS "wallet_insert_all" ON wallets;
DROP POLICY IF EXISTS "wallet_update_all" ON wallets;

CREATE POLICY "wallet_select" ON wallets FOR SELECT USING (true);
CREATE POLICY "wallet_insert" ON wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "wallet_update" ON wallets FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ TRANSACTIONS ══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Anon can view transactions" ON transactions;
DROP POLICY IF EXISTS "Anon can insert transactions" ON transactions;
DROP POLICY IF EXISTS "transaction_select_all" ON transactions;
DROP POLICY IF EXISTS "transaction_insert_all" ON transactions;
DROP POLICY IF EXISTS "transaction_update_all" ON transactions;

CREATE POLICY "transaction_select" ON transactions FOR SELECT USING (true);
CREATE POLICY "transaction_insert" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "transaction_update" ON transactions FOR UPDATE USING (true) WITH CHECK (true);

-- Fix transactions type enum
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('deposit','withdrawal','payment_received','payment_sent','transfer_in','transfer_out'));

-- ═══ WALLET TRANSFERS ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Users can create transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Anon view transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Anon insert transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "wallet_transfers_select_all" ON wallet_transfers;
DROP POLICY IF EXISTS "wallet_transfers_insert_all" ON wallet_transfers;

CREATE POLICY "wtransfer_select" ON wallet_transfers FOR SELECT USING (true);
CREATE POLICY "wtransfer_insert" ON wallet_transfers FOR INSERT WITH CHECK (true);

-- ═══ BANK WITHDRAWALS ══════════════════════════════════════════════════════
ALTER TABLE bank_withdrawals ADD COLUMN IF NOT EXISTS charge_applied decimal(15,2) DEFAULT 0;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon view withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon insert withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon update withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "bank_withdrawals_select_all" ON bank_withdrawals;
DROP POLICY IF EXISTS "bank_withdrawals_insert_all" ON bank_withdrawals;
DROP POLICY IF EXISTS "bank_withdrawals_update_all" ON bank_withdrawals;

CREATE POLICY "bwithdraw_select" ON bank_withdrawals FOR SELECT USING (true);
CREATE POLICY "bwithdraw_insert" ON bank_withdrawals FOR INSERT WITH CHECK (true);
CREATE POLICY "bwithdraw_update" ON bank_withdrawals FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ ORDERS ════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Anon can view orders" ON orders;
DROP POLICY IF EXISTS "Anon can insert orders" ON orders;
DROP POLICY IF EXISTS "Anon can update orders" ON orders;
DROP POLICY IF EXISTS "orders_select_all" ON orders;
DROP POLICY IF EXISTS "orders_insert_all" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;

CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ RIDERS ════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can view riders" ON riders;
DROP POLICY IF EXISTS "Riders can update own location" ON riders;
DROP POLICY IF EXISTS "Insert riders" ON riders;
DROP POLICY IF EXISTS "Anon view riders" ON riders;
DROP POLICY IF EXISTS "Anon update riders" ON riders;
DROP POLICY IF EXISTS "Anon insert riders" ON riders;
DROP POLICY IF EXISTS "riders_select_all" ON riders;
DROP POLICY IF EXISTS "riders_insert_all" ON riders;
DROP POLICY IF EXISTS "riders_update_all" ON riders;

CREATE POLICY "riders_select" ON riders FOR SELECT USING (true);
CREATE POLICY "riders_insert" ON riders FOR INSERT WITH CHECK (true);
CREATE POLICY "riders_update" ON riders FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ VERIFICATION REQUESTS ═════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can update own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can insert verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can update verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can view verification requests" ON verification_requests;
DROP POLICY IF EXISTS "verif_select_all" ON verification_requests;
DROP POLICY IF EXISTS "verif_insert_all" ON verification_requests;
DROP POLICY IF EXISTS "verif_update_all" ON verification_requests;

CREATE POLICY "verif_select" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "verif_insert" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "verif_update" ON verification_requests FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ VIDEOS ════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can view videos" ON videos;
DROP POLICY IF EXISTS "Users can create own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
DROP POLICY IF EXISTS "videos_select_all" ON videos;
DROP POLICY IF EXISTS "videos_insert_all" ON videos;
DROP POLICY IF EXISTS "videos_update_all" ON videos;
DROP POLICY IF EXISTS "videos_delete_all" ON videos;

CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "videos_update" ON videos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "videos_delete" ON videos FOR DELETE USING (true);

-- ═══ PRODUCTS ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Sellers can create products" ON products;
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_all" ON products;
DROP POLICY IF EXISTS "products_update_all" ON products;
DROP POLICY IF EXISTS "products_delete_all" ON products;

CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products FOR DELETE USING (true);

-- ═══ LIKES, COMMENTS, FOLLOWS ══════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (true);

-- ═══ NOTIFICATIONS ═════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (true);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ MESSAGES & CONVERSATIONS ══════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "messages_select_all" ON messages;
DROP POLICY IF EXISTS "messages_insert_all" ON messages;
DROP POLICY IF EXISTS "messages_update_all" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_select_all" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_all" ON conversations;
DROP POLICY IF EXISTS "conversations_update_all" ON conversations;
CREATE POLICY "convos_select" ON conversations FOR SELECT USING (true);
CREATE POLICY "convos_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "convos_update" ON conversations FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ BOOKMARKS & REPORTS ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can view reports" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);

-- ═══ USERS ═════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true) WITH CHECK (true);

-- ═══ STORAGE BUCKET ════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 104857600,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp',
        'video/mp4','video/mov','video/avi','video/quicktime',
        'video/x-msvideo','video/webm','video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- ═══ STORAGE POLICIES ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload media" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete media" ON storage.objects;

CREATE POLICY "media_read"   ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_update" ON storage.objects FOR UPDATE USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- ═══ FIX DEAD VIDEO URLs IN EXISTING DATA ══════════════════════════════════
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' WHERE video_url LIKE '%ForBiggerBlazes%';
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' WHERE video_url LIKE '%ForBiggerEscapes%';
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4' WHERE video_url LIKE '%ForBiggerFun%';
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4' WHERE video_url LIKE '%ForBiggerJoyrides%';
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' WHERE video_url LIKE '%ForBiggerMeltdowns%';
UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' WHERE video_url LIKE '%ElephantsDream%';

