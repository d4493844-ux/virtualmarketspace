import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, CheckCircle, Clock, AlertCircle,
  User, Bot, LogOut, RefreshCw, X, Menu, Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Session = {
  id: string;
  user_id: string;
  status: string;
  topic: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  user?: { display_name: string; email: string; avatar_url: string | null };
};

type ChatMessage = {
  id: string;
  session_id: string;
  sender_type: 'user' | 'bot' | 'agent' | 'system';
  sender_id: string;
  content: string;
  created_at: string;
};

type Agent = {
  id: string;
  email: string;
  display_name: string;
  is_online: boolean;
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AgentLogin({ onLogin }: { onLogin: (agent: Agent) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple password check against hashed value
    // We store bcrypt hash but since we can't bcrypt in browser easily,
    // we use a SHA-256 approach: admin sets passwords as sha256(password)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: agent, error: err } = await supabase
      .from('support_agents')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (err || !agent) {
      setError('Invalid email or account not found');
      setLoading(false);
      return;
    }

    // Check password - stored as sha256 hex
    if (agent.password_hash !== hashHex) {
      setError('Incorrect password');
      setLoading(false);
      return;
    }

    // Mark online
    await supabase.from('support_agents').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', agent.id);

    localStorage.setItem('vms-agent', JSON.stringify(agent));
    onLogin(agent as Agent);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MessageCircle size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>VMS Support Agent</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Agent Portal Login</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#ef4444" />
            <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="agent@virtualmarketspace.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Enter your password"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
          Login credentials are provided by VMS Admin.<br />Contact <a href="mailto:support@virtualmarketspace.com" style={{ color: '#3b82f6' }}>support@virtualmarketspace.com</a>
        </p>
      </div>
    </div>
  );
}

// ─── Agent Dashboard ──────────────────────────────────────────────────────────
function AgentDashboard({ agent, onLogout }: { agent: Agent; onLogout: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    // Poll for new sessions every 10s
    const interval = setInterval(loadSessions, 10000);

    // Keep agent online
    const heartbeat = setInterval(() => {
      supabase.from('support_agents').update({ last_seen: new Date().toISOString(), is_online: true }).eq('id', agent.id);
    }, 30000);

    return () => { clearInterval(interval); clearInterval(heartbeat); };
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
      // Subscribe to new messages
      const channel = supabase
        .channel(`agent-session-${activeSession.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'support_messages',
          filter: `session_id=eq.${activeSession.id}`,
        }, (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeSession?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('support_sessions')
      .select('*, user:users!support_sessions_user_id_fkey(display_name, email, avatar_url)')
      .in('status', ['waiting', 'active', 'bot'])
      .order('updated_at', { ascending: false });
    setSessions((data as Session[]) || []);
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) || []);
  };

  const joinSession = async (session: Session) => {
    setActiveSession(session);
    if (session.status === 'waiting' || session.status === 'bot') {
      await supabase.from('support_sessions').update({
        status: 'active', agent_id: agent.id, agent_joined_at: new Date().toISOString(),
      }).eq('id', session.id);

      // Send system message
      await supabase.from('support_messages').insert({
        session_id: session.id, sender_type: 'system', sender_id: 'system',
        content: `✅ Support agent **${agent.display_name}** has joined the chat. How can I help you?`,
      });

      loadSessions();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    await supabase.from('support_messages').insert({
      session_id: activeSession.id,
      sender_type: 'agent',
      sender_id: agent.id,
      content: text,
    });

    // Update session timestamp
    await supabase.from('support_sessions').update({ updated_at: new Date().toISOString() }).eq('id', activeSession.id);

    setLoading(false);
  };

  const resolveSession = async () => {
    if (!activeSession) return;
    await supabase.from('support_sessions').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', activeSession.id);
    await supabase.from('support_messages').insert({
      session_id: activeSession.id, sender_type: 'system', sender_id: 'system',
      content: '✅ This support session has been marked as resolved. Thank you for reaching out to VMS Support!',
    });
    setActiveSession(null);
    loadSessions();
  };

  const handleLogout = async () => {
    await supabase.from('support_agents').update({ is_online: false }).eq('id', agent.id);
    onLogout();
  };

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active');

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width: 300, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Agent header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, truncate: true }}>{agent.display_name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Online</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <LogOut size={15} color="white" />
            </button>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', padding: '12px 16px', gap: 12, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1, textAlign: 'center', background: '#fef3c7', borderRadius: 10, padding: '8px 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#d97706', margin: 0 }}>{waitingSessions.length}</p>
              <p style={{ fontSize: 10, color: '#92400e', margin: 0, fontWeight: 600 }}>WAITING</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: '#dcfce7', borderRadius: 10, padding: '8px 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>{activeSessions.length}</p>
              <p style={{ fontSize: 10, color: '#166534', margin: 0, fontWeight: 600 }}>ACTIVE</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: '#dbeafe', borderRadius: 10, padding: '8px 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#1d4ed8', margin: 0 }}>{sessions.length}</p>
              <p style={{ fontSize: 10, color: '#1e40af', margin: 0, fontWeight: 600 }}>TOTAL</p>
            </div>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {waitingSessions.length > 0 && (
              <div>
                <p style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>⏳ Waiting for Agent</p>
                {waitingSessions.map(s => (
                  <button key={s.id} onClick={() => joinSession(s)}
                    style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: activeSession?.id === s.id ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', borderLeft: activeSession?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: '#d97706', fontSize: 13 }}>{s.user?.display_name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>{s.user?.display_name}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Waiting · {new Date(s.created_at).toLocaleTimeString()}</p>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {activeSessions.length > 0 && (
              <div>
                <p style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>✅ Active Chats</p>
                {activeSessions.map(s => (
                  <button key={s.id} onClick={() => { setActiveSession(s); loadMessages(s.id); }}
                    style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: activeSession?.id === s.id ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', borderLeft: activeSession?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>{s.user?.display_name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>{s.user?.display_name}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Active · {s.user?.email}</p>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {sessions.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <CheckCircle size={32} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No active sessions</p>
                <p style={{ color: '#d1d5db', fontSize: 11 }}>All clear! 🎉</p>
              </div>
            )}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
            <button onClick={loadSessions} style={{ width: '100%', padding: '8px', borderRadius: 10, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ height: 60, background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Menu size={18} color="#374151" />
          </button>
          {activeSession ? (
            <>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 15 }}>{activeSession.user?.display_name}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{activeSession.user?.email}</p>
              </div>
              <button onClick={resolveSession} style={{ padding: '8px 16px', borderRadius: 10, background: '#dcfce7', border: 'none', color: '#16a34a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Mark Resolved
              </button>
            </>
          ) : (
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>VMS Agent Dashboard</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Select a session to start chatting</p>
            </div>
          )}
        </div>

        {/* Messages */}
        {activeSession ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: msg.sender_type === 'agent' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                  {msg.sender_type === 'system' ? (
                    <div style={{ width: '100%', textAlign: 'center', padding: '8px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 12, fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>
                      {renderContent(msg.content)}
                    </div>
                  ) : (
                    <>
                      {msg.sender_type !== 'agent' && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.sender_type === 'bot' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {msg.sender_type === 'bot' ? <Bot size={13} color="white" /> : <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{activeSession.user?.display_name?.[0]?.toUpperCase()}</span>}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px',
                        borderRadius: msg.sender_type === 'agent' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.sender_type === 'agent' ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : 'white',
                        color: msg.sender_type === 'agent' ? 'white' : '#0f172a',
                        fontSize: 14, lineHeight: 1.5,
                        border: msg.sender_type === 'agent' ? 'none' : '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        {msg.sender_type === 'bot' && <p style={{ fontSize: 10, color: '#3b82f6', margin: '0 0 4px', fontWeight: 700 }}>🤖 VMS Bot</p>}
                        {renderContent(msg.content)}
                        <p style={{ fontSize: 10, margin: '4px 0 0', color: msg.sender_type === 'agent' ? 'rgba(255,255,255,0.6)' : '#94a3b8', textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '12px 20px 16px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your reply..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 50, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a' }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : '#e2e8f0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                <Send size={18} color={input.trim() ? 'white' : '#94a3b8'} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={36} color="#3b82f6" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Ready to Help</p>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Select a session from the sidebar to start chatting</p>
            </div>
            {waitingSessions.length > 0 && (
              <div style={{ padding: '12px 20px', borderRadius: 50, background: '#fef3c7', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color="#d97706" />
                <p style={{ color: '#d97706', fontWeight: 700, fontSize: 13, margin: 0 }}>{waitingSessions.length} customer{waitingSessions.length > 1 ? 's' : ''} waiting for help!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SupportAgentPage() {
  const [agent, setAgent] = useState<Agent | null>(() => {
    const saved = localStorage.getItem('vms-agent');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('vms-agent');
    setAgent(null);
  };

  if (!agent) return <AgentLogin onLogin={setAgent} />;
  return <AgentDashboard agent={agent} onLogout={handleLogout} />;
}
