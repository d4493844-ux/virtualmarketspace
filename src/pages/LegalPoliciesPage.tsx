import { useState } from 'react';
import { ArrowLeft, FileText, Shield, Eye, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LegalPoliciesPage() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    {
      key: 'tos',
      title: 'Terms of Service',
      subtitle: 'User agreement and platform rules',
      icon: FileText,
      content: `**Effective Date:** [Insert Date]

By using VMS, you agree to the following Terms of Service:

- Provide accurate information when registering.
- Maintain security of your account credentials.
- Do not use VMS for illegal or fraudulent activities.
- VMS may suspend or terminate accounts violating these terms.
- Terms may be updated; continued use indicates acceptance.`
    },
    {
      key: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      icon: Shield,
      content: `**Effective Date:** [Insert Date]

At VMS, we value your privacy. We collect information you provide to create accounts, verify identity, and deliver our services.

**Information collected:** Email, account details, usage data.

**How we use it:** Account management, transactional emails (OTP, onboarding, order updates), platform improvements.

**Email communications:** Users consent to account-related emails; non-essential emails can be unsubscribed.

**Data retention & deletion:** You can request account and data deletion anytime.

**Security:** We implement measures to protect your data.`
    },
    {
      key: 'cookie',
      title: 'Cookie Policy',
      subtitle: 'How we use cookies',
      icon: Eye,
      content: `VMS uses cookies to improve your experience:

- Necessary cookies: Enable core functionality like login.
- Performance cookies: Help us understand platform usage.
- Functional cookies: Remember your preferences.

You can manage or disable cookies through browser settings, but some features may not work without them.`
    },
    {
      key: 'community',
      title: 'Community Guidelines',
      subtitle: 'Rules for using VMS',
      icon: AlertCircle,
      content: `We maintain a safe and respectful environment. Users must:

- Treat others respectfully and professionally.
- Avoid posting illegal, abusive, or misleading content.
- Respect intellectual property rights of others.
- Report violations via support.

Violations may result in content removal, suspension, or account termination.`
    },
  ];

  const activeSection = sections.find(s => s.key === openSection);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Legal & Policies</h1>
      </div>

      {/* Section Buttons */}
      <div className="p-4 space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.key}
              className="w-full rounded-2xl p-5 flex items-center gap-4 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
              onClick={() => setOpenSection(section.key)}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Icon className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{section.title}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{section.subtitle}</p>
              </div>
            </button>
          );
        })}

        {/* Footer */}
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Last updated: February 10, 2026</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>© 2026 VMS - Virtual Market Space. All rights reserved.</p>
        </div>
      </div>

      {/* Modal for content */}
      {openSection && activeSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative overflow-y-auto max-h-full">
            <button onClick={() => setOpenSection(null)} className="absolute top-4 right-4">
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <div className="prose max-w-none" style={{ color: '#111' }}>
              <h2>{activeSection.title}</h2>
              <p>
                {activeSection.content.split('\n\n').map((para, idx) => (
                  <span key={idx}>{para}<br /><br /></span>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}