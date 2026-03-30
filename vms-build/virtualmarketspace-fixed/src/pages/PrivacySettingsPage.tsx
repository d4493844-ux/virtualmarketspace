import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showActivity: true,
    allowMessages: true,
    showEmail: false,
    showPhone: false,
    showFollowers: true,
    showFollowing: true,
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
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Privacy Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>ACCOUNT PRIVACY</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile Visibility</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Make profile public</p>
              </div>
            </div>
            <Toggle enabled={settings.profileVisibility} onChange={() => setSettings({...settings, profileVisibility: !settings.profileVisibility})} />
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Activity Status</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Let others see when you're online</p>
              </div>
            </div>
            <Toggle enabled={settings.showActivity} onChange={() => setSettings({...settings, showActivity: !settings.showActivity})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Allow Messages</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Anyone can message you</p>
              </div>
            </div>
            <Toggle enabled={settings.allowMessages} onChange={() => setSettings({...settings, allowMessages: !settings.allowMessages})} />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>CONTACT INFORMATION</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Email Address</p>
            <Toggle enabled={settings.showEmail} onChange={() => setSettings({...settings, showEmail: !settings.showEmail})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Phone Number</p>
            <Toggle enabled={settings.showPhone} onChange={() => setSettings({...settings, showPhone: !settings.showPhone})} />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>SOCIAL</h2>
          </div>

          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Followers List</p>
            <Toggle enabled={settings.showFollowers} onChange={() => setSettings({...settings, showFollowers: !settings.showFollowers})} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Following List</p>
            <Toggle enabled={settings.showFollowing} onChange={() => setSettings({...settings, showFollowing: !settings.showFollowing})} />
          </div>
        </div>
      </div>
    </div>
  );
}
