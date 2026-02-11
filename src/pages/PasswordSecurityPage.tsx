import { useState } from 'react';
import { ArrowLeft, Lock, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PasswordSecurityPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (!error) {
      alert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      alert('Error: ' + error.message);
    }
  };

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
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Password & Security</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Current Password</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl pr-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showCurrent ? <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /> : <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl pr-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showNew ? <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /> : <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl pr-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showConfirm ? <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /> : <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
                </button>
              </div>
            </div>

            <button onClick={handleChangePassword} disabled={loading} className="w-full py-3 rounded-full font-medium" style={{ backgroundColor: '#3b82f6', color: 'white', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add an extra layer of security</p>
              </div>
            </div>
            <Toggle enabled={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
          </div>
        </div>
      </div>
    </div>
  );
}
