-- ============================================================
-- VMS Live Chat System Migration
-- ============================================================

-- Support agents table (separate from users)
CREATE TABLE IF NOT EXISTS support_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  is_online boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage support agents"
  ON support_agents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Agents can view own record"
  ON support_agents FOR SELECT
  TO authenticated
  USING (true);

-- Support chat sessions
CREATE TABLE IF NOT EXISTS support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES support_agents(id) ON DELETE SET NULL,
  status text DEFAULT 'bot' CHECK (status IN ('bot', 'waiting', 'active', 'resolved', 'closed')),
  topic text,
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  agent_joined_at timestamptz
);

ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON support_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
  ON support_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON support_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON support_sessions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES support_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent', 'system')),
  sender_id text, -- user uuid or agent uuid or 'bot' or 'system'
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_sessions
      WHERE support_sessions.id = support_messages.session_id
      AND support_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in own sessions"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_sessions
      WHERE support_sessions.id = support_messages.session_id
      AND support_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON support_messages FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_sessions_user_id ON support_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_status ON support_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_sessions_agent_id ON support_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_session_id ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_sessions;
