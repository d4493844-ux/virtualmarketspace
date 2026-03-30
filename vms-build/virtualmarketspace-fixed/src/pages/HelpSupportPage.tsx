import { useState } from 'react';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpSupportPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'How do I create an account?', a: 'Tap "Sign Up" on the auth page, enter your email, password, and display name, then verify your email.' },
    { q: 'How do I become a verified seller?', a: 'Go to Settings > Get Verified Badge and subscribe for ₦7,000/month to get the blue verification badge.' },
    { q: 'How does delivery work?', a: 'Sellers can offer VMS Standard, VMS Drone (coming soon), or manual delivery. Choose your preferred option at checkout.' },
    { q: 'How do I message a seller?', a: 'Visit the seller\'s profile or product page and tap the message icon to start a conversation.' },
    { q: 'Can I cancel my verification subscription?', a: 'Yes! Go to Settings > Billing & Payments > Manage Subscription to cancel anytime.' },
    { q: 'How do I report inappropriate content?', a: 'Tap the three dots on any post and select "Report". Our team will review it within 24 hours.' },
    { q: 'What payment methods are accepted?', a: 'We accept cards (Visa, Mastercard), bank transfers, and mobile money via Paystack.' },
    { q: 'How do I delete my account?', a: 'Go to Settings > scroll down and tap "Delete Account". Note: This action is permanent!' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Help & Support</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>CONTACT US</h2>
          </div>

          <button className="w-full p-4 flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <div className="flex-1 text-left">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Live Chat</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Available 24/7</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button className="w-full p-4 flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <Mail className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <div className="flex-1 text-left">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Support</p>
              <p className="text-sm" style={{ color: '#3b82f6' }}>support@vms.ng</p>
            </div>
          </button>

          <button className="w-full p-4 flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Phone className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <div className="flex-1 text-left">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Phone Support</p>
              <p className="text-sm" style={{ color: '#3b82f6' }}>+234 800 123 4567</p>
            </div>
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>FREQUENTLY ASKED QUESTIONS</h2>
          </div>

          {faqs.map((faq, index) => (
            <div key={index} style={{ borderBottom: index < faqs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-3 flex-1">
                  <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-primary)' }} />
                  <p className="font-medium text-left" style={{ color: 'var(--text-primary)' }}>{faq.q}</p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} style={{ color: 'var(--text-secondary)' }} />
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 pl-16">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
