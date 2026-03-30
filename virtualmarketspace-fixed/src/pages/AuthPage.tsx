import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(demoEmail);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>
            <ShoppingBag className="w-8 h-8" style={{ color: 'var(--bg-primary)' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            VMS
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Virtual Market Space
          </p>
        </div>

        <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="flex mb-6 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: isLogin ? 'var(--text-primary)' : 'transparent',
                color: isLogin ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: !isLogin ? 'var(--text-primary)' : 'transparent',
                color: !isLogin ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg" style={{ backgroundColor: '#fee', color: '#c00' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Quick Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('ada.pepper@vms.ng')}
              disabled={loading}
              className="py-2 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Seller Demo
            </button>
            <button
              onClick={() => handleDemoLogin('tunde.buyer@vms.ng')}
              disabled={loading}
              className="py-2 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Buyer Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
