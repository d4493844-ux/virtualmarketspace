import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function MessagesPage() {
  const { userId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  // FIX 4: ref for auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FIX 4: scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (userId) {
      loadOrCreateConversation();
    }
    return () => {
      // cleanup real-time channel on unmount
      supabase.channel('messages-channel').unsubscribe();
    };
  }, [userId]);

  const loadOrCreateConversation = async () => {
    if (!user || !userId) return;

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
      } else {
        return;
      }
    }

    // FIX 5: real-time subscription so new messages appear instantly
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

    // FIX 3: load other user info with fallback avatar handled in JSX
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
      .select('*, sender:users!messages_sender_id_fkey(*)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !user) return;

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: newMessage,
    });

    setNewMessage('');
    loadMessages(conversation.id);
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        {/* FIX 3: avatar fallback so it never shows broken image */}
        <img
          src={otherUser?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
          alt={otherUser?.display_name || 'User'}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{otherUser?.display_name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs px-4 py-2 rounded-2xl" style={{ backgroundColor: msg.sender_id === user?.id ? 'var(--text-primary)' : 'var(--bg-secondary)', color: msg.sender_id === user?.id ? 'var(--bg-primary)' : 'var(--text-primary)' }}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {/* FIX 4: anchor div for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        <button type="submit" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--text-primary)' }}>
          <Send className="w-5 h-5" style={{ color: 'var(--bg-primary)' }} />
        </button>
      </form>
    </div>
  );
}
