import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Store, Bike, User, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AccountType = 'buyer' | 'seller' | 'rider';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('buyer');
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
        navigate('/');
      } else {
        if (!displayName.trim()) { setError('Please enter your name'); setLoading(false); return; }
        await signUp(email, password, displayName);

        // After sign-up, if seller or rider was selected — create the application record
        if (accountType === 'seller') {
          // Get the newly created user id
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            await supabase.from('users').update({ is_seller: true }).eq('id', authUser.id);
          }
        } else if (accountType === 'rider') {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Insert a pending rider application for admin to review
            await supabase.from('rider_applications').upsert({
              user_id: authUser.id,
              status: 'pending',
              applied_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          }
        }

        navigate('/');
      }
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
    setAccountType('buyer');
  };

  const accountTypes: { type: AccountType; label: string; sub: string; icon: typeof User }[] = [
    { type: 'buyer', label: 'Buyer', sub: 'Browse & shop products', icon: User },
    { type: 'seller', label: 'Become a Seller', sub: 'List & sell your products', icon: Store },
    { type: 'rider', label: 'Apply as Rider', sub: 'Deliver orders & earn', icon: Bike },
  ];

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
              <>
                {/* Full Name */}
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

                {/* Account Type chooser */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    I want to join as…
                  </label>
                  <div className="space-y-2">
                    {accountTypes.map(({ type, label, sub, icon: Icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                        style={{
                          backgroundColor: accountType === type ? 'var(--text-primary)' : 'var(--bg-primary)',
                          border: `1.5px solid ${accountType === type ? 'var(--text-primary)' : 'var(--border-color)'}`,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: accountType === type ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                          }}
                        >
                          <Icon size={15} style={{ color: accountType === type ? 'var(--bg-primary)' : 'var(--text-secondary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: accountType === type ? 'var(--bg-primary)' : 'var(--text-primary)' }}>
                            {label}
                          </p>
                          <p className="text-xs" style={{ color: accountType === type ? 'rgba(0,0,0,0.5)' : 'var(--text-secondary)' }}>
                            {sub}
                          </p>
                        </div>
                        {accountType === type && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {accountType === 'rider' && (
                    <p className="text-xs mt-2 px-1" style={{ color: '#f59e0b' }}>
                      ⚡ Rider applications are reviewed by our team. You'll be notified once approved.
                    </p>
                  )}
                  {accountType === 'seller' && (
                    <p className="text-xs mt-2 px-1" style={{ color: '#22c55e' }}>
                      ✓ Seller access is granted immediately. Complete verification to get the badge.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
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

            {/* Password */}
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
              }}
            >
              {loading
                ? 'Please wait…'
                : isLogin
                  ? 'Sign In'
                  : accountType === 'rider'
                    ? 'Apply & Create Account'
                    : 'Create Account'}
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
