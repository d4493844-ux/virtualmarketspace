import { useState, useEffect } from 'react';
import { ArrowLeft, BadgeCheck, Star, TrendingUp, Shield, Loader, Zap, Crown, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

declare global { interface Window { PaystackPop?: any; } }

const BENEFITS = [
  { icon: <BadgeCheck size={14} />, text: 'Blue verified badge on your profile & posts' },
  { icon: <TrendingUp size={14} />, text: 'Priority placement in Explore feed' },
  { icon: <Shield size={14} />, text: 'Increased buyer trust & conversions' },
  { icon: <Star size={14} />, text: 'Access to premium seller analytics' },
  { icon: <Crown size={14} />, text: 'Verified seller badge in your store' },
  { icon: <Zap size={14} />, text: 'Early access to new VMS features' },
];

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => { checkVerificationStatus(); }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('payment_status', 'paid')
      .gte('subscription_end', new Date().toISOString())
      .maybeSingle();
    if (data) { setHasActiveSubscription(true); setSubscriptionEnd(data.subscription_end); }
    setLoading(false);
  };

  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    if (!user?.email) { alert('Please add an email to your profile first'); return; }

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) { alert('Payment not configured. Please contact support.'); return; }

    setPaymentLoading(plan);

    const amount = plan === 'monthly' ? 7000 : 70000;
    const reference = `VER-${user.id}-${Date.now()}`;
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + (plan === 'monthly' ? 1 : 12));

    const { data: verificationRequest, error: insertError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id, status: 'pending', payment_reference: reference,
        payment_status: 'pending', amount,
        subscription_start: subscriptionStart.toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
      })
      .select().single();

    if (insertError) {
      alert('Error creating request: ' + insertError.message);
      setPaymentLoading(null);
      return;
    }

    try {
      await loadPaystackScript();
    } catch {
      alert('Failed to load payment gateway. Check your internet connection.');
      setPaymentLoading(null);
      return;
    }

    if (!window.PaystackPop) {
      alert('Payment gateway not available. Try again.');
      setPaymentLoading(null);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user.email,
      amount: amount * 100,
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: user.id },
          { display_name: 'Plan', variable_name: 'plan', value: plan },
        ],
      },
      callback: function(response: { reference: string }) {
        (async () => {
          await supabase.from('verification_requests')
            .update({ payment_status: 'paid', status: 'pending' })
            .eq('id', verificationRequest.id);
          await supabase.from('users').update({ is_verified: true }).eq('id', user.id);
          await refreshUser();
          setPaymentLoading(null);
          alert('Payment successful! Reference: ' + response.reference + '\nYour badge is under review — usually approved within minutes.');
          checkVerificationStatus();
        })();
      },
      onClose: function() {
        supabase.from('verification_requests')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('id', verificationRequest.id);
        setPaymentLoading(null);
      },
    });

    handler.openIframe();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Loader className="w-7 h-7 animate-spin" style={{ color: '#3b82f6' }} />
    </div>
  );

  if (hasActiveSubscription) return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>Verification</h1>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ borderRadius: 24, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #065f46, #059669, #10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BadgeCheck size={36} color="white" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>You're Verified!</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0 }}>
            Badge active until {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </p>
        </div>
        <div style={{ borderRadius: 20, padding: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Your Benefits</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.icon}</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/settings/billing')} style={{ borderRadius: 20, padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Manage Subscription</p>
          <ChevronRight size={16} color="var(--text-tertiary)" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>Get Verified</h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ borderRadius: 24, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BadgeCheck size={36} color="white" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>Verified Seller Badge</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0 }}>Stand out and earn trust with every sale</p>
        </div>

        <div style={{ borderRadius: 20, padding: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>What you get</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.icon}</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button onClick={() => setSelectedPlan('monthly')} style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: 'none', background: selectedPlan === 'monthly' ? '#3b82f6' : 'transparent', color: selectedPlan === 'monthly' ? 'white' : 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
            <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>N7,000</p>
            <p style={{ fontSize: 12, margin: 0, opacity: 0.75 }}>per month</p>
          </button>
          <button onClick={() => setSelectedPlan('yearly')} style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: 'none', background: selectedPlan === 'yearly' ? '#3b82f6' : 'transparent', color: selectedPlan === 'yearly' ? 'white' : 'var(--text-secondary)', position: 'relative', transition: 'all 0.2s' }}>
            <span style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>SAVE 17%</span>
            <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>N70,000</p>
            <p style={{ fontSize: 12, margin: 0, opacity: 0.75 }}>per year</p>
          </button>
        </div>

        <button
          onClick={() => handlePayment(selectedPlan)}
          disabled={!!paymentLoading}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: 50, padding: '16px 24px', fontSize: 15, fontWeight: 700, cursor: paymentLoading ? 'not-allowed' : 'pointer', opacity: paymentLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}
        >
          {paymentLoading ? <><Loader size={18} className="animate-spin" /> Processing...</> : <><Zap size={18} /> Pay N{selectedPlan === 'monthly' ? '7,000' : '70,000'} with Paystack</>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Lock size={12} color="var(--text-tertiary)" />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Secured by Paystack · 256-bit SSL · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
