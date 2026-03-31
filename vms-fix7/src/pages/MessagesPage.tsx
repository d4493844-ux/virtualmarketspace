import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

type ProductContext = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  sellerName: string;
};

export default function MessagesPage() {
  const { userId } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productContext, setProductContext] = useState<ProductContext | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pick up product context passed via navigation state
  useEffect(() => {
    if (location.state?.productContext) {
      setProductContext(location.state.productContext);
    }
  }, [location.state]);

  useEffect(() => {
    if (!userId && user) loadConversations();
  }, [user?.id, userId]);

  useEffect(() => {
    if (userId && user) loadOrCreateConversation();
    return () => { supabase.channel('messages-ch').unsubscribe(); };
  }, [userId, user?.id]);

  // ── INBOX: load all conversations ─────────────────────────────────────────
  const loadConversations = async () => {
    if (!user) return;
    setLoadingConvs(true);

    // FIX: use filter on contains — get ALL conversations where user is a participant
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .filter('participant_ids', 'cs', `{"${user.id}"}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversations load error:', error);
      setLoadingConvs(false);
      return;
    }

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoadingConvs(false);
      return;
    }

    // Enrich each conversation with the other user's info and last message
    const enriched = await Promise.all(
      convs.map(async (conv: any) => {
        const otherId = conv.participant_ids.find((id: string) => id !== user.id);
        if (!otherId) return null;

        const [{ data: otherUserData }, { data: lastMsgData }] = await Promise.all([
          supabase
            .from('users')
            .select('id, display_name, avatar_url, is_verified')
            .eq('id', otherId)
            .single(),
          supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!otherUserData) return null;
        return { ...conv, otherUser: otherUserData, lastMessage: lastMsgData };
      })
    );

    setConversations(enriched.filter(Boolean) as any[]);
    setLoadingConvs(false);
  };

  // ── CHAT: load or create conversation with a specific user ────────────────
  const loadOrCreateConversation = async () => {
    if (!user || !userId) return;
    setLoadingMsgs(true);

    // FIX: use filter instead of contains for reliable anon-role query
    const { data: allConvs } = await supabase
      .from('conversations')
      .select('*')
      .filter('participant_ids', 'cs', `{"${user.id}","${userId}"}`);

    // Find the one that has exactly these two participants
    const existingConv = allConvs?.find((c: any) =>
      c.participant_ids.includes(user.id) && c.participant_ids.includes(userId)
    );

    let convId: string;

    if (existingConv) {
      setConversation(existingConv);
      convId = existingConv.id;
      convIdRef.current = convId;
      loadMessages(convId);
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: [user.id, userId],
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!newConv || error) {
        console.error('Failed to create conversation:', error);
        setLoadingMsgs(false);
        return;
      }
      setConversation(newConv);
      convId = newConv.id;
      convIdRef.current = convId;
      setLoadingMsgs(false);
    }

    // Real-time subscription for new messages
    supabase
      .channel('messages-ch')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates (optimistic messages get replaced)
          const withoutOptimistic = prev.filter(m => !m.id.startsWith('temp-'));
          if (withoutOptimistic.find(m => m.id === payload.new.id)) return prev;
          return [...withoutOptimistic, payload.new];
        });
      })
      .subscribe();

    // Load the other user's profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    setOtherUser(userData);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoadingMsgs(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic update — message appears immediately
    const optimisticId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: optimisticId,
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    }]);

    const { data: saved } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    }).select().single();

    // Replace optimistic with real message
    if (saved) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? saved : m));
    }

    // FIX: update last_message_at so conversation appears at top of inbox
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  const filteredConvs = conversations.filter(c =>
    !searchQuery || c.otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════
  // CHAT VIEW
  // ══════════════════════════════════════════════════════
  if (userId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-primary)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/messages')}
            style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: 'var(--text-primary)' }} />
          </button>

          {otherUser ? (
            <>
              <div style={{ flexShrink: 0 }}>
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherUser.display_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
                    {otherUser.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {otherUser.display_name}
                  {otherUser.is_verified && <span style={{ color: '#3b82f6', marginLeft: 4 }}>✓</span>}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Active now</p>
              </div>
            </>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }} />
          )}
        </div>

        {/* Product context banner — shown when chat is tagged to a product */}
        {productContext && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderBottom: '1px solid rgba(59,130,246,0.2)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {productContext.image
                ? <img src={productContext.image} alt={productContext.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <ShoppingBag style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💬 Chatting about
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {productContext.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                ₦{productContext.price?.toLocaleString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => navigate(`/product/${productContext.id}`)}
                style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                View
              </button>
              <button
                onClick={() => setProductContext(null)}
                style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: 13, height: 13, color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loadingMsgs ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--border-color)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, opacity: 0.5 }}>
              <MessageCircle style={{ width: 36, height: 36, color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {productContext ? `Ask ${otherUser?.display_name || 'the seller'} about ${productContext.title}` : 'Say hello!'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const prevMsg = messages[i - 1];
              const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000;
              const isOffer = msg.content?.startsWith('🏷️ OFFER');

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', padding: '8px 0' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    <div style={{
                      maxWidth: '78%',
                      padding: isOffer ? '10px 14px' : '9px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      // Offer messages get a distinct teal style
                      backgroundColor: isOffer
                        ? (isMine ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)')
                        : isMine ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      color: isOffer
                        ? '#065f46'
                        : isMine ? 'var(--bg-primary)' : 'var(--text-primary)',
                      border: isOffer ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick reply suggestion when product context is set */}
        {productContext && messages.length === 0 && (
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {[
              `Is "${productContext.title}" still available?`,
              `Can you do ₦${Math.round(productContext.price * 0.9).toLocaleString()} for this?`,
              `Do you deliver?`,
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setNewMessage(suggestion)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={sendMessage}
          style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', flexShrink: 0 }}
        >
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={productContext ? `Message about ${productContext.title}…` : 'Message…'}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 50, fontSize: 14, outline: 'none',
              backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            style={{
              width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--text-primary)', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              opacity: newMessage.trim() ? 1 : 0.4, flexShrink: 0,
            }}
          >
            <Send style={{ width: 18, height: 18, color: 'var(--bg-primary)' }} />
          </button>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // INBOX VIEW
  // ══════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingBottom: 80 }}>

      <div style={{ padding: '48px 16px 16px', backgroundColor: 'var(--bg-primary)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>Messages</h1>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-secondary)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {loadingConvs ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border-color)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredConvs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16, padding: '80px 32px 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
              <MessageCircle style={{ width: 28, height: 28, color: 'var(--text-secondary)' }} />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No messages yet</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
              {searchQuery ? 'No conversations match your search' : 'Message a seller from any product page to get started'}
            </p>
          </div>
        ) : (
          filteredConvs.map(conv => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {conv.otherUser.avatar_url ? (
                <img src={conv.otherUser.avatar_url} alt={conv.otherUser.display_name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {conv.otherUser.display_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.otherUser.display_name}
                    {conv.otherUser.is_verified && <span style={{ color: '#3b82f6', marginLeft: 4, fontSize: 12 }}>✓</span>}
                  </span>
                  {conv.lastMessage && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                      {formatTime(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage
                    ? `${conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}${conv.lastMessage.content.replace(/\n/g, ' ')}`
                    : 'No messages yet'
                  }
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
