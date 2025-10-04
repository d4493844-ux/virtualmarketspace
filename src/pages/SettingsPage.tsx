import { ArrowLeft, Moon, Sun, LogOut, BadgeCheck, Info, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
      </div>

      <div className="p-4">
        <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              ) : (
                <Moon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              )}
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Theme
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {theme === 'light' ? 'Light mode' : 'Dark mode'}
                </p>
              </div>
            </div>
            <div
              className="w-12 h-7 rounded-full p-1 transition-colors"
              style={{ backgroundColor: theme === 'dark' ? 'var(--text-primary)' : 'var(--border-color)' }}
            >
              <div
                className="w-5 h-5 rounded-full transition-transform"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </div>
          </button>

          {user?.is_seller && !user.is_verified && (
            <button
              onClick={() => navigate('/smart-city')}
              className="w-full flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Get Verified
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Blue tick verification
                  </p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => navigate('/smart-city')}
            className="w-full flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  About VMS
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Smart City vision
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Admin Dashboard
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Moderation & analytics
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-3"
          style={{ backgroundColor: 'var(--bg-secondary)', color: '#c00' }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            VMS - Virtual Market Space
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Version 1.0.0 (Demo Mode)
          </p>
        </div>
      </div>
    </div>
  );
}
