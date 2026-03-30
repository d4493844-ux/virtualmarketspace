import { useState, useEffect } from 'react';
import {
  ArrowLeft, CreditCard, Calendar, Check, BadgeCheck, AlertCircle,
  Loader, Zap, ShieldCheck, RefreshCw, ChevronRight, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  payment_reference: string;
  payment_status: string;
  subscription_start: string;
  subscription_end: string;
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4 flex-1 min-w-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color }}>
        {icon}
      </div>
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-bold text-[17px] mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

export default function BillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (user) loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: subscription } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('payment_status', 'paid')
        .gte('subscription_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveSubscription(subscription);

      const { data: history } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions((history as Transaction[]) || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRenew = async () => {
    if (!user?.email) {
      alert('Please add an email to your profile first');
      return;
    }

    setPaymentLoading(true);

    const amount = 7000;
    const reference = `VER-${user.id}-${Date.now()}`;
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

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
      alert('Error creating renewal request. Try again.');
      setPaymentLoading(false);
      return;
    }

    if (!window.PaystackPop) {
      // Load Paystack script dynamically
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => initPaystack(verificationRequest, amount, reference);
      document.head.appendChild(script);
    } else {
      initPaystack(verificationRequest, amount, reference);
    }
  };

  const initPaystack = (verificationRequest: any, amount: number, reference: string) => {
    const handler = window.PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user!.email,
      amount: amount * 100,
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: user!.id },
          { display_name: 'Plan', variable_name: 'plan', value: 'monthly' },
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
          .eq('id', user!.id);

        setPaymentLoading(false);
        loadBillingData();
        alert('✅ Payment successful! Your badge is pending admin approval.');
      },
      onClose: () => {
        supabase
          .from('verification_requests')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('id', verificationRequest.id);
        setPaymentLoading(false);
      },
    });
    handler?.openIframe();
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;
    const ok = window.confirm(
      'Cancel your verification badge? It stays active until the end of your billing period.'
    );
    if (!ok) return;

    setCancelling(true);
    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', activeSubscription.id);

      alert(
        '✅ Subscription cancelled. Badge stays active until ' +
          new Date(activeSubscription.subscription_end).toLocaleDateString()
      );
      loadBillingData();
    } catch {
      alert('❌ Error cancelling. Try again.');
    } finally {
      setCancelling(false);
    }
  };

  const daysLeft = activeSubscription
    ? Math.ceil((new Date(activeSubscription.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Loading billing info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Billing & Payments</h1>
        </div>
        <button onClick={loadBillingData} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Active Subscription Card */}
        {activeSubscription ? (
          <div
            className="rounded-3xl p-5 animate-slide-up"
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #06b6d4 100%)', boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-[16px]">Verification Badge</p>
                  <p className="text-white/70 text-[12px]">Active Subscription</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">ACTIVE</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white/15 rounded-2xl p-3 text-center">
                <p className="text-white/70 text-[11px]">Plan</p>
                <p className="text-white font-bold text-[13px]">{activeSubscription.amount === 7000 ? 'Monthly' : 'Yearly'}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-3 text-center">
                <p className="text-white/70 text-[11px]">Amount</p>
                <p className="text-white font-bold text-[13px]">₦{activeSubscription.amount?.toLocaleString()}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-3 text-center">
                <p className="text-white/70 text-[11px]">Days Left</p>
                <p className="text-white font-bold text-[13px]">{daysLeft}d</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleQuickRenew}
                disabled={paymentLoading}
                className="flex-1 py-3 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
              >
                {paymentLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {paymentLoading ? 'Processing...' : 'Renew Now'}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 py-3 rounded-2xl font-semibold text-[14px]"
                style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.8)' }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl p-5 text-center animate-slide-up"
            style={{ background: 'var(--bg-secondary)', border: '1.5px dashed var(--border-strong)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)' }}
            >
              <BadgeCheck className="w-8 h-8" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-bold text-[17px] mb-1" style={{ color: 'var(--text-primary)' }}>
              No Active Subscription
            </p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)' }}>
              Get a verified badge to build trust and grow faster
            </p>
            <button
              onClick={() => navigate('/settings/verification')}
              className="btn-primary px-6 py-3 text-[14px]"
            >
              Get Verified — ₦7,000/mo
            </button>
          </div>
        )}

        {/* Stats cards */}
        <div className="flex gap-3 animate-slide-up">
          <StatCard
            label="Total Spent"
            value={`₦${transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}`}
            icon={<CreditCard className="w-4 h-4 text-white" />}
            color="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          />
          <StatCard
            label="Transactions"
            value={`${transactions.length}`}
            icon={<Calendar className="w-4 h-4 text-white" />}
            color="linear-gradient(135deg, #10b981, #059669)"
          />
        </div>

        {/* Payment Security Badge */}
        <div
          className="card p-4 flex items-center gap-4 animate-slide-up"
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: '#0066ff15' }}>
            <ShieldCheck className="w-6 h-6" style={{ color: '#0066ff' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>Secured by Paystack</p>
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              Cards · Bank Transfer · USSD · Pay with Transfer
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: 'rgba(0,102,255,0.1)', color: '#0066ff' }}
          >
            256-bit SSL
          </div>
        </div>

        {/* Transaction History */}
        <div className="animate-slide-up">
          <p className="section-label px-0 pt-2 pb-3">Transaction History</p>

          {transactions.length === 0 ? (
            <div className="card p-10 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 animate-fade-in"
                  style={{ borderBottom: index < transactions.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
                  >
                    <Check className="w-5 h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--text-primary)' }}>
                      Verification Badge — {tx.amount === 7000 ? 'Monthly' : 'Yearly'}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {tx.payment_reference}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                      ₦{tx.amount?.toLocaleString()}
                    </p>
                    <span
                      className="badge"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}
                    >
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support */}
        <div className="card p-5 text-center text-[13px] animate-slide-up" style={{ color: 'var(--text-secondary)' }}>
          <p>Questions about billing?</p>
          <a href="mailto:billing@vms.ng" className="font-semibold mt-1 block" style={{ color: 'var(--brand)' }}>
            billing@vms.ng
          </a>
        </div>
      </div>
    </div>
  );
}
