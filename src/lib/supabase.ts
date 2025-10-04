import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  business_type: string | null;
  location: string | null;
  is_verified: boolean;
  is_seller: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  user_id: string;
  type: 'video' | 'image' | 'text';
  video_url: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  caption: string;
  hashtags: string[];
  product_tags: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  created_at: string;
  user?: User;
};

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  stock: number;
  sku: string | null;
  category: string | null;
  is_featured: boolean;
  view_count: number;
  purchase_count: number;
  created_at: string;
  updated_at: string;
  seller?: User;
};

export type Comment = {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
  user?: User;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'verification' | 'system';
  actor_id: string | null;
  video_id: string | null;
  product_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: User;
};

export type Conversation = {
  id: string;
  participant_ids: string[];
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: User;
};
