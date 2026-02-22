import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp, Users, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  amount: number;
  created_at: string;
  users: {
    display_name: string;
    email: string;
    avatar_url: string;
  };
}

interface AdCampaign {
  id: string;
  seller_id: string;
  title: string;
  status: string;
  budget: number;
  created_at: string;
  users: {
    display_name: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'ads'>('verifications');
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingAds: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Check if user is admin (you should add is_admin column to users table)
    // For now, we'll check if user email is admin
    if (user?.email !== 'admin@vms.ng') {
      alert('Access denied. Admin only.');
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    
    // Load verifications
    const { data: verificationsData } = await supabase
      .from('verification_requests')
      .select('*, users(display_name, email, avatar_url)')
      .order('created_at', { ascending: false });

    if (verificationsData) {
      setVerifications(verificationsData as VerificationRequest[]);
      const pending = verificationsData.filter(v => v.status === 'pending' && v.payment_status === 'paid').length;
      stats.pendingVerifications = pending;
    }

    // Load ads
    const { data: adsData } = await supabase
      .from('ads')
      .select('*, users!ads_seller_id_fkey(display_name, email)')
      .order('created_at', { ascending: false });

    if (adsData) {
      setAds(adsData as AdCampaign[]);
      const pendingAds = adsData.filter(a => a.status === 'pending_payment').length;
      stats.pendingAds = pendingAds;
    }

    // Calculate revenue
    const totalRevenue = (verificationsData?.filter(v => v.payment_status === 'paid').reduce((sum, v) => sum + (v.amount || 0), 0) || 0) +
                         (adsData?.filter(a => a.status === 'active').reduce((sum, a) => sum + a.budget, 0) || 0);
    stats.totalRevenue = totalRevenue;

    setStats({ ...stats });
    setLoading(false);
  };

  const handleVerificationAction = async (id: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    const confirmation = confirm(`Are you sure you want to ${action} this verification request?`);
    if (!confirmation) return;

    const updates: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'reject' && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    if (action === 'approve') {
      // Update user's is_verified status
      const verification = verifications.find(v => v.id === id);
      if (verification) {
        await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', verification.user_id);
      }
    }

    await supabase
      .from('verification_requests')
      .update(updates)
      .eq('id', id);

    loadData();
    alert(`Verification ${action}d successfully!`);
  };

  const handleAdAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmation = confirm(`Are you sure you want to ${action} this ad campaign?`);
    if (!confirmation) return;

    await supabase
      .from('ads')
      .update({ status: action === 'approve' ? 'active' : 'rejected' })
      .eq('id', id);

    loadData();
    alert(`Ad campaign ${action}d successfully!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: '#f59e0b' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pending</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.pendingVerifications + stats.pendingAds}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Users className="w-5 h-5 mx-auto mb-1" style={{ color: '#3b82f6' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Verified</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{verifications.filter(v => v.status === 'approved').length}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: '#10b981' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Revenue</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>₦{(stats.totalRevenue / 1000).toFixed(0)}k</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className="flex-1 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: activeTab === 'verifications' ? '#3b82f6' : 'var(--bg-secondary)',
              color: activeTab === 'verifications' ? 'white' : 'var(--text-primary)',
            }}
          >
            Verifications ({stats.pendingVerifications})
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className="flex-1 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: activeTab === 'ads' ? '#3b82f6' : 'var(--bg-secondary)',
              color: activeTab === 'ads' ? 'white' : 'var(--text-primary)',
            }}
          >
            Ad Campaigns ({stats.pendingAds})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'verifications' ? (
          verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <BadgeCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No pending verification requests</p>
            </div>
          ) : (
            verifications
              .filter(v => v.status === 'pending' && v.payment_status === 'paid')
              .map((verification) => (
                <div key={verification.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <img src={verification.users?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{verification.users?.display_name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{verification.users?.email}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Requested {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: '#10b981' }}>₦{verification.amount?.toLocaleString()}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>PAID</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVerificationAction(verification.id, 'approve')}
                      className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
                      style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleVerificationAction(verification.id, 'reject', reason);
                      }}
                      className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
          )
        ) : (
          ads.filter(a => a.status === 'pending_payment').length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No pending ad campaigns</p>
            </div>
          ) : (
            ads
              .filter(a => a.status === 'pending_payment')
              .map((ad) => (
                <div key={ad.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="mb-3">
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ad.title}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>By {ad.users?.display_name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Created {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: 'var(--text-secondary)' }}>Budget</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>₦{ad.budget.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAdAction(ad.id, 'approve')}
                      className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
                      style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAdAction(ad.id, 'reject')}
                      className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
          )
        )}
      </div>
    </div>
  );
}