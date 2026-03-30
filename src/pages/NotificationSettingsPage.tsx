import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, MessageSquare, Heart, ShoppingBag, TrendingUp, Loader, Save, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotifSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  likes: boolean;
  comments: boolean;
  new_followers: boolean;
  messages: boolean;
  order_updates: boolean;
  promotions: boolean;
  product_updates: boolean;
}

const DEFAULT_SETTINGS: NotifSettings = {
  push_notifications: true,
  email_notifications: true,
  sms_notifications: false,
  likes: true,
  comments: true,
  new_followers: true,
  messages: true,
  order_updates: true,
  promotions: false,
  product_updates: true,
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="toggle-track flex-shrink-0"
      style={{ background: enabled ? 'var(--brand)' : 'var(--border-strong)' }}
    >
      <div
        className="toggle-thumb"
        style={{ transform: enabled ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  );
}

interface RowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onChange: () => void;
  last?: boolean;
}

function NotifRow({ icon, iconBg, title, subtitle, enabled, onChange, last }: RowProps) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border-color)' }}
    >
      <div className="icon-container" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (data?.notification_settings) {
      setSettings({ ...DEFAULT_SETTINGS, ...data.notification_settings });
    }
    setLoading(false);
  };

  const toggle = (key: keyof NotifSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ notification_settings: settings })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Error saving settings: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[13px]"
          style={{
            background: saved ? 'rgba(16,185,129,0.12)' : 'var(--brand)',
            color: saved ? '#059669' : 'white',
          }}
        >
          {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      <div className="space-y-1 py-3">
        <p className="section-label">Notification Channels</p>
        <div className="mx-4 card overflow-hidden">
          <NotifRow
            icon={<Smartphone className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
            title="Push Notifications"
            subtitle="Alerts on your device"
            enabled={settings.push_notifications}
            onChange={() => toggle('push_notifications')}
          />
          <NotifRow
            icon={<Mail className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            title="Email Notifications"
            subtitle="Updates to your inbox"
            enabled={settings.email_notifications}
            onChange={() => toggle('email_notifications')}
          />
          <NotifRow
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            title="SMS Notifications"
            subtitle="Text messages (charges may apply)"
            enabled={settings.sms_notifications}
            onChange={() => toggle('sms_notifications')}
            last
          />
        </div>

        <p className="section-label">Activity Alerts</p>
        <div className="mx-4 card overflow-hidden">
          <NotifRow
            icon={<Heart className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #ef4444, #dc2626)"
            title="Likes"
            subtitle="When someone likes your post"
            enabled={settings.likes}
            onChange={() => toggle('likes')}
          />
          <NotifRow
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            title="Comments"
            subtitle="When someone comments on your post"
            enabled={settings.comments}
            onChange={() => toggle('comments')}
          />
          <NotifRow
            icon={<Bell className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #06b6d4, #0891b2)"
            title="New Followers"
            subtitle="When someone follows you"
            enabled={settings.new_followers}
            onChange={() => toggle('new_followers')}
          />
          <NotifRow
            icon={<Mail className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
            title="Messages"
            subtitle="When you receive a message"
            enabled={settings.messages}
            onChange={() => toggle('messages')}
            last
          />
        </div>

        <p className="section-label">Commerce & Marketing</p>
        <div className="mx-4 card overflow-hidden">
          <NotifRow
            icon={<ShoppingBag className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            title="Order Updates"
            subtitle="Shipping and delivery status"
            enabled={settings.order_updates}
            onChange={() => toggle('order_updates')}
          />
          <NotifRow
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            title="Product Updates"
            subtitle="Price drops and restock alerts"
            enabled={settings.product_updates}
            onChange={() => toggle('product_updates')}
          />
          <NotifRow
            icon={<Bell className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #64748b, #475569)"
            title="Promotions"
            subtitle="Deals, offers and marketing"
            enabled={settings.promotions}
            onChange={() => toggle('promotions')}
            last
          />
        </div>

        <div className="mx-4 mt-4">
          <div className="card p-4 text-center">
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Changes are saved to your account and sync across all devices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
