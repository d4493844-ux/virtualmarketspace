/*
  Add privacy_settings and notification_settings columns to users table.
  These were used in the UI but never added to the schema.
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{
  "profile_visibility": true,
  "show_activity": true,
  "allow_messages": true,
  "show_email": false,
  "show_phone": false,
  "show_followers": true,
  "show_following": true
}'::jsonb;

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{
  "push_notifications": true,
  "email_notifications": true,
  "sms_notifications": false,
  "likes": true,
  "comments": true,
  "new_followers": true,
  "messages": true,
  "order_updates": true,
  "promotions": false,
  "product_updates": true
}'::jsonb;

