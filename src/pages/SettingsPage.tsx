import { useState } from 'react';
import {
  ArrowLeft, Moon, Sun, LogOut, MapPin, CreditCard, Bell, Lock,
  Shield, HelpCircle, FileText, BadgeCheck, Crown, Globe, Phone, Trash2,
  TrendingUp, ChevronRight, Zap, Settings2, Wallet, Bike
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  last?: boolean;
  danger?: boolean;
}

function SettingsRow({ icon, iconBg, title, subtitle, onClick, right, last, danger }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all active:scale-[0.98]"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--border-color)',
        background: 'transparent',
      }}
    >
      <div
        className="icon-container"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] leading-tight" style={{ color: danger ? '#ef4444' : 'var(--text-primary)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {right !== undefined ? right : (
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
      )}
    </button>
  );
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="animate-slide-up">
      <p className="section-label">{label}</p>
      <div className="mx-4 card overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>
        <Settings2 className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
      </div>

      {/* Profile Card */}
      <div className="mx-4 mt-5 mb-2">
        <button
          onClick={() => navigate('/settings/profile')}
          className="w-full card card-interactive p-4 flex items-center gap-4 animate-slide-up"
        >
          <div className="relative">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover"
              style={{ border: '2px solid var(--border-strong)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200';
              }}
            />
            {user?.is_verified && (
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 2px 8px rgba(59,130,246,0.4)' }}
              >
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-bold text-[16px] truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.display_name || 'Your Name'}
            </p>
            <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {user?.email}
            </p>
            <p className="text-[12px] mt-1 font-medium" style={{ color: 'var(--brand)' }}>
              Edit Profile →
            </p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        </button>
      </div>

      <div className="space-y-1 mt-3">
        {/* Account */}
        <Section label="Account">
          <SettingsRow
            icon={<MapPin className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            title="Address Book"
            subtitle="Manage delivery addresses"
            onClick={() => navigate('/settings/address')}
          />
          <SettingsRow
            icon={<Phone className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            title="Contact Information"
            subtitle="Email and phone settings"
            onClick={() => navigate('/settings/contact')}
            last
          />
        </Section>

        {/* Seller Features */}
        {user?.is_seller && (
          <Section label="Seller Features">
            <div
              className="p-4 m-3 rounded-2xl mb-1"
              style={{
                background: user?.is_verified
                  ? 'linear-gradient(135deg, #059669 0%, #065f46 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[15px]">
                      {user?.is_verified ? 'Verified ✓' : 'Get Verified Badge'}
                    </p>
                    <p className="text-white/75 text-[12px]">
                      {user?.is_verified ? 'Badge active — manage subscription' : '₦7,000/month • Build trust with buyers'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/settings/verification')}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  {user?.is_verified ? 'Manage' : 'Upgrade'}
                </button>
              </div>
            </div>
            <SettingsRow
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
              title="Ads Manager"
              subtitle="Promote your products"
              onClick={() => navigate('/ads/dashboard')}
            />
            <SettingsRow
              icon={<CreditCard className="w-5 h-5 text-white" />}
              iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
              title="Billing & Payments"
              subtitle="Payment methods and history"
              onClick={() => navigate('/settings/billing')}
            />
            <SettingsRow
              icon={<Wallet className="w-5 h-5 text-white" />}
              iconBg="linear-gradient(135deg, #059669, #065f46)"
              title="My Wallet"
              subtitle="Balance, transfers & withdrawals"
              onClick={() => navigate('/wallet')}
              last
            />
          </Section>
        )}

        {/* Wallet for buyers too */}
        {!user?.is_seller && (
          <Section label="Wallet">
            <SettingsRow
              icon={<Wallet className="w-5 h-5 text-white" />}
              iconBg="linear-gradient(135deg, #059669, #065f46)"
              title="My Wallet"
              subtitle="Balance, top-up, send money & withdraw"
              onClick={() => navigate('/wallet')}
              last
            />
          </Section>
        )}

        {/* Rider Dashboard */}
        {user?.is_rider && (
          <Section label="Rider">
            <SettingsRow
              icon={<Bike className="w-5 h-5 text-white" />}
              iconBg="linear-gradient(135deg, #f59e0b, #b45309)"
              title="Rider Dashboard"
              subtitle="View deliveries & update location"
              onClick={() => navigate('/rider')}
              last
            />
          </Section>
        )}

        {/* Preferences */}
        <Section label="Preferences">
          <SettingsRow
            icon={isDark ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
            iconBg={isDark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}
            title="Appearance"
            subtitle={isDark ? 'Dark mode' : 'Light mode'}
            onClick={toggleTheme}
            right={
              <div
                className="toggle-track flex-shrink-0"
                style={{ background: isDark ? 'var(--brand)' : 'var(--border-strong)' }}
              >
                <div
                  className="toggle-thumb"
                  style={{ transform: isDark ? 'translateX(22px)' : 'translateX(0)' }}
                />
              </div>
            }
          />
          <SettingsRow
            icon={<Bell className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #ef4444, #dc2626)"
            title="Notifications"
            subtitle="Push, email & SMS preferences"
            onClick={() => navigate('/settings/notifications')}
          />
          <SettingsRow
            icon={<Globe className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #06b6d4, #0891b2)"
            title="Language & Region"
            subtitle="English (Nigeria)"
            onClick={() => navigate('/settings/language')}
            last
          />
        </Section>

        {/* Privacy & Security */}
        <Section label="Privacy & Security">
          <SettingsRow
            icon={<Lock className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
            title="Password & Security"
            subtitle="Change password, 2FA settings"
            onClick={() => navigate('/settings/password')}
          />
          <SettingsRow
            icon={<Shield className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            title="Privacy Settings"
            subtitle="Control who can see your content"
            onClick={() => navigate('/settings/privacy')}
            last
          />
        </Section>

        {/* Support & About */}
        <Section label="Support & About">
          <SettingsRow
            icon={<Crown className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            title="Smart City Vision"
            subtitle="The future of VMS"
            onClick={() => navigate('/smart-city')}
          />
          <SettingsRow
            icon={<HelpCircle className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
            title="Help & Support"
            subtitle="FAQs and customer support"
            onClick={() => navigate('/settings/help')}
          />
          <SettingsRow
            icon={<FileText className="w-5 h-5 text-white" />}
            iconBg="linear-gradient(135deg, #64748b, #475569)"
            title="Legal & Policies"
            subtitle="Terms, privacy policy"
            onClick={() => navigate('/settings/legal')}
            last
          />
        </Section>

        {/* Admin */}
        {user?.is_admin && (
          <div className="mx-4">
            <button
              onClick={() => navigate('/admin')}
              className="w-full card p-4 flex items-center gap-4 animate-slide-up"
              style={{ border: '1.5px solid rgba(139, 92, 246, 0.35)' }}
            >
              <div className="icon-container" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-[15px]" style={{ color: '#8b5cf6' }}>Admin Dashboard</p>
                <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Manage verifications & ads</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </button>
          </div>
        )}

        {/* Sign Out */}
        <div className="mx-4 space-y-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full card p-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] animate-slide-up"
          >
            <LogOut className="w-5 h-5" style={{ color: '#ef4444' }} />
            <span className="font-semibold text-[15px]" style={{ color: '#ef4444' }}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>

          <button
            onClick={() => navigate('/settings/delete-account')}
            className="w-full p-4 flex items-center justify-center gap-3 rounded-2xl animate-slide-up"
            style={{ background: 'rgba(239, 68, 68, 0.07)', border: '1.5px solid rgba(239, 68, 68, 0.25)' }}
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-[15px] text-red-500">Delete Account</span>
          </button>
        </div>

        {/* Version */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            <p className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
              VMS — Virtual Market Space
            </p>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Version 1.0.0 (Beta)</p>
        </div>
      </div>
    </div>
  );
}
