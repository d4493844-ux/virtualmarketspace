import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Lock, Users, MessageSquare, Mail, Phone, Save, Loader, Globe, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PrivacySettings {
  profile_visibility: boolean;
  show_activity: boolean;
  allow_messages: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_followers: boolean;
  show_following: boolean;
}

const DEFAULT: PrivacySettings = {
  profile_visibility: true,
  show_activity: true,
  allow_messages: true,
  show_email: false,
  show_phone: false,
  show_followers: true,
  show_following: true,
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="toggle-track flex-shrink-0"
      style={{ background: enabled ? 'var(--brand)' : 'var(--border-strong)' }}
    >
      <div className="toggle-thumb" style={{ transform: enabled ? 'translateX(22px)' : 'translateX(0)' }} />
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

function PrivacyRow({ icon, iconBg, title, subtitle, enabled, onChange, last }: RowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: last ? 'none' : '1px solid var(--border-color)' }}>
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

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT);
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
      .select('privacy_settings')
      .eq('id', user.id)
      .single();

    if (data?.privacy_settings) {
      setSettings({ ...DEFAULT, ...data.privacy_settings });
    }
    setLoading(false);
  };

  const toggle = (key: keyof PrivacySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ privacy_settings: settings })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Error saving: ' + error.message);
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
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Privacy Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[13px]"
          style={{ background: saved ? 'rgba(16,185,129,0.12)' : 'var(--brand)', color: saved ? '#059669' : 'white' }}
        >
          {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      <div className="space-y-1 py-3">
        <p className="section-label">Account Privacy</p>
        <div className="mx-4 card overflow-hidden">
          <PrivacyRow
            icon={<Globe className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
            title="Public Profile"
            subtitle="Anyone can discover and view your profile"
            enabled={settings.profile_visibility}
            onChange={() => toggle('profile_visibility')}
          />
          <PrivacyRow
            icon={<Eye className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            title="Show Activity Status"
            subtitle="Let others see when you're online"
            enabled={settings.show_activity}
            onChange={() => toggle('show_activity')}
          />
          <PrivacyRow
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            title="Allow Messages"
            subtitle="Let anyone send you direct messages"
            enabled={settings.allow_messages}
            onChange={() => toggle('allow_messages')}
            last
          />
        </div>

        <p className="section-label">Contact Visibility</p>
        <div className="mx-4 card overflow-hidden">
          <PrivacyRow
            icon={<Mail className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            title="Show Email Address"
            subtitle="Visible on your public profile"
            enabled={settings.show_email}
            onChange={() => toggle('show_email')}
          />
          <PrivacyRow
            icon={<Phone className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #06b6d4, #0891b2)"
            title="Show Phone Number"
            subtitle="Visible on your public profile"
            enabled={settings.show_phone}
            onChange={() => toggle('show_phone')}
            last
          />
        </div>

        <p className="section-label">Social</p>
        <div className="mx-4 card overflow-hidden">
          <PrivacyRow
            icon={<UserCheck className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
            title="Show Followers List"
            subtitle="Others can see who follows you"
            enabled={settings.show_followers}
            onChange={() => toggle('show_followers')}
          />
          <PrivacyRow
            icon={<Users className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #ec4899, #db2777)"
            title="Show Following List"
            subtitle="Others can see who you follow"
            enabled={settings.show_following}
            onChange={() => toggle('show_following')}
            last
          />
        </div>

        <div className="mx-4 mt-3">
          <div
            className="card p-4 flex gap-3"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              Your privacy settings are encrypted and saved securely. Changes sync across all your devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
