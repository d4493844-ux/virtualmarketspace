import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp, Users, BadgeCheck, ShoppingBag, Video, DollarSign, Eye, MessageCircle, Heart } from 'lucide-react';
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

interface PlatformStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalVideos: number;
  totalRevenue: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  verifiedUsers: number;
  activeAds: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'ads'>('overview');
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalVideos: 0,
    totalRevenue: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    verifiedUsers: 0,
    activeAds: 0,
  });

  useEffect(() => {
    // SECURITY CHECK - Only admins can access
    if (!user?.is_admin) {
      alert('🚫 Access Denied: Admin privileges required');
      navigate('/');
      return;
    }
    
    loadAllData();
  }, [user, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    
    try {
      // Load platform statistics
      const [
        { count: totalUsers },
        { count: totalSellers },
        { count: totalProducts },
        { count: totalVideos },
        { count: verifiedUsers },
        { data: videosData },
        { data: verificationsData },
        { data: adsData },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('videos').select('view_count, like_count, comment_count'),
        supabase.from('verification_requests').select('*, users(display_name, email, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('ads').select('*, users!ads_seller_id_fkey(display_name, email)').order('created_at', { ascending: false }),
      ]);

      // Calculate engagement stats
      const totalViews = videosData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;
      const totalLikes = videosData?.reduce((sum, v) => sum + (v.like_count || 0), 0) || 0;
      const totalComments = videosData?.reduce((sum, v) => sum + (v.comment_count || 0), 0) || 0;

      // Calculate total revenue
      const verificationRevenue = verificationsData?.filter(v => v.payment_status === 'paid').reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
      const adsRevenue = adsData?.filter(a => a.status === 'active').reduce((sum, a) => sum + a.budget, 0) || 0;
      const totalRevenue = verificationRevenue + adsRevenue;

      const activeAds = adsData?.filter(a => a.status === 'active').length || 0;

      setPlatformStats({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalProducts: totalProducts || 0,
        totalVideos: totalVideos || 0,
        totalRevenue,
        totalViews,
        totalLikes,
        totalComments,
        verifiedUsers: verifiedUsers || 0,
        activeAds,
      });

      setVerifications(verificationsData as VerificationRequest[] || []);
      setAds(adsData as AdCampaign[] || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
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
      const verification = verifications.find(v => v.id === id);
      if (verification) {
        await supabase.from('users').update({ is_verified: true }).eq('id', verification.user_id);
      }
    }

    await supabase.from('verification_requests').update(updates).eq('id', id);
    loadAllData();
    alert(`✅ Verification ${action}d successfully!`);
  };

  const handleAdAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmation = confirm(`Are you sure you want to ${action} this ad campaign?`);
    if (!confirmation) return;

    await supabase.from('ads').update({ status: action === 'approve' ? 'active' : 'rejected' }).eq('id', id);
    loadAllData();
    alert(`✅ Ad campaign ${action}d successfully!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length;
  const pendingAds = ads.filter(a => a.status === 'pending_payment').length;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Platform Management & Analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('overview')} className="flex-1 py-2 rounded-lg font-medium text-sm" style={{ backgroundColor: activeTab === 'overview' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'overview' ? 'white' : 'var(--text-primary)' }}>
            Overview
          </button>
          <button onClick={() => setActiveTab('verifications')} className="flex-1 py-2 rounded-lg font-medium text-sm relative" style={{ backgroundColor: activeTab === 'verifications' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'verifications' ? 'white' : 'var(--text-primary)' }}>
            Verifications
            {pendingVerifications > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{pendingVerifications}</span>}
          </button>
          <button onClick={() => setActiveTab('ads')} className="flex-1 py-2 rounded-lg font-medium text-sm relative" style={{ backgroundColor: activeTab === 'ads' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'ads' ? 'white' : 'var(--text-primary)' }}>
            Ads
            {pendingAds > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{pendingAds}</span>}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Revenue Card */}
            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-3xl font-bold text-white mb-1">₦{(platformStats.totalRevenue / 1000).toFixed(1)}k</p>
              <p className="text-sm text-white opacity-90">Total Platform Revenue</p>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <Users className="w-6 h-6 mb-2" style={{ color: '#3b82f6' }} />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalUsers}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Users</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TrendingUp className="w-6 h-6 mb-2" style={{ color: '#10b981' }} />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalSellers}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sellers</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <BadgeCheck className="w-6 h-6 mb-2" style={{ color: '#8b5cf6' }} />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.verifiedUsers}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Verified</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <ShoppingBag className="w-6 h-6 mb-2" style={{ color: '#f59e0b' }} />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalProducts}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Products</p>
              </div>
            </div>

            {/* Content Stats */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Content Engagement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Video className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Videos</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalVideos}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Views</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{(platformStats.totalViews / 1000).toFixed(1)}k</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Likes</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalLikes}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Comments</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{platformStats.totalComments}</p>
                </div>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Active Ad Campaigns</h3>
              <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>{platformStats.activeAds}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Currently running</p>
            </div>
          </>
        )}

        {activeTab === 'verifications' && (
          verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <BadgeCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No pending verification requests</p>
            </div>
          ) : (
            verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').map((verification) => (
              <div key={verification.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <img src={verification.users?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{verification.users?.display_name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{verification.users?.email}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Requested {new Date(verification.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#10b981' }}>₦{verification.amount?.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>PAID</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerificationAction(verification.id, 'approve')} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    <CheckCircle className="w-4 h-4" />Approve
                  </button>
                  <button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleVerificationAction(verification.id, 'reject', reason); }} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    <XCircle className="w-4 h-4" />Reject
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'ads' && (
          ads.filter(a => a.status === 'pending_payment').length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No pending ad campaigns</p>
            </div>
          ) : (
            ads.filter(a => a.status === 'pending_payment').map((ad) => (
              <div key={ad.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="mb-3">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ad.title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>By {ad.users?.display_name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Created {new Date(ad.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: 'var(--text-secondary)' }}>Budget</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>₦{ad.budget.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAdAction(ad.id, 'approve')} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    <CheckCircle className="w-4 h-4" />Approve
                  </button>
                  <button onClick={() => handleAdAction(ad.id, 'reject')} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    <XCircle className="w-4 h-4" />Reject
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