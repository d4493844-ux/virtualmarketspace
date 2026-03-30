import { useState, useEffect } from 'react';
import {
  ArrowLeft, BadgeCheck, Star, TrendingUp, Shield, CheckCircle,
  Loader, Zap, Crown, ChevronRight, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window { PaystackPop?: any; }
}

const BENEFITS = [
  { icon: <BadgeCheck className="w-4 h-4" />, text: 'Blue verified badge on your profile & posts' },
  { icon: <TrendingUp className="w-4 h-4" />, text: 'Priority placement in Explore feed' },
  { icon: <Shield className="w-4 h-4" />, text: 'Increased buyer trust & conversions' },
  { icon: <Star className="w-4 h-4" />, text: 'Access to premium seller analytics' },
  { icon: <Crown className="w-4 h-4" />, text: 'Verified seller badge in your store' },
  { icon: <Zap className="w-4 h-4" />, text: 'Early access to new VMS features' },
];

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

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

    if (data) {
      setHasActiveSubscription(true);
      setSubscriptionEnd(data.subscription_end);
    }
    setLoading(false);
  };

  const loadPaystackScript = () =>
    new Promise<void>((resolve) => {
      if (window.PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    if (!user?.email) {
      alert('Please add an email to your profile first');
      return;
    }

    setPaymentLoading(plan);

    const amount = plan === 'monthly' ? 7000 : 70000;
    const reference = `VER-${user.id}-${Date.now()}`;
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + (plan === 'monthly' ? 1 : 12));

    const { data: verificationRequest, error: insertError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
        payment_reference: reference,
        payment_status: 'pending',
        amount,
        subscription_start: subscriptionStart.toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      alert('Error creating request. Try again.');
      setPaymentLoading(null);
      return;
    }

    await loadPaystackScript();

    const handler = window.PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
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
      callback: async (response: any) => {
        await supabase
          .from('verification_requests')
          .update({ payment_status: 'paid', status: 'pending' })
          .eq('id', verificationRequest.id);

        await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id);

        await refreshUser();
        setPaymentLoading(null);
        alert('✅ Payment successful! Your badge is now under review — usually approved within minutes.');
        checkVerificationStatus();
      },
      onClose: () => {
        supabase
          .from('verification_requests')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('id', verificationRequest.id);
        setPaymentLoading(null);
      },
    });

    handler?.openIframe();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Verification</h1>
        </div>
        <div className="p-5">
          <div
            className="rounded-3xl p-6 text-center mb-5 animate-scale-in"
            style={{ background: 'linear-gradient(135deg, #065f46, #059669, #10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">You're Verified! ✓</h2>
            <p className="text-white/75 text-[14px]">
              Badge active until{' '}
              <span className="text-white font-bold">
                {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </p>
          </div>

          <div className="card p-5 animate-slide-up">
            <h3 className="font-bold text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>Your Benefits</h3>
            <div className="space-y-3">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                    {b.icon}
                  </div>
                  <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/settings/billing')}
            className="w-full card p-4 flex items-center justify-between mt-4 animate-slide-up"
          >
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Subscription</p>
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Get Verified</h1>
      </div>

      <div className="p-5 space-y-5">
        {/* Hero */}
        <div
          className="rounded-3xl p-6 text-center animate-scale-in"
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
            <BadgeCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Verified Seller Badge</h2>
          <p className="text-white/75 text-[14px]">
            Stand out from the crowd and earn trust with every sale
          </p>
        </div>

        {/* Benefits */}
        <div className="card p-5 animate-slide-up">
          <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--text-primary)' }}>What you get</p>
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--brand)' }}
                >
                  {b.icon}
                </div>
                <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div className="card overflow-hidden animate-slide-up">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className="p-4 text-center transition-all"
              style={{
                background: selectedPlan === 'monthly' ? 'var(--brand)' : 'transparent',
                color: selectedPlan === 'monthly' ? 'white' : 'var(--text-secondary)',
                borderRight: '1px solid var(--border-color)',
              }}
            >
              <p className="font-bold text-[15px]">₦7,000</p>
              <p className="text-[12px] opacity-75">per month</p>
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className="p-4 text-center transition-all relative"
              style={{
                background: selectedPlan === 'yearly' ? 'var(--brand)' : 'transparent',
                color: selectedPlan === 'yearly' ? 'white' : 'var(--text-secondary)',
              }}
            >
              {selectedPlan === 'yearly' && (
                <span className="absolute top-2 right-2 bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  SAVE 17%
                </span>
              )}
              {selectedPlan !== 'yearly' && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}
                >
                  SAVE 17%
                </span>
              )}
              <p className="font-bold text-[15px]">₦70,000</p>
              <p className="text-[12px] opacity-75">per year</p>
            </button>
          </div>
        </div>

        {/* Pay button */}
        <button
          onClick={() => handlePayment(selectedPlan)}
          disabled={!!paymentLoading}
          className="btn-primary w-full py-4 text-[15px] font-bold flex items-center justify-center gap-2 animate-slide-up"
        >
          {paymentLoading === selectedPlan ? (
            <><Loader className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><Zap className="w-5 h-5" /> Pay ₦{selectedPlan === 'monthly' ? '7,000' : '70,000'} with Paystack</>
          )}
        </button>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 animate-fade-in">
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            Secured by Paystack · 256-bit SSL · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
