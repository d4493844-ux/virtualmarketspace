import { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, ShoppingBag, Video, DollarSign, Eye, Heart, MessageCircle, BadgeCheck, AlertCircle, Activity, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  newUsersToday: number;
  revenueGrowth: number;
}

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
    business_type: string;
  };
}

interface AdCampaign {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
  created_at: string;
  users: {
    display_name: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'verifications' | 'ads' | 'users'>('overview');
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
    newUsersToday: 0,
    revenueGrowth: 15.3,
  });

  useEffect(() => {
    if (!user?.is_admin) {
      alert('🚫 Access Denied: Admin privileges required');
      navigate('/');
      return;
    }
    
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: totalUsers },
        { count: totalSellers },
        { count: totalProducts },
        { count: totalVideos },
        { count: verifiedUsers },
        { count: newUsersToday },
        { data: videosData },
        { data: verificationsData },
        { data: adsData },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('videos').select('view_count, like_count, comment_count'),
        supabase.from('verification_requests').select('*, users(display_name, email, avatar_url, business_type)').order('created_at', { ascending: false }),
        supabase.from('ads').select('*, users!ads_seller_id_fkey(display_name, email)').order('created_at', { ascending: false }),
      ]);

      const totalViews = videosData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;
      const totalLikes = videosData?.reduce((sum, v) => sum + (v.like_count || 0), 0) || 0;
      const totalComments = videosData?.reduce((sum, v) => sum + (v.comment_count || 0), 0) || 0;

      const verificationRevenue = verificationsData?.filter(v => v.payment_status === 'paid').reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
      const adsRevenue = adsData?.filter(a => a.status === 'active' || a.status === 'completed').reduce((sum, a) => sum + a.budget, 0) || 0;
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
        newUsersToday: newUsersToday || 0,
        revenueGrowth: 15.3,
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
    const confirmation = confirm(`Confirm ${action} verification request?`);
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
    alert(`✅ Verification ${action}d!`);
  };

  const handleAdAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmation = confirm(`Confirm ${action} ad campaign?`);
    if (!confirmation) return;

    await supabase.from('ads').update({ status: action === 'approve' ? 'active' : 'rejected' }).eq('id', id);
    loadAllData();
    alert(`✅ Ad ${action}d!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length;
  const pendingAds = ads.filter(a => a.status === 'pending_payment').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VMS Admin</h1>
                <p className="text-sm text-gray-500">Platform Management Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user?.display_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'verifications', label: 'Verifications', icon: BadgeCheck, badge: pendingVerifications },
              { id: 'ads', label: 'Ad Campaigns', icon: TrendingUp, badge: pendingAds },
              { id: 'users', label: 'Users', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className="relative py-4 px-2 text-sm font-medium transition-colors flex items-center gap-2"
                style={{
                  color: activeSection === tab.id ? '#3b82f6' : '#6b7280',
                  borderBottom: activeSection === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+{platformStats.revenueGrowth}%</span>
                </div>
                <p className="text-3xl font-bold mb-1">₦{(platformStats.totalRevenue / 1000).toFixed(1)}k</p>
                <p className="text-sm opacity-90">Total Revenue</p>
              </div>

              {/* Total Users */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">+{platformStats.newUsersToday} today</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{platformStats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>

              {/* Total Sellers */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                  </div>
                  <BadgeCheck className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{platformStats.totalSellers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Active Sellers</p>
              </div>

              {/* Total Products */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{platformStats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Listed Products</p>
              </div>
            </div>

            {/* Content Engagement */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Content Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Total Videos</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{platformStats.totalVideos.toLocaleString()}</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{(platformStats.totalViews / 1000).toFixed(1)}k</p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Total Likes</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{platformStats.totalLikes.toLocaleString()}</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Total Comments</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{platformStats.totalComments.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Verified Users</h3>
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{platformStats.verifiedUsers}</p>
                <p className="text-sm text-gray-600">{((platformStats.verifiedUsers / platformStats.totalUsers) * 100).toFixed(1)}% of total users</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Active Campaigns</h3>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{platformStats.activeAds}</p>
                <p className="text-sm text-gray-600">Currently running ads</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Pending Actions</h3>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{pendingVerifications + pendingAds}</p>
                <p className="text-sm text-gray-600">Requires review</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'verifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Verification Requests</h2>
                <p className="text-sm text-gray-600 mt-1">{pendingVerifications} pending approval</p>
              </div>
            </div>

            {verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                <BadgeCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending verification requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').map((verification) => (
                  <div key={verification.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-6">
                      <img src={verification.users?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-16 h-16 rounded-full object-cover" />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{verification.users?.display_name}</h3>
                            <p className="text-sm text-gray-600">{verification.users?.email}</p>
                            {verification.users?.business_type && (
                              <p className="text-sm text-gray-500 mt-1">Business: {verification.users.business_type}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">₦{verification.amount?.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Payment Received</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Calendar className="w-4 h-4" />
                          Requested {new Date(verification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => handleVerificationAction(verification.id, 'approve')} className="flex-1 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            <BadgeCheck className="w-5 h-5" />
                            Approve Verification
                          </button>
                          <button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleVerificationAction(verification.id, 'reject', reason); }} className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'ads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ad Campaign Management</h2>
                <p className="text-sm text-gray-600 mt-1">{pendingAds} pending approval • {platformStats.activeAds} active</p>
              </div>
            </div>

            {ads.filter(a => a.status === 'pending_payment').length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Campaigns</h3>
                <p className="text-gray-600">All ad campaigns have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.filter(a => a.status === 'pending_payment').map((ad) => (
                  <div key={ad.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{ad.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                        <p className="text-sm text-gray-500">By {ad.users?.display_name} • Created {new Date(ad.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₦{ad.budget.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Campaign Budget</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impressions</p>
                        <p className="text-lg font-semibold text-gray-900">{ad.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Clicks</p>
                        <p className="text-lg font-semibold text-gray-900">{ad.clicks.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => handleAdAction(ad.id, 'approve')} className="flex-1 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        Approve Campaign
                      </button>
                      <button onClick={() => handleAdAction(ad.id, 'reject')} className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'users' && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600">Coming soon - Advanced user management tools</p>
          </div>
        )}
      </div>
    </div>
  );
}