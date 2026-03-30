import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) { setError('Please enter your name'); setLoading(false); return; }
        await signUp(email, password, displayName);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4" style={{ borderRadius: 20, overflow: 'hidden', width: 72, height: 72, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
            <img
              src="https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_1_numxrq.jpg"
              alt="VMS Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            VMS
          </h1>
          <p className="text-xs mt-1 font-medium tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Virtual Market Space · by Mobtech
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          {/* Tab switcher */}
          <div className="flex mb-6 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: isLogin ? 'var(--text-primary)' : 'transparent',
                color: isLogin ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: !isLogin ? 'var(--text-primary)' : 'transparent',
                color: !isLogin ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1.5px solid var(--border-color)',
                  }}
                  placeholder="e.g. Chidi Okeke"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1.5px solid var(--border-color)',
                }}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-11"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1.5px solid var(--border-color)',
                  }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div className="text-sm p-3 rounded-xl" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-2"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                letterSpacing: '0.2px',
              }}
            >
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-secondary)' }}>
          By continuing you agree to VMS{' '}
          <a href="/settings/legal" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Terms & Privacy</a>
        </p>
      </div>
    </div>
  );
}
