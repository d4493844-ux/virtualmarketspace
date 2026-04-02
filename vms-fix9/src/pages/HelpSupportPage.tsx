import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, ChevronRight,
  Send, Bot, User, Loader, X, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Bot Knowledge Base ───────────────────────────────────────────────────────
const BOT_KB: { patterns: string[]; answer: string; escalate?: boolean }[] = [
  {
    patterns: ['create account', 'sign up', 'register', 'how to join'],
    answer: 'To create an account on VMS, tap **Sign Up** on the login page, enter your email, choose a password, and add your display name. You\'ll be in within seconds! 🎉',
  },
  {
    patterns: ['verified', 'verification', 'blue badge', 'blue tick', 'get verified'],
    answer: 'The **VMS Verified Badge** (₦7,000/month or ₦70,000/year) gives you a blue tick, priority placement in the Explore feed, and increased buyer trust. Go to **Settings → Get Verified Badge** to subscribe.',
  },
  {
    patterns: ['post', 'upload', 'create post', 'share video', 'upload product'],
    answer: 'To post on VMS, tap the **+ button** in the bottom nav. You can upload a video, image, or create a text post. Add captions, hashtags, and tag your products!',
  },
  {
    patterns: ['wallet', 'balance', 'money', 'fund', 'add money', 'withdraw'],
    answer: 'Your **VMS Wallet** lets you fund your account via Paystack, receive payments from buyers, and withdraw to your bank. Go to **Settings → Wallet** to manage it.',
  },
  {
    patterns: ['delivery', 'shipping', 'rider', 'track', 'order status'],
    answer: 'VMS has a built-in delivery system! After a purchase, you can track your order in real-time. Riders are assigned by our admin team. Check **Orders** for live tracking updates.',
  },
  {
    patterns: ['message', 'chat', 'contact seller', 'dm', 'direct message'],
    answer: 'To message a seller, visit their profile or product page and tap the **Message** icon. You can also find all your chats in the **Messages** tab.',
  },
  {
    patterns: ['cancel', 'subscription', 'cancel subscription', 'billing', 'unsubscribe'],
    answer: 'To cancel your subscription, go to **Settings → Billing & Payments → Cancel Subscription**. Your badge stays active until the end of the billing period.',
  },
  {
    patterns: ['report', 'inappropriate', 'abuse', 'spam', 'flag'],
    answer: 'To report content, tap the **three dots (⋯)** on any post and select **Report**. Our team reviews all reports within 24 hours.',
  },
  {
    patterns: ['delete account', 'remove account', 'close account'],
    answer: 'To delete your account, go to **Settings → scroll down → Delete Account**. ⚠️ This is permanent and cannot be undone. All your data will be removed.',
  },
  {
    patterns: ['seller', 'sell', 'how to sell', 'become seller', 'start selling'],
    answer: 'To sell on VMS, go to **Settings → Profile** and enable the Seller toggle. Then head to your **Catalogue** to add your first product. It\'s free to list!',
  },
  {
    patterns: ['ads', 'advertise', 'promote', 'campaign', 'boost'],
    answer: 'VMS Ads let you promote your products to more buyers. Go to **Settings → Ads Manager** to create a campaign. Set your budget and target audience!',
  },
  {
    patterns: ['paystack', 'payment', 'pay', 'card', 'bank transfer', 'ussd'],
    answer: 'All payments on VMS are processed securely through **Paystack**. We accept cards (Visa, Mastercard), bank transfers, and USSD. Your card details are never stored on our servers.',
  },
  {
    patterns: ['password', 'forgot password', 'reset password', 'change password'],
    answer: 'To change your password, go to **Settings → Password & Security**. If you\'ve forgotten it, tap **Forgot Password** on the login page and we\'ll send a reset link to your email.',
  },
  {
    patterns: ['explore', 'discover', 'trending', 'search', 'find'],
    answer: 'The **Explore page** shows trending content, popular sellers, and products tailored for you. Use the search bar to find specific items or hashtags.',
  },
  {
    patterns: ['notification', 'alert', 'push notification'],
    answer: 'Manage your notifications in **Settings → Notifications**. You can toggle push, email, and SMS alerts for likes, comments, orders, and more.',
  },
  // Escalation triggers
  {
    patterns: ['payment failed', 'charge twice', 'charged twice', 'double charge', 'refund', 'money deducted', 'not received'],
    answer: 'I understand this is urgent — payment issues need immediate attention. Let me connect you with a **live agent** right away. 🔴',
    escalate: true,
  },
  {
    patterns: ['account hacked', 'hacked', 'unauthorized', 'suspicious', 'security breach'],
    answer: 'This is a security concern and needs urgent attention from our team. Connecting you to a **live agent** now. 🔴',
    escalate: true,
  },
  {
    patterns: ['scam', 'fraud', 'fake seller', 'cheated', 'stolen'],
    answer: 'I\'m so sorry to hear this. This requires immediate human attention. Connecting you to a **live agent** right now. 🔴',
    escalate: true,
  },
  {
    patterns: ['agent', 'human', 'real person', 'speak to someone', 'talk to agent', 'customer care', 'customer service'],
    answer: 'Of course! Let me connect you with one of our support agents. Please hold on... 👨‍💼',
    escalate: true,
  },
];

function getBotResponse(message: string): { answer: string; escalate: boolean } {
  const lower = message.toLowerCase();
  for (const item of BOT_KB) {
    if (item.patterns.some(p => lower.includes(p))) {
      return { answer: item.answer, escalate: item.escalate || false };
    }
  }
  // Fallback
  if (lower.length < 5) {
    return { answer: 'Could you give me a bit more detail? I\'m here to help! 😊', escalate: false };
  }
  return {
    answer: 'I\'m not sure about that specific question. Let me either help you find the answer or connect you with a support agent who can assist better. Would you like me to **connect you to a live agent**? Just say "yes" or type your question differently.',
    escalate: false,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ChatMessage = {
  id: string;
  sender_type: 'user' | 'bot' | 'agent' | 'system';
  sender_id?: string;
  content: string;
  created_at: string;
};

type SupportSession = {
  id: string;
  status: 'bot' | 'waiting' | 'active' | 'resolved' | 'closed';
  agent_id?: string;
};

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { initSession(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const initSession = async () => {
    if (!user) return;
    setInitializing(true);

    // Check for existing open session
    const { data: existing } = await supabase
      .from('support_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['bot', 'waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let sess = existing as SupportSession | null;

    if (!sess) {
      // Create new session
      const { data: newSess } = await supabase
        .from('support_sessions')
        .insert({ user_id: user.id, status: 'bot' })
        .select().single();
      sess = newSess as SupportSession;

      // Send welcome message
      await addBotMessage(sess!.id, `👋 Hi **${user.display_name}**! I'm the VMS Support Bot.\n\nI can help you with:\n• Account & profile issues\n• Payments & billing\n• Selling & products\n• Delivery & orders\n• And much more!\n\nWhat can I help you with today?`);
    }

    setSession(sess);
    await loadMessages(sess!.id);
    setInitializing(false);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`session-${sess!.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `session_id=eq.${sess!.id}`,
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_sessions',
        filter: `id=eq.${sess!.id}`,
      }, (payload) => {
        setSession(payload.new as SupportSession);
        if (payload.new.status === 'active' && payload.old.status === 'waiting') {
          addSystemMessage(sess!.id, '✅ A support agent has joined the chat!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) || []);
  };

  const addBotMessage = async (sessionId: string, content: string) => {
    await supabase.from('support_messages').insert({
      session_id: sessionId,
      sender_type: 'bot',
      sender_id: 'bot',
      content,
    });
  };

  const addSystemMessage = async (sessionId: string, content: string) => {
    await supabase.from('support_messages').insert({
      session_id: sessionId,
      sender_type: 'system',
      sender_id: 'system',
      content,
    });
  };

  const cancelEscalation = async () => {
    if (!session) return;
    await supabase.from('support_sessions').update({ status: 'bot' }).eq('id', session.id);
    setSession(prev => prev ? { ...prev, status: 'bot' } : prev);
    await addSystemMessage(session.id, '↩️ No problem! Returning you to the VMS bot. How can I help?');
  };

  const escalateToAgent = async () => {
    if (!session) return;
    const sessionId = session.id;
    await supabase.from('support_sessions').update({ status: 'waiting' }).eq('id', sessionId);
    setSession(prev => prev ? { ...prev, status: 'waiting' } : prev);
    await addSystemMessage(sessionId, '⏳ You\'ve been connected to our support queue. An agent will join shortly. Average wait time: 2-5 minutes.\n\nYou can keep chatting — the agent will see the full conversation history.');

    // FIX: Auto-reset to bot after 10 minutes if no agent joins
    // This prevents the session being permanently stuck in "waiting"
    setTimeout(async () => {
      const { data: current } = await supabase
        .from('support_sessions').select('status').eq('id', sessionId).single();
      if (current?.status === 'waiting') {
        await supabase.from('support_sessions').update({ status: 'bot' }).eq('id', sessionId);
        await supabase.from('support_messages').insert({
          session_id: sessionId, sender_type: 'bot', sender_id: 'bot',
          content: '⚠️ All our agents are currently busy. I\'ve switched you back to the bot — I\'ll do my best to help! Type "connect me to an agent" anytime to try again.',
        });
        setSession(prev => prev ? { ...prev, status: 'bot' } : prev);
      }
    }, 10 * 60 * 1000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    // Save user message
    await supabase.from('support_messages').insert({
      session_id: session.id,
      sender_type: 'user',
      sender_id: user?.id,
      content: text,
    });

    // If in bot mode, get bot response
    if (session.status === 'bot') {
      setBotTyping(true);
      await new Promise(r => setTimeout(r, 900 + Math.random() * 800));
      setBotTyping(false);

      const { answer, escalate } = getBotResponse(text);
      const wantsAgent = ['yes', 'yeah', 'yep', 'please', 'ok', 'sure', 'connect me'].includes(text.toLowerCase().trim());

      if (escalate || wantsAgent) {
        await addBotMessage(session.id, answer);
        await escalateToAgent();
      } else {
        await addBotMessage(session.id, answer);
      }
    }

    // FIX: In waiting mode, still allow messages and let user cancel escalation
    if (session.status === 'waiting') {
      const cancelWords = ['cancel', 'back', 'bot', 'never mind', 'nevermind', 'forget it', 'go back'];
      const wantsToCancel = cancelWords.some(w => text.toLowerCase().includes(w));
      if (wantsToCancel) {
        await cancelEscalation();
      }
      // Otherwise just save message — agent will see it when they join
    }

    setLoading(false);
    inputRef.current?.focus();
  };

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

  const getStatusBadge = () => {
    if (session?.status === 'waiting') return { label: 'Waiting for agent...', color: '#f59e0b', pulse: true };
    if (session?.status === 'active') return { label: 'Agent connected', color: '#10b981', pulse: false };
    if (session?.status === 'resolved') return { label: 'Resolved', color: '#6366f1', pulse: false };
    return { label: 'VMS Support Bot', color: '#3b82f6', pulse: false };
  };

  const status = getStatusBadge();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 16px rgba(59,130,246,0.3)',
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {session?.status === 'active' ? <User size={22} color="white" /> : <Bot size={22} color="white" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>VMS Support</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: status.color,
              boxShadow: status.pulse ? `0 0 0 2px ${status.color}40` : 'none',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: 0 }}>{status.label}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} color="white" />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {initializing ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Loader size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: msg.sender_type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8,
              }}>
                {msg.sender_type !== 'user' && msg.sender_type !== 'system' && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: msg.sender_type === 'bot' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {msg.sender_type === 'bot' ? <Bot size={14} color="white" /> : <User size={14} color="white" />}
                  </div>
                )}

                {msg.sender_type === 'system' ? (
                  <div style={{
                    width: '100%', textAlign: 'center', padding: '8px 16px',
                    background: 'rgba(59,130,246,0.08)', borderRadius: 12,
                    fontSize: 12, color: '#3b82f6', fontWeight: 500,
                  }}>
                    {renderContent(msg.content)}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: msg.sender_type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.sender_type === 'user'
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : 'var(--bg-secondary)',
                    color: msg.sender_type === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: 14, lineHeight: 1.5,
                    border: msg.sender_type === 'user' ? 'none' : '1px solid var(--border-color)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {renderContent(msg.content)}
                    <p style={{
                      fontSize: 10, margin: '4px 0 0',
                      color: msg.sender_type === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
                      textAlign: 'right',
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {botTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#3b82f6',
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Quick action chips when in bot mode */}
      {session?.status === 'bot' && messages.length <= 2 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['How to sell?', 'Payment issue', 'Track order', 'Talk to agent'].map(q => (
            <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 50); }}
              style={{ padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', border: '1.5px solid var(--brand, #3b82f6)', background: 'transparent', color: '#3b82f6', cursor: 'pointer', flexShrink: 0 }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {session?.status !== 'resolved' && session?.status !== 'closed' && (
        <div style={{
          padding: '12px 16px 20px',
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* FIX: Show cancel banner when waiting so user is never stuck */}
          {session?.status === 'waiting' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>⏳ Waiting for an agent… Type "cancel" to go back to bot</p>
              <button onClick={cancelEscalation}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.15)', color: '#92400e', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                Cancel
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={session?.status === 'waiting' ? 'Message (agents can see this)…' : 'Type your message...'}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 50,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: input.trim() ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'var(--bg-tertiary)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <Send size={18} color={input.trim() ? 'white' : 'var(--text-tertiary)'} />
            </button>
          </div>
        </div>
      )}

      {(session?.status === 'resolved' || session?.status === 'closed') && (
        <div style={{ padding: '16px 20px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
          <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px' }}>Session Resolved</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 12px' }}>Hope we were helpful! 😊</p>
          <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 50, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Close Chat
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Help & Support Page ─────────────────────────────────────────────────
export default function HelpSupportPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

  const faqs = [
    { q: 'How do I create an account?', a: 'Tap "Sign Up" on the auth page, enter your email, password, and display name, then you\'re in!' },
    { q: 'How do I become a verified seller?', a: 'Go to Settings → Get Verified Badge and subscribe for ₦7,000/month to get the blue verification badge.' },
    { q: 'How does delivery work?', a: 'VMS has a built-in rider delivery system. After a purchase, a rider is assigned and you can track in real-time.' },
    { q: 'How do I message a seller?', a: 'Visit the seller\'s profile or product page and tap the message icon to start a conversation.' },
    { q: 'Can I cancel my verification subscription?', a: 'Yes! Go to Settings → Billing & Payments → Cancel Subscription anytime.' },
    { q: 'How do I report inappropriate content?', a: 'Tap the three dots on any post and select "Report". Our team reviews it within 24 hours.' },
    { q: 'What payment methods are accepted?', a: 'We accept cards (Visa, Mastercard), bank transfers, and USSD via Paystack.' },
    { q: 'How do I delete my account?', a: 'Go to Settings → scroll down and tap "Delete Account". Note: This is permanent!' },
  ];

  if (showChat) return <ChatWindow onClose={() => setShowChat(false)} />;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>Help & Support</h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Live chat hero card */}
        <button
          onClick={() => setShowChat(true)}
          style={{
            borderRadius: 24, padding: 20, textAlign: 'left', width: '100%', cursor: 'pointer',
            background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)',
            border: 'none', boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 17, margin: 0 }}>Live Chat Support</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0 }}>Bot available 24/7 · Agents: Mon–Sat 8am–8pm</p>
              </div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
            Get instant answers from our AI support bot. Complex issues? We'll connect you to a real agent.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 50, background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: 14 }}>
            <MessageCircle size={16} /> Start Chat
          </div>
        </button>

        {/* Contact options */}
        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '14px 20px 8px', textTransform: 'uppercase', margin: 0 }}>Other Ways to Reach Us</p>

          <a href="mailto:support@virtualmarketspace.com" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: '1px solid var(--border-color)', textDecoration: 'none', transition: 'background 0.15s' }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', flexShrink: 0 }}>
              <Mail size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Email Support</p>
              <p style={{ fontSize: 12, color: '#3b82f6', margin: '2px 0 0' }}>support@virtualmarketspace.com</p>
            </div>
            <ChevronRight size={16} color="var(--text-tertiary)" />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', flexShrink: 0 }}>
              <Phone size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Phone Support</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Mon–Sat, 8am–8pm WAT</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#059669' }}>Coming Soon</span>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0 4px 12px', textTransform: 'uppercase', margin: 0 }}>Frequently Asked Questions</p>
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ borderBottom: index < faqs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <HelpCircle size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  <p style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{faq.q}</p>
                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', transform: expandedFaq === index ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {expandedFaq === index && (
                  <div style={{ padding: '0 20px 16px 52px' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            VMS Support · <a href="mailto:support@virtualmarketspace.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>support@virtualmarketspace.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
