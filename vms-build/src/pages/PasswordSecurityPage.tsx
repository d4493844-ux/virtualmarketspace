import { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, XCircle, Shield, Key, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#10b981'];
  const labels = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'var(--border-strong)' }}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium" style={{ color: colors[score] }}>{labels[score]}</p>
      <div className="space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            {c.ok
              ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
              : <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
            <span className="text-[12px]" style={{ color: c.ok ? '#10b981' : 'var(--text-tertiary)' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({
  label, value, onChange, show, onToggleShow, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pr-12"
        />
        <button
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordSecurityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const passwordsMatch = next && confirm && next === confirm;
  const passwordMismatch = next && confirm && next !== confirm;

  const handleChangePassword = async () => {
    if (!current) return alert('Enter your current password');
    if (next !== confirm) return alert('New passwords do not match');
    if (next.length < 8) return alert('Password must be at least 8 characters');
    if (next === current) return alert('New password must be different from current');
    if (!/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/[0-9]/.test(next)) {
      return alert('Password needs uppercase, lowercase, and a number');
    }
    if (!user?.email) return alert('No email found');

    setLoading(true);
    try {
      // Re-authenticate
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });

      if (reAuthError) {
        alert('❌ Current password is incorrect');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });

      if (error) {
        alert('❌ Failed to update: ' + error.message);
      } else {
        setSuccess(true);
        setCurrent(''); setNext(''); setConfirm('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Password & Security</h1>
      </div>

      <div className="p-5 space-y-5">
        {/* Success banner */}
        {success && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3 animate-slide-down"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#059669' }} />
            <p className="text-[14px] font-semibold" style={{ color: '#059669' }}>
              Password updated successfully!
            </p>
          </div>
        )}

        {/* Change password card */}
        <div className="card p-5 space-y-5 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="icon-container" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-[16px]" style={{ color: 'var(--text-primary)' }}>Change Password</p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Choose a strong, unique password</p>
            </div>
          </div>

          <div className="divider" />

          <PasswordInput
            label="Current Password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
            placeholder="Enter current password"
          />

          <PasswordInput
            label="New Password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggleShow={() => setShowNext(!showNext)}
            placeholder="Enter new password"
          />
          {next && <PasswordStrength password={next} />}

          <div>
            <PasswordInput
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(!showConfirm)}
              placeholder="Repeat new password"
            />
            {passwordMismatch && (
              <p className="text-[12px] mt-2" style={{ color: '#ef4444' }}>Passwords don't match</p>
            )}
            {passwordsMatch && (
              <p className="text-[12px] mt-2 flex items-center gap-1" style={{ color: '#059669' }}>
                <CheckCircle className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading || !current || !next || !confirm || !!passwordMismatch}
            className="btn-primary w-full py-3.5 text-[14px] flex items-center justify-center gap-2"
            style={{ opacity: loading || !current || !next || !confirm ? 0.65 : 1 }}
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Two Factor Authentication */}
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-container" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[16px]" style={{ color: 'var(--text-primary)' }}>
                Two-Factor Authentication
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                Extra layer of security for your account
              </p>
            </div>
            <button
              onClick={() => setTwoFactor(!twoFactor)}
              className="toggle-track"
              style={{ background: twoFactor ? 'var(--brand)' : 'var(--border-strong)' }}
            >
              <div className="toggle-thumb" style={{ transform: twoFactor ? 'translateX(22px)' : 'translateX(0)' }} />
            </button>
          </div>
          {twoFactor && (
            <div
              className="rounded-xl p-3 text-[13px] animate-slide-down"
              style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--text-secondary)' }}
            >
              Two-factor authentication is coming soon. You'll be able to use an authenticator app or SMS codes.
            </div>
          )}
        </div>

        {/* Security tips */}
        <div
          className="card p-5 animate-slide-up"
          style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <p className="font-bold text-[14px] mb-3" style={{ color: 'var(--text-primary)' }}>💡 Security Tips</p>
          <ul className="space-y-2">
            {[
              'Use a unique password not used on other sites',
              'Mix letters, numbers, and special characters',
              'Never share your password with anyone',
              'Enable 2FA for maximum protection',
            ].map((tip) => (
              <li key={tip} className="text-[13px] flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--brand)' }}>•</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
