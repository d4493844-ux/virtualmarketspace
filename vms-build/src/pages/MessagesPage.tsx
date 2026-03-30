import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

export default function MessagesPage() {
  const { userId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations list when no specific user
  useEffect(() => {
    if (!userId && user) {
      loadConversations();
    }
  }, [user, userId]);

  // Load specific conversation when userId present
  useEffect(() => {
    if (userId && user) {
      loadOrCreateConversation();
    }
    return () => {
      supabase.channel('messages-channel').unsubscribe();
    };
  }, [userId, user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConvs(true);

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('updated_at', { ascending: false });

    if (!convs) { setLoadingConvs(false); return; }

    // Fetch other participant details for each conversation
    const enriched = await Promise.all(convs.map(async (conv: any) => {
      const otherId = conv.participant_ids.find((id: string) => id !== user.id);
      if (!otherId) return { ...conv, otherUser: null, lastMessage: null };

      const [{ data: otherUserData }, { data: lastMsgData }] = await Promise.all([
        supabase.from('users').select('id, display_name, avatar_url, is_verified').eq('id', otherId).single(),
        supabase.from('messages').select('content, created_at, sender_id').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      return { ...conv, otherUser: otherUserData, lastMessage: lastMsgData };
    }));

    setConversations(enriched.filter(c => c.otherUser));
    setLoadingConvs(false);
  };

  const loadOrCreateConversation = async () => {
    if (!user || !userId) return;
    setLoadingMsgs(true);

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id, userId])
      .maybeSingle();

    let convId: string;

    if (existingConv) {
      setConversation(existingConv);
      convId = existingConv.id;
      loadMessages(existingConv.id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_ids: [user.id, userId] })
        .select()
        .single();

      if (newConv) {
        setConversation(newConv);
        convId = newConv.id;
        setLoadingMsgs(false);
      } else {
        setLoadingMsgs(false);
        return;
      }
    }

    supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, () => {
        loadMessages(convId);
      })
      .subscribe();

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

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    });

    // Optimistic update
    setMessages(prev => [...prev, {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    }]);
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

  // ——— CHAT VIEW (when userId is present) ———
  if (userId) {
    return (
      <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 safe-top" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          {otherUser ? (
            <>
              <div className="relative flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    {otherUser.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {otherUser.display_name}
                  {otherUser.is_verified && <span className="ml-1 text-blue-500">✓</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active now</p>
              </div>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingMsgs ? (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <MessageCircle size={36} style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Say hello!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const prevMsg = messages[i - 1];
              const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000;
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="text-center text-xs py-2" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-xs px-4 py-2.5 text-sm"
                      style={{
                        backgroundColor: isMine ? 'var(--text-primary)' : 'var(--bg-secondary)',
                        color: isMine ? 'var(--bg-primary)' : 'var(--text-primary)',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="flex gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message…"
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ backgroundColor: 'var(--text-primary)' }}
          >
            <Send className="w-4 h-4" style={{ color: 'var(--bg-primary)' }} />
          </button>
        </form>
      </div>
    );
  }

  // ——— INBOX VIEW (no userId, shows all conversations) ———
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Messages</h1>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1">
        {loadingConvs ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
          </div>
        ) : filteredConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <MessageCircle size={28} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No conversations match your search' : 'Message a seller or buyer to get started'}
            </p>
          </div>
        ) : (
          filteredConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              {conv.otherUser.avatar_url ? (
                <img src={conv.otherUser.avatar_url} alt={conv.otherUser.display_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {conv.otherUser.display_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {conv.otherUser.display_name}
                    {conv.otherUser.is_verified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {conv.lastMessage
                    ? `${conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}${conv.lastMessage.content}`
                    : 'No messages yet'}
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
