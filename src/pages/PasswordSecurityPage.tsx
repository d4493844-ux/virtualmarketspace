import { useState } from 'react';
import { ArrowLeft, Lock, Shield, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function PasswordSecurityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      alert('Please enter your current password!');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters!');
      return;
    }

    if (newPassword === currentPassword) {
      alert('New password must be different from current password!');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      alert('Password must contain uppercase, lowercase, and numbers!');
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Verify current password by re-authenticating
      if (!user?.email) {
        alert('User email not found!');
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        alert('Current password is incorrect!');
        setLoading(false);
        return;
      }

      // STEP 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        alert('Error updating password: ' + updateError.message);
        setLoading(false);
        return;
      }

      // Success!
      alert('✅ Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button 
      onClick={onChange} 
      className="w-12 h-7 rounded-full p-1 transition-colors" 
      style={{ backgroundColor: enabled ? '#3b82f6' : 'var(--border-color)' }}
    >
      <div 
        className="w-5 h-5 rounded-full transition-transform" 
        style={{ 
          backgroundColor: 'white', 
          transform: enabled ? 'translateX(20px)' : 'translateX(0)' 
        }} 
      />
    </button>
  );

  const PasswordStrength = ({ password }: { password: string }) => {
    if (!password) return null;

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const strength = Object.values(checks).filter(Boolean).length;
    const strengthText = strength <= 2 ? 'Weak' : strength === 3 ? 'Fair' : strength === 4 ? 'Good' : 'Strong';
    const strengthColor = strength <= 2 ? '#ef4444' : strength === 3 ? '#f59e0b' : strength === 4 ? '#3b82f6' : '#10b981';

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
            <div 
              className="h-full rounded-full transition-all" 
              style={{ 
                width: `${(strength / 5) * 100}%`, 
                backgroundColor: strengthColor 
              }} 
            />
          </div>
          <span className="text-xs font-medium" style={{ color: strengthColor }}>
            {strengthText}
          </span>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2" style={{ color: checks.length ? '#10b981' : 'var(--text-secondary)' }}>
            {checks.length ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border" />}
            At least 8 characters
          </div>
          <div className="flex items-center gap-2" style={{ color: checks.uppercase ? '#10b981' : 'var(--text-secondary)' }}>
            {checks.uppercase ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border" />}
            One uppercase letter
          </div>
          <div className="flex items-center gap-2" style={{ color: checks.lowercase ? '#10b981' : 'var(--text-secondary)' }}>
            {checks.lowercase ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border" />}
            One lowercase letter
          </div>
          <div className="flex items-center gap-2" style={{ color: checks.number ? '#10b981' : 'var(--text-secondary)' }}>
            {checks.number ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border" />}
            One number
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Password & Security</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Password Change Section */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Current Password *
              </label>
              <div className="relative">
                <input 
                  type={showCurrent ? 'text' : 'password'} 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 rounded-xl pr-12" 
                  style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showCurrent ? (
                    <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                New Password *
              </label>
              <div className="relative">
                <input 
                  type={showNew ? 'text' : 'password'} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl pr-12" 
                  style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showNew ? (
                    <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Confirm New Password *
              </label>
              <div className="relative">
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl pr-12" 
                  style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'var(--text-primary)', 
                    border: confirmPassword && newPassword !== confirmPassword ? '1px solid #ef4444' : '1px solid var(--border-color)' 
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button 
              onClick={handleChangePassword} 
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full py-3 rounded-xl font-medium" 
              style={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                opacity: (loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) ? 0.5 : 1 
              }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Two-Factor Authentication
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <Toggle enabled={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
          </div>
          
          {twoFactorEnabled && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Two-factor authentication setup is coming soon. You'll receive a code via SMS or authenticator app when logging in.
              </p>
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Security Tips</h3>
          </div>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Use a unique password for your VMS account</li>
            <li>• Never share your password with anyone</li>
            <li>• Change your password regularly (every 3-6 months)</li>
            <li>• Enable two-factor authentication for extra security</li>
            <li>• Be cautious of phishing attempts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}