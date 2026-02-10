import { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Calendar, Check, Download, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  bankName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
    },
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2026-02-10',
      description: 'Verification Badge - Monthly',
      amount: 7000,
      status: 'completed',
    },
    {
      id: '2',
      date: '2026-01-10',
      description: 'Verification Badge - Monthly',
      amount: 7000,
      status: 'completed',
    },
  ]);

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
          Billing & Payments
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Subscription */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">Verification Badge - Active</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-white opacity-90">Plan</span>
              <span className="text-white font-medium">Monthly</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white opacity-90">Amount</span>
              <span className="text-white font-medium">₦7,000/month</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white opacity-90">Next billing</span>
              <span className="text-white font-medium">March 10, 2026</span>
            </div>
          </div>
          <button
            className="w-full py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          >
            Manage Subscription
          </button>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Payment Methods</h3>
            <button
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: '#3b82f6' }}
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--bg-secondary)', border: method.isDefault ? '2px solid #3b82f6' : 'none' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <CreditCard className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {method.type === 'card' ? method.brand : method.bankName} •••• {method.last4}
                      </p>
                      {method.type === 'card' && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  {method.isDefault && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                      DEFAULT
                    </div>
                  )}
                </div>
                {!method.isDefault && (
                  <button
                    className="w-full py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Transaction History</h3>
          
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {transactions.map((tx, index) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: index < transactions.length - 1 ? '1px solid var(--border-color)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444', opacity: 0.2 }}>
                    {tx.status === 'completed' && <Check className="w-5 h-5" style={{ color: '#10b981' }} />}
                    {tx.status === 'pending' && <Calendar className="w-5 h-5" style={{ color: '#f59e0b' }} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tx.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>₦{tx.amount.toLocaleString()}</p>
                  <button className="text-xs" style={{ color: '#3b82f6' }}>
                    <Download className="w-3 h-3 inline" /> Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Info */}
        <div className="rounded-2xl p-5 text-center text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <p className="mb-2">All payments are processed securely via Paystack</p>
          <p>For billing support, contact <span style={{ color: '#3b82f6' }}>billing@vms.ng</span></p>
        </div>
      </div>
    </div>
  );
}