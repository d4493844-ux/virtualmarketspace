import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Plus, Calendar, Check, Download, BadgeCheck, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  payment_reference: string;
  payment_status: string;
  subscription_start: string;
  subscription_end: string;
}

export default function BillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load active subscription
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

      // Load transaction history
      const { data: history } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(history as Transaction[] || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    const confirmation = confirm(
      'Are you sure you want to cancel your verification badge? Your badge will remain active until the end of the current billing period.'
    );

    if (!confirmation) return;

    setCancelling(true);

    try {
      // Mark subscription as cancelled (you might want a separate cancelled status)
      await supabase
        .from('verification_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSubscription.id);

      alert('✅ Subscription cancelled. Your badge will remain active until ' + 
            new Date(activeSubscription.subscription_end).toLocaleDateString());
      
      loadBillingData();
    } catch (error) {
      alert('❌ Error cancelling subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleRenewSubscription = () => {
    navigate('/settings/verification');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Billing & Payments</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Subscription */}
        {activeSubscription ? (
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Verification Badge - Active</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-90">Plan</span>
                <span className="text-white font-medium">
                  {activeSubscription.amount === 7000 ? 'Monthly' : 'Yearly'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-90">Amount Paid</span>
                <span className="text-white font-medium">₦{activeSubscription.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-90">Started</span>
                <span className="text-white font-medium">
                  {new Date(activeSubscription.subscription_start).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-90">Expires</span>
                <span className="text-white font-medium">
                  {new Date(activeSubscription.subscription_end).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full py-3 rounded-xl font-medium"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', opacity: cancelling ? 0.6 : 1 }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Active Subscription</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              You don't have an active verification badge subscription.
            </p>
            <button
              onClick={handleRenewSubscription}
              className="px-6 py-3 rounded-xl font-medium"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
            >
              Get Verified Badge
            </button>
          </div>
        )}

        {/* Payment Methods Info */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Payment Methods</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            All payments are processed securely through Paystack. We don't store your card details.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <img src="https://paystack.com/assets/img/logo/paystack-icon-blue.png" alt="Paystack" className="w-8 h-8" />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Secured by Paystack</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cards, Bank Transfer, USSD</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between"
                  style={{ borderBottom: index < transactions.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981', opacity: 0.2 }}>
                      <Check className="w-5 h-5" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        Verification Badge - {tx.amount === 7000 ? 'Monthly' : 'Yearly'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Ref: {tx.payment_reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      ₦{tx.amount?.toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#10b981', color: 'white' }}>
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="rounded-2xl p-5 text-center text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <p className="mb-2">All payments are processed securely via Paystack</p>
          <p>For billing support, contact <a href="mailto:billing@vms.ng" style={{ color: '#3b82f6' }}>billing@vms.ng</a></p>
        </div>
      </div>
    </div>
  );
}