import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Send,
  Building2, Plus, RefreshCw, Loader, CheckCircle, X, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

declare global { interface Window { PaystackPop?: any; } }

type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment_received' | 'payment_sent' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  status: string;
  created_at: string;
};

type WalletUser = { id: string; display_name: string; avatar_url: string | null; email: string };

// VAT/charge table for withdrawals
const WITHDRAWAL_CHARGES = [
  { min: 1, max: 1000, charge: 50 },
  { min: 1001, max: 5000, charge: 100 },
  { min: 5001, max: 10000, charge: 150 },
  { min: 10001, max: 20000, charge: 250 },
  { min: 20001, max: 50000, charge: 500 },
  { min: 50001, max: 100000, charge: 750 },
  { min: 100001, max: 200000, charge: 1000 },
  { min: 200001, max: 500000, charge: 1500 },
  { min: 500001, max: 1000000, charge: 2500 },
];

function getWithdrawalCharge(amount: number): number {
  const tier = WITHDRAWAL_CHARGES.find(t => amount >= t.min && amount <= t.max);
  return tier ? tier.charge : amount > 1000000 ? 3000 : 50;
}

export default function WalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'deposit' | 'transfer' | 'withdraw' | 'charges' | null>(null);

  // deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // transfer
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferUser, setTransferUser] = useState<WalletUser | null>(null);
  const [transferSearchLoading, setTransferSearchLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => { if (user) loadWallet(); }, [user?.id]);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert({ user_id: user.id, balance: 0 }).select().single();
      wallet = newWallet;
    }
    if (wallet) {
      setBalance(Number(wallet.balance));
      setWalletId(wallet.id);
      loadTransactions(wallet.id);
    }
    setLoading(false);
  };

  const loadTransactions = async (wId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wId)
      .order('created_at', { ascending: false })
      .limit(30);
    setTransactions((data || []) as Transaction[]);
  };

  // ── DEPOSIT via Paystack ──────────────────────────────────────────────────
  const loadPaystack = () => new Promise<void>((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // still resolve so we can show error
    document.head.appendChild(s);
  });

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 100) { alert('Minimum deposit is ₦100'); return; }
    if (!user?.email) { alert('Add an email to your profile first'); return; }
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey || paystackKey === 'undefined') {
      alert('Paystack key not configured. Please add VITE_PAYSTACK_PUBLIC_KEY to your .env file.');
      return;
    }
    setDepositLoading(true);
    await loadPaystack();

    if (!window.PaystackPop) {
      alert('Paystack could not load. Check your internet connection and try again.');
      setDepositLoading(false);
      return;
    }

    const ref = `DEP-${user.id}-${Date.now()}`;

    // FIX: callback must be a plain function — NOT async, no await inside
    // We fire-and-forget the DB write using .then() chains
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user.email,
      amount: Math.round(amt * 100), // kobo, must be integer
      currency: 'NGN',
      ref,
      callback: function(response: any) {
        // Must be a plain sync function that fires off async work without awaiting
        const currentWalletId = walletId;
        const currentBalance = balance;
        const depositedAmt = amt;

        const newBal = currentBalance + depositedAmt;

        supabase.from('wallets')
          .update({ balance: newBal })
          .eq('id', currentWalletId)
          .then(() => {
            return supabase.from('transactions').insert({
              wallet_id: currentWalletId,
              type: 'deposit',
              amount: depositedAmt,
              description: 'Wallet top-up via Paystack',
              reference: response.reference || ref,
              status: 'completed',
            });
          })
          .then(() => {
            setBalance(newBal);
            setDepositAmount('');
            setModal(null);
            setDepositLoading(false);
            if (currentWalletId) loadTransactions(currentWalletId);
          })
          .catch(() => {
            setDepositLoading(false);
          });
      },
      onClose: function() {
        setDepositLoading(false);
      },
    });

    handler.openIframe();
  };

  // ── SEARCH USER ───────────────────────────────────────────────────────────
  const searchUser = async () => {
    if (!transferEmail.trim()) return;
    setTransferSearchLoading(true);
    const { data } = await supabase.from('users')
      .select('id, display_name, avatar_url, email')
      .eq('email', transferEmail.trim())
      .maybeSingle();
    setTransferUser(data as WalletUser | null);
    if (!data) alert('No user found with that email');
    setTransferSearchLoading(false);
  };

  // ── TRANSFER ─────────────────────────────────────────────────────────────
  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt < 10) { alert('Minimum transfer is ₦10'); return; }
    if (!transferUser) { alert('Search for a user first'); return; }
    if (amt > balance) { alert('Insufficient wallet balance'); return; }
    if (transferUser.id === user?.id) { alert('You cannot transfer to yourself'); return; }
    setTransferLoading(true);

    let { data: receiverWallet } = await supabase.from('wallets').select('*').eq('user_id', transferUser.id).maybeSingle();
    if (!receiverWallet) {
      const { data: nw } = await supabase.from('wallets').insert({ user_id: transferUser.id, balance: 0 }).select().single();
      receiverWallet = nw;
    }
    if (!receiverWallet) { alert('Could not access receiver wallet'); setTransferLoading(false); return; }

    const newSenderBal = balance - amt;
    const newReceiverBal = Number(receiverWallet.balance) + amt;

    await supabase.from('wallets').update({ balance: newSenderBal }).eq('id', walletId);
    await supabase.from('wallets').update({ balance: newReceiverBal }).eq('id', receiverWallet.id);
    await supabase.from('transactions').insert([
      { wallet_id: walletId, type: 'payment_sent', amount: amt, description: `Transfer to ${transferUser.display_name}${transferNote ? ': ' + transferNote : ''}`, status: 'completed' },
      { wallet_id: receiverWallet.id, type: 'payment_received', amount: amt, description: `Transfer from ${user?.display_name}${transferNote ? ': ' + transferNote : ''}`, status: 'completed' },
    ]);
    await supabase.from('wallet_transfers').insert({
      sender_id: user?.id, receiver_id: transferUser.id, amount: amt, note: transferNote || null, status: 'completed'
    });
    await supabase.from('notifications').insert({
      user_id: transferUser.id, type: 'system', actor_id: user?.id,
      message: `${user?.display_name} sent you ₦${amt.toLocaleString()} in your VMS wallet`
    });

    setBalance(newSenderBal);
    setTransferEmail(''); setTransferAmount(''); setTransferNote(''); setTransferUser(null);
    setModal(null); setTransferLoading(false);
    if (walletId) loadTransactions(walletId);
    alert(`✅ ₦${amt.toLocaleString()} sent to ${transferUser.display_name}!`);
  };

  // ── WITHDRAW ─────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 500) { alert('Minimum withdrawal is ₦500'); return; }
    const charge = getWithdrawalCharge(amt);
    const totalDeducted = amt + charge;
    if (totalDeducted > balance) { alert(`Insufficient balance. You need ₦${totalDeducted.toLocaleString()} (₦${amt.toLocaleString()} + ₦${charge.toLocaleString()} charge)`); return; }
    if (!bankName || !accountNumber || !accountName) { alert('Fill all bank details'); return; }
    setWithdrawLoading(true);

    const ref = `WIT-${user?.id}-${Date.now()}`;
    const newBal = balance - totalDeducted;

    await supabase.from('wallets').update({ balance: newBal }).eq('id', walletId);
    await supabase.from('transactions').insert([
      {
        wallet_id: walletId, type: 'withdrawal', amount: amt,
        description: `Withdrawal to ${bankName} - ${accountNumber}`, reference: ref, status: 'pending'
      },
      {
        wallet_id: walletId, type: 'withdrawal', amount: charge,
        description: `Withdrawal processing fee`, reference: ref + '-FEE', status: 'completed'
      },
    ]);
    await supabase.from('bank_withdrawals').insert({
      user_id: user?.id, amount: amt, bank_name: bankName,
      account_number: accountNumber, account_name: accountName,
      status: 'pending', reference: ref, charge_applied: charge
    });

    setBalance(newBal);
    setWithdrawAmount(''); setBankName(''); setAccountNumber(''); setAccountName('');
    setModal(null); setWithdrawLoading(false);
    if (walletId) loadTransactions(walletId);
    alert(`✅ Withdrawal of ₦${amt.toLocaleString()} submitted!\nProcessing fee: ₦${charge.toLocaleString()}\nYou'll receive ₦${amt.toLocaleString()} within 24hrs.`);
  };

  const txIcon = (type: string) => {
    if (type === 'deposit' || type === 'payment_received') return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  };
  const txColor = (type: string) => type === 'deposit' || type === 'payment_received' ? '#22c55e' : '#ef4444';
  const txPrefix = (type: string) => type === 'deposit' || type === 'payment_received' ? '+' : '-';

  const withdrawAmt = parseFloat(withdrawAmount) || 0;
  const withdrawCharge = withdrawAmt >= 500 ? getWithdrawalCharge(withdrawAmt) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Loader className="w-7 h-7 animate-spin" style={{ color: '#3b82f6' }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>My Wallet</h1>
        <button onClick={loadWallet} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance card */}
        <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
          <Wallet className="w-8 h-8 text-white/60 mx-auto mb-2" />
          <p className="text-white/70 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-black text-white">₦{balance.toLocaleString()}</p>
          <p className="text-white/50 text-xs mt-1">VMS Wallet</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Add Money', icon: <Plus className="w-5 h-5" />, action: () => setModal('deposit'), color: '#22c55e' },
            { label: 'Transfer', icon: <Send className="w-5 h-5" />, action: () => setModal('transfer'), color: '#3b82f6' },
            { label: 'Withdraw', icon: <Building2 className="w-5 h-5" />, action: () => setModal('withdraw'), color: '#f59e0b' },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              className="rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: btn.color + '20', color: btn.color }}>
                {btn.icon}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tx.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      <span style={{ color: tx.status === 'pending' ? '#f59e0b' : tx.status === 'completed' ? '#22c55e' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {tx.status}
                      </span>
                    </p>
                  </div>
                  <p className="font-bold text-sm" style={{ color: txColor(tx.type) }}>
                    {txPrefix(tx.type)}₦{Number(tx.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DEPOSIT MODAL ── */}
      {modal === 'deposit' && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => !depositLoading && setModal(null)}>
          <div className="w-full rounded-t-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Money</h3>
              <button onClick={() => !depositLoading && setModal(null)} disabled={depositLoading}>
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Minimum ₦100 · Powered by Paystack · Secure payment</p>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 5000, 10000].map(a => (
                <button key={a} onClick={() => setDepositAmount(String(a))}
                  className="py-2 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: depositAmount === String(a) ? '#3b82f6' : 'var(--bg-secondary)', color: depositAmount === String(a) ? 'white' : 'var(--text-primary)' }}>
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
            <input type="number" placeholder="Or enter amount (₦)" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-lg font-bold outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <button onClick={handleDeposit} disabled={depositLoading || !depositAmount}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#22c55e', opacity: (depositLoading || !depositAmount) ? 0.6 : 1 }}>
              {depositLoading ? <><Loader className="w-5 h-5 animate-spin" /> Processing…</> : <>Pay ₦{parseFloat(depositAmount || '0').toLocaleString()} with Paystack</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSFER MODAL ── */}
      {modal === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setModal(null)}>
          <div className="w-full rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Transfer to User</h3>
              <button onClick={() => setModal(null)}><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <div className="flex gap-2">
              <input type="email" placeholder="Recipient's email" value={transferEmail}
                onChange={e => { setTransferEmail(e.target.value); setTransferUser(null); }}
                className="flex-1 px-4 py-3 rounded-2xl outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <button onClick={searchUser} disabled={transferSearchLoading}
                className="px-4 py-3 rounded-2xl font-bold text-white"
                style={{ backgroundColor: '#3b82f6' }}>
                {transferSearchLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Find'}
              </button>
            </div>
            {transferUser && (
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {transferUser.avatar_url ? (
                  <img src={transferUser.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    {transferUser.display_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{transferUser.display_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{transferUser.email}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              </div>
            )}
            <input type="number" placeholder="Amount (₦)" value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-lg font-bold outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="text" placeholder="Note (optional)" value={transferNote} onChange={e => setTransferNote(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>Balance: ₦{balance.toLocaleString()}</p>
            <button onClick={handleTransfer} disabled={transferLoading || !transferUser || !transferAmount}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#3b82f6', opacity: (transferLoading || !transferUser || !transferAmount) ? 0.6 : 1 }}>
              {transferLoading ? <><Loader className="w-5 h-5 animate-spin" /> Sending…</> : <><Send className="w-5 h-5" /> Send Money</>}
            </button>
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {modal === 'withdraw' && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setModal(null)}>
          <div className="w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Withdraw to Bank</h3>
              <button onClick={() => setModal(null)}><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
            </div>

            {/* Charge info banner */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: ₦{balance.toLocaleString()} · Min ₦500</p>
              <button onClick={() => setModal('charges')} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Info size={13} /> View charges
              </button>
            </div>

            <input type="number" placeholder="Amount (₦)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-lg font-bold outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />

            {/* Live charge preview */}
            {withdrawAmt >= 500 && (
              <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>Withdrawal amount</span><span>₦{withdrawAmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: '#f59e0b' }}>
                  <span>Processing charge</span><span>₦{withdrawCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <span>Total deducted</span><span>₦{(withdrawAmt + withdrawCharge).toLocaleString()}</span>
                </div>
                <p className="text-xs" style={{ color: '#22c55e' }}>You receive: ₦{withdrawAmt.toLocaleString()} in your bank</p>
              </div>
            )}

            <input type="text" placeholder="Bank name (e.g. GTBank, Opay)" value={bankName} onChange={e => setBankName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="text" placeholder="Account number (10 digits)" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="text" placeholder="Account name" value={accountName} onChange={e => setAccountName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />

            <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount || !bankName || !accountNumber || !accountName}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#f59e0b', opacity: (withdrawLoading || !withdrawAmount || !bankName || !accountNumber || !accountName) ? 0.6 : 1 }}>
              {withdrawLoading ? <><Loader className="w-5 h-5 animate-spin" /> Submitting…</> : <><Building2 className="w-5 h-5" /> Request Withdrawal</>}
            </button>
          </div>
        </div>
      )}

      {/* ── CHARGES TABLE MODAL ── */}
      {modal === 'charges' && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setModal('withdraw')}>
          <div className="w-full rounded-t-3xl p-6" style={{ backgroundColor: 'var(--bg-primary)', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Wallet Funding Charges (₦)</h3>
              <button onClick={() => setModal('withdraw')}><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              A small processing fee is charged on each withdrawal to keep VMS running. You receive the full withdrawal amount in your bank.
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <div className="grid grid-cols-2 px-4 py-2 text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                <span>Withdrawal Amount (₦)</span>
                <span className="text-right">Charge (₦)</span>
              </div>
              {WITHDRAWAL_CHARGES.map((tier, i) => (
                <div key={i} className="grid grid-cols-2 px-4 py-3" style={{
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: withdrawAmt >= tier.min && withdrawAmt <= tier.max ? 'rgba(59,130,246,0.08)' : 'transparent',
                }}>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {tier.min.toLocaleString()} – {tier.max.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-right" style={{ color: withdrawAmt >= tier.min && withdrawAmt <= tier.max ? '#3b82f6' : 'var(--text-primary)' }}>
                    {tier.charge.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-2 px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Above 1,000,000</span>
                <span className="text-sm font-bold text-right" style={{ color: 'var(--text-primary)' }}>3,000</span>
              </div>
            </div>
            <button onClick={() => setModal('withdraw')} className="w-full mt-4 py-3 rounded-2xl font-bold text-sm"
              style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
