import { useState } from 'react';
import { ArrowLeft, Bell, Mail, MessageSquare, Heart, ShoppingBag, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    likes: true,
    comments: true,
    newFollowers: true,
    messages: true,
    orderUpdates: true,
    promotions: false,
    productUpdates: true,
  });

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="w-12 h-7 rounded-full p-1 transition-colors" style={{ backgroundColor: enabled ? '#3b82f6' : 'var(--border-color)' }}>
      <div className="w-5 h-5 rounded-full transition-transform" style={{ backgroundColor: 'white', transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>NOTIFICATION CHANNELS</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Alerts on your device</p>
              </div>
            </div>
            <Toggle enabled={settings.pushNotifications} onChange={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})} />
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updates via email</p>
              </div>
            </div>
            <Toggle enabled={settings.emailNotifications} onChange={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>SMS Notifications</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Text message alerts</p>
              </div>
            </div>
            <Toggle enabled={settings.smsNotifications} onChange={() => setSettings({...settings, smsNotifications: !settings.smsNotifications})} />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>ACTIVITY NOTIFICATIONS</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Likes</p>
            </div>
            <Toggle enabled={settings.likes} onChange={() => setSettings({...settings, likes: !settings.likes})} />
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Comments</p>
            </div>
            <Toggle enabled={settings.comments} onChange={() => setSettings({...settings, comments: !settings.comments})} />
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>New Followers</p>
            </div>
            <Toggle enabled={settings.newFollowers} onChange={() => setSettings({...settings, newFollowers: !settings.newFollowers})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Messages</p>
            </div>
            <Toggle enabled={settings.messages} onChange={() => setSettings({...settings, messages: !settings.messages})} />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>SHOPPING & SALES</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Order Updates</p>
            </div>
            <Toggle enabled={settings.orderUpdates} onChange={() => setSettings({...settings, orderUpdates: !settings.orderUpdates})} />
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Product Updates</p>
            </div>
            <Toggle enabled={settings.productUpdates} onChange={() => setSettings({...settings, productUpdates: !settings.productUpdates})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Promotions & Offers</p>
            </div>
            <Toggle enabled={settings.promotions} onChange={() => setSettings({...settings, promotions: !settings.promotions})} />
          </div>
        </div>
      </div>
    </div>
  );
}
