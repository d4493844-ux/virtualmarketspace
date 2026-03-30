import { useState, useEffect } from 'react';
import { ArrowLeft, BadgeCheck, Star, TrendingUp, Shield, CheckCircle, CreditCard, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    
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
  };

  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    if (!user?.email) {
      alert('Please add an email to your profile first');
      return;
    }

    setPaymentLoading(true);

    const amount = plan === 'monthly' ? 7000 : 70000; // ₦7k/month or ₦70k/year (2 months free)
    const reference = `VER-${user.id}-${Date.now()}`;

    // Create verification request
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
        amount: amount,
        subscription_start: subscriptionStart.toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      alert('Error creating verification request');
      setPaymentLoading(false);
      return;
    }

    // Initialize Paystack
    const handler = window.PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // Add this to your .env
      email: user.email,
      amount: amount * 100, // Paystack uses kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: plan
          }
        ]
      },
      callback: async (response: any) => {
        // Payment successful
        await supabase
          .from('verification_requests')
          .update({ 
            payment_status: 'paid',
            status: 'pending' // Admin needs to approve
          })
          .eq('id', verificationRequest.id);

        // Update user verification status
        await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id);

        await refreshUser();
        alert('✅ Payment successful! Your verification is pending admin approval.');
        setPaymentLoading(false);
        checkVerificationStatus();
      },
      onClose: () => {
        setPaymentLoading(false);
        alert('Payment cancelled');
      }
    });

    handler?.openIframe();
  };

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (hasActiveSubscription && user?.is_verified) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Blue Tick Verification</h1>
        </div>

        <div className="p-4">
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
              <BadgeCheck className="w-12 h-12 text-white" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're Verified!</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your blue tick is active until {new Date(subscriptionEnd!).toLocaleDateString()}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center" style={{ color: '#10b981' }}>
                <CheckCircle className="w-5 h-5" />
                <span>Increased visibility</span>
              </div>
              <div className="flex items-center gap-2 justify-center" style={{ color: '#10b981' }}>
                <CheckCircle className="w-5 h-5" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2 justify-center" style={{ color: '#10b981' }}>
                <CheckCircle className="w-5 h-5" />
                <span>Buyer trust badge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Get Verified</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
            <BadgeCheck className="w-12 h-12 text-white" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Get Your Blue Tick</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Stand out and build trust with verified status</p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
            Benefits of Verification
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Increased Visibility</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Appear higher in search and recommendations</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Trust Badge</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Show buyers you're a legitimate seller</p>
              </div>
            </div>

            <div className="flex gap-3">
              <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Priority Support</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get faster help when you need it</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="space-y-3">
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Choose Your Plan</h3>
          
          {/* Monthly Plan */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Monthly</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Renews every month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>₦7,000</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>per month</p>
              </div>
            </div>
            <button 
              onClick={() => handlePayment('monthly')}
              disabled={paymentLoading}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#3b82f6', color: 'white', opacity: paymentLoading ? 0.6 : 1 }}
            >
              {paymentLoading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Subscribe Monthly</>
              )}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="rounded-2xl p-5 relative" style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid #3b82f6' }}>
            <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#10b981', color: 'white' }}>
              SAVE 17%
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Yearly</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Save ₦14,000 per year</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>₦70,000</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>₦5,833/month</p>
              </div>
            </div>
            <button 
              onClick={() => handlePayment('yearly')}
              disabled={paymentLoading}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#3b82f6', color: 'white', opacity: paymentLoading ? 0.6 : 1 }}
            >
              {paymentLoading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Subscribe Yearly</>
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            By subscribing, you agree to our terms. Verification subject to admin approval. 
            Payments processed securely via Paystack.
          </p>
        </div>
      </div>
    </div>
  );
}