/*
  Add statuses table — WhatsApp-style 24hr disappearing posts
  Supports text and voice notes
*/

CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'voice')),
  content text,                        -- for text statuses
  voice_url text,                      -- for voice note statuses
  duration_seconds integer,            -- voice duration
  background_color text DEFAULT '#0f172a',
  text_color text DEFAULT '#ffffff',
  view_count integer DEFAULT 0,
  expires_at timestamptz NOT NULL,     -- always 24hrs from created_at
  created_at timestamptz DEFAULT now()
);

ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "statuses_select" ON statuses FOR SELECT USING (true);
CREATE POLICY "statuses_insert" ON statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "statuses_update" ON statuses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "statuses_delete" ON statuses FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_statuses_user ON statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_statuses_expires ON statuses(expires_at);

