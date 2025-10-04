import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, BadgeCheck } from 'lucide-react';
import { supabase, type Notification } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, actor:users!notifications_actor_id_fkey(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);

      const unreadIds = data?.filter(n => !n.is_read).map(n => n.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />;
      case 'follow':
        return <UserPlus className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />;
      case 'verification':
        return <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" />;
      default:
        return <MessageCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.video_id) {
      navigate(`/video/${notification.video_id}`);
    } else if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    } else if (notification.actor_id) {
      navigate(`/profile/${notification.actor_id}`);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Notifications
        </h1>
      </div>

      <div>
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="flex items-start gap-3 p-4 cursor-pointer transition-colors"
              style={{
                backgroundColor: notification.is_read ? 'transparent' : 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div className="flex-shrink-0">{getIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {notification.actor?.avatar_url && (
                    <img
                      src={notification.actor.avatar_url}
                      alt={notification.actor.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {notification.message}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
