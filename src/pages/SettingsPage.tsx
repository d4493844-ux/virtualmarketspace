import { useState } from 'react';
import { ArrowLeft, Moon, Sun, LogOut, User, MapPin, CreditCard, Bell, Lock, Shield, HelpCircle, FileText, AlertCircle, BadgeCheck, Crown, Globe, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
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

      <div className="p-4 space-y-4">
        {/* Account Section */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>ACCOUNT</h2>
          </div>
          
          <button
            onClick={() => navigate('/settings/profile')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile Information</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Edit your personal details</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/address')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Address Book</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage delivery addresses</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/contact')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Contact Information</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email and phone settings</p>
              </div>
            </div>
          </button>
        </div>

        {/* Verification & Subscription */}
        {user?.is_seller && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>SELLER FEATURES</h2>
            </div>
            
            {!user.is_verified ? (
              <button
                onClick={() => navigate('/settings/verification')}
                className="w-full p-4 hover:opacity-80 transition-opacity"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Get Verified Badge</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>₦7,000/month • Build trust with buyers</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    Upgrade
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Verified Badge Active</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Next billing: March 10, 2026</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/settings/billing')}
                    className="text-sm font-medium"
                    style={{ color: '#3b82f6' }}
                  >
                    Manage
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/settings/billing')}
              className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Billing & Payments</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment methods and history</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Preferences */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>PREFERENCES</h2>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              ) : (
                <Moon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              )}
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Appearance</p>
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

          <button
            onClick={() => navigate('/settings/notifications')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Push, email & SMS preferences</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/language')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Language & Region</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>English (Nigeria)</p>
              </div>
            </div>
          </button>
        </div>

        {/* Privacy & Security */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>PRIVACY & SECURITY</h2>
          </div>

          <button
            onClick={() => navigate('/settings/password')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Password & Security</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Change password, 2FA settings</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/privacy')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Privacy Settings</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Control who can see your content</p>
              </div>
            </div>
          </button>
        </div>

        {/* Support & About */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>SUPPORT & ABOUT</h2>
          </div>

          <button
            onClick={() => navigate('/smart-city')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Smart City Vision</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The future of VMS</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/help')}
            className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Help & Support</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>FAQs and customer support</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings/legal')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <div className="text-left">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Legal & Policies</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Terms, privacy policy</p>
              </div>
            </div>
          </button>
        </div>

        {/* Admin Access (if applicable) */}
        {user?.email?.includes('admin') && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Moderation & analytics</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-3 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <LogOut className="w-5 h-5" style={{ color: '#ef4444' }} />
          <span className="font-medium" style={{ color: '#ef4444' }}>Sign Out</span>
        </button>

        {/* Version Info */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            VMS - Virtual Market Space
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Version 1.0.0 (Beta)
          </p>
        </div>
      </div>
    </div>
  );
}