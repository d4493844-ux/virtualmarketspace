import { useState } from 'react';
import { ArrowLeft, BadgeCheck, Check, CreditCard, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const monthlyPrice = 7000;
  const yearlyPrice = 70000; // 2 months free
  const yearlyMonthly = Math.round(yearlyPrice / 12);

  const handleSubscribe = async () => {
    setLoading(true);
    // Here you would integrate with Paystack or Flutterwave
    // For now, just navigate to payment page
    setTimeout(() => {
      navigate('/settings/payment', { 
        state: { 
          amount: selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice,
          plan: selectedPlan,
          type: 'verification'
        } 
      });
      setLoading(false);
    }, 1000);
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
          Get Verified
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <BadgeCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Unlock Your Blue Tick
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Stand out, build trust, and grow your business faster
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            What You'll Get
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Blue Verification Badge</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Show customers you're authentic and trustworthy</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>3x Higher Visibility</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Verified accounts appear first in search results</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Fraud Protection Badge</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Customers see you're verified and legitimate</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Priority Support</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Get help faster with our verified seller support</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Advanced Analytics</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Track views, engagement, and sales insights</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Featured in "Verified" Section</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Special placement in our verified sellers showcase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Toggle */}
        <div className="flex rounded-full p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setSelectedPlan('monthly')}
            className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedPlan === 'monthly' ? 'var(--text-primary)' : 'transparent',
              color: selectedPlan === 'monthly' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all relative"
            style={{
              backgroundColor: selectedPlan === 'yearly' ? 'var(--text-primary)' : 'transparent',
              color: selectedPlan === 'yearly' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
              Save 17%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="space-y-3">
          {/* Monthly Plan */}
          {selectedPlan === 'monthly' && (
            <div className="rounded-2xl p-6" style={{ border: '2px solid #3b82f6', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>₦{monthlyPrice.toLocaleString()}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/month</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Billed monthly • Cancel anytime
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  All verification benefits
                </li>
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  No commitment required
                </li>
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  Monthly billing flexibility
                </li>
              </ul>
            </div>
          )}

          {/* Yearly Plan */}
          {selectedPlan === 'yearly' && (
            <div className="rounded-2xl p-6" style={{ border: '2px solid #10b981', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: '#10b981', color: 'white' }}>
                BEST VALUE - SAVE ₦14,000
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>₦{yearlyPrice.toLocaleString()}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/year</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                ₦{yearlyMonthly.toLocaleString()}/month • Billed annually
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                  All verification benefits
                </li>
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                  2 months completely free
                </li>
                <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                  Priority account manager
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
            Verified Sellers See Real Results
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold mb-1" style={{ color: '#10b981' }}>+150%</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>More Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold mb-1" style={{ color: '#3b82f6' }}>+85%</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Higher Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold mb-1" style={{ color: '#f59e0b' }}>+200%</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>More Messages</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#3b82f6', color: 'white' }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Subscribe Now - ₦{(selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice).toLocaleString()}
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Shield className="w-4 h-4" />
            Secure Payment
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Check className="w-4 h-4" />
            Cancel Anytime
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <BadgeCheck className="w-4 h-4" />
            Instant Activation
          </div>
        </div>

        {/* FAQs */}
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Common Questions</h3>
          
          <div>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              What payment methods do you accept?
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              We accept cards (Visa, Mastercard), bank transfers, and mobile money via Paystack.
            </p>
          </div>

          <div>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Can I cancel my subscription?
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Yes! You can cancel anytime from your billing settings. No questions asked.
            </p>
          </div>

          <div>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              How quickly do I get verified?
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Your blue badge appears instantly after successful payment!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}