import { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, ShoppingBag, Video, DollarSign, Eye, Heart, MessageCircle, BadgeCheck, AlertCircle, Activity, Calendar, Download, Search, Ban, CheckCircle, X, RefreshCw, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PlatformStats {
  totalUsers: number; totalSellers: number; totalProducts: number; totalVideos: number;
  totalRevenue: number; totalViews: number; totalLikes: number; totalComments: number;
  verifiedUsers: number; activeAds: number; newUsersToday: number; revenueGrowth: number;
}

interface VerificationRequest {
  id: string; user_id: string; status: string; payment_status: string; amount: number; created_at: string;
  users: { display_name: string; email: string; avatar_url: string; business_type: string; };
}

interface AdCampaign {
  id: string; seller_id: string; title: string; description: string; status: string;
  budget: number; impressions: number; clicks: number; created_at: string;
  users: { display_name: string; email: string; };
}

interface UserRecord {
  id: string; display_name: string; email: string; avatar_url: string; is_seller: boolean;
  is_verified: boolean; is_admin: boolean; is_banned?: boolean; created_at: string;
  location: string; follower_count: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'verifications' | 'ads' | 'users' | 'content'>('overview');
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'sellers' | 'verified' | 'admins'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0, totalSellers: 0, totalProducts: 0, totalVideos: 0,
    totalRevenue: 0, totalViews: 0, totalLikes: 0, totalComments: 0,
    verifiedUsers: 0, activeAds: 0, newUsersToday: 0, revenueGrowth: 15.3,
  });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadAllData();
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        { data: usersData },
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
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      const totalViews = videosData?.reduce((s, v) => s + (v.view_count || 0), 0) || 0;
      const totalLikes = videosData?.reduce((s, v) => s + (v.like_count || 0), 0) || 0;
      const totalComments = videosData?.reduce((s, v) => s + (v.comment_count || 0), 0) || 0;
      const verificationRevenue = verificationsData?.filter(v => v.payment_status === 'paid').reduce((s, v) => s + (v.amount || 0), 0) || 0;
      const adsRevenue = adsData?.filter(a => ['active', 'completed'].includes(a.status)).reduce((s, a) => s + a.budget, 0) || 0;

      setPlatformStats({
        totalUsers: totalUsers || 0, totalSellers: totalSellers || 0,
        totalProducts: totalProducts || 0, totalVideos: totalVideos || 0,
        totalRevenue: verificationRevenue + adsRevenue, totalViews, totalLikes, totalComments,
        verifiedUsers: verifiedUsers || 0, activeAds: adsData?.filter(a => a.status === 'active').length || 0,
        newUsersToday: newUsersToday || 0, revenueGrowth: 15.3,
      });

      setVerifications(verificationsData as VerificationRequest[] || []);
      setAds(adsData as AdCampaign[] || []);
      setUsers(usersData as UserRecord[] || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    const updates: any = { status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() };
    if (action === 'approve') {
      const v = verifications.find(x => x.id === id);
      if (v) await supabase.from('users').update({ is_verified: true }).eq('id', v.user_id);
    }
    await supabase.from('verification_requests').update(updates).eq('id', id);
    showToast(`Verification ${action}d successfully`);
    setActionLoading(null);
    loadAllData();
  };

  const handleAdAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    await supabase.from('ads').update({ status: action === 'approve' ? 'active' : 'rejected' }).eq('id', id);
    showToast(`Ad campaign ${action}d`);
    setActionLoading(null);
    loadAllData();
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'make_admin' | 'remove_admin' | 'verify' | 'unverify') => {
    setActionLoading(userId);
    const updates: any = {};
    if (action === 'ban') updates.is_banned = true;
    if (action === 'unban') updates.is_banned = false;
    if (action === 'make_admin') updates.is_admin = true;
    if (action === 'remove_admin') updates.is_admin = false;
    if (action === 'verify') updates.is_verified = true;
    if (action === 'unverify') updates.is_verified = false;

    await supabase.from('users').update(updates).eq('id', userId);
    showToast(`User updated successfully`);
    setActionLoading(null);
    loadAllData();
  };

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', platformStats.totalUsers],
      ['Total Sellers', platformStats.totalSellers],
      ['Total Products', platformStats.totalProducts],
      ['Total Videos', platformStats.totalVideos],
      ['Total Revenue (₦)', platformStats.totalRevenue],
      ['Verified Users', platformStats.verifiedUsers],
      ['Active Ads', platformStats.activeAds],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vms-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch || u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter = userFilter === 'all' || (userFilter === 'sellers' && u.is_seller) || (userFilter === 'verified' && u.is_verified) || (userFilter === 'admins' && u.is_admin);
    return matchSearch && matchFilter;
  });

  const pendingVerifications = verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length;
  const pendingAds = ads.filter(a => a.status === 'pending_payment').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: '#64748b' }}>Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444', color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/')} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={20} color="#374151" />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_1_numxrq.jpg" alt="VMS" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>VMS Admin</h1>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Platform Management Center</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadAllData} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
              <RefreshCw size={16} color="#374151" />
            </button>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview', icon: Activity, badge: 0 },
            { id: 'verifications', label: 'Verifications', icon: BadgeCheck, badge: pendingVerifications },
            { id: 'ads', label: 'Campaigns', icon: TrendingUp, badge: pendingAds },
            { id: 'users', label: 'Users', icon: Users, badge: 0 },
            { id: 'content', label: 'Content', icon: Video, badge: 0 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeSection === tab.id ? '#3b82f6' : '#64748b',
                borderBottom: activeSection === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'none', border: 'none', borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: activeSection === tab.id ? '#3b82f6' : 'transparent',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Revenue hero */}
            <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', borderRadius: 20, padding: 28, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Total Platform Revenue</p>
                <p style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>₦{platformStats.totalRevenue.toLocaleString()}</p>
                <p style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>+{platformStats.revenueGrowth}% growth</p>
              </div>
              <DollarSign size={64} style={{ opacity: 0.2 }} />
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Users', value: platformStats.totalUsers, sub: `+${platformStats.newUsersToday} today`, icon: Users, color: '#10b981', bg: '#d1fae5' },
                { label: 'Active Sellers', value: platformStats.totalSellers, sub: 'Registered sellers', icon: ShoppingBag, color: '#8b5cf6', bg: '#ede9fe' },
                { label: 'Listed Products', value: platformStats.totalProducts, sub: 'Total listings', icon: ShoppingBag, color: '#f59e0b', bg: '#fef3c7' },
                { label: 'Total Videos', value: platformStats.totalVideos, sub: `${(platformStats.totalViews / 1000).toFixed(1)}k total views`, icon: Video, color: '#3b82f6', bg: '#dbeafe' },
                { label: 'Verified Users', value: platformStats.verifiedUsers, sub: `${platformStats.totalUsers ? ((platformStats.verifiedUsers / platformStats.totalUsers) * 100).toFixed(0) : 0}% of users`, icon: BadgeCheck, color: '#06b6d4', bg: '#cffafe' },
                { label: 'Active Ads', value: platformStats.activeAds, sub: 'Running campaigns', icon: TrendingUp, color: '#ec4899', bg: '#fce7f3' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon size={22} color={stat.color} />
                    </div>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>{stat.value.toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{stat.label}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Engagement */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Content Engagement</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Total Views', value: (platformStats.totalViews / 1000).toFixed(1) + 'k', color: '#3b82f6', icon: Eye },
                  { label: 'Total Likes', value: platformStats.totalLikes.toLocaleString(), color: '#ef4444', icon: Heart },
                  { label: 'Total Comments', value: platformStats.totalComments.toLocaleString(), color: '#8b5cf6', icon: MessageCircle },
                  { label: 'Pending Actions', value: pendingVerifications + pendingAds, color: '#f59e0b', icon: AlertCircle },
                ].map(item => (
                  <div key={item.label} style={{ borderLeft: `4px solid ${item.color}`, paddingLeft: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <item.icon size={14} color="#94a3b8" />
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VERIFICATIONS */}
        {activeSection === 'verifications' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Verification Requests</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{pendingVerifications} pending approval</p>
            </div>

            {/* Pending first */}
            {verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <BadgeCheck size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>All caught up!</p>
                <p style={{ fontSize: 14, color: '#9ca3af' }}>No pending verifications.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {verifications.filter(v => v.status === 'pending' && v.payment_status === 'paid').map(v => (
                  <div key={v.id} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                      {v.users?.avatar_url ? (
                        <img src={v.users.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                          {v.users?.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{v.users?.display_name}</h3>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0' }}>{v.users?.email}</p>
                            {v.users?.business_type && <p style={{ fontSize: 12, color: '#94a3b8' }}>Business: {v.users.business_type}</p>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: '#22c55e', margin: 0 }}>₦{v.amount?.toLocaleString()}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>Payment received</p>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                          <Calendar size={12} /> {new Date(v.created_at).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={() => handleVerificationAction(v.id, 'approve')}
                            disabled={actionLoading === v.id}
                            style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: actionLoading === v.id ? 0.6 : 1 }}
                          >
                            <BadgeCheck size={16} /> {actionLoading === v.id ? 'Processing…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleVerificationAction(v.id, 'reject')}
                            disabled={actionLoading === v.id}
                            style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#374151', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: actionLoading === v.id ? 0.6 : 1 }}
                          >
                            <X size={16} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Previously reviewed */}
            {verifications.filter(v => v.status !== 'pending').length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#64748b', marginBottom: 16 }}>Previously Reviewed</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {verifications.filter(v => v.status !== 'pending').slice(0, 10).map(v => (
                    <div key={v.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#374151', margin: 0, fontSize: 14 }}>{v.users?.display_name}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0' }}>{v.users?.email}</p>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: v.status === 'approved' ? '#d1fae5' : '#fee2e2',
                        color: v.status === 'approved' ? '#065f46' : '#b91c1c',
                      }}>
                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADS */}
        {activeSection === 'ads' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Ad Campaign Management</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{pendingAds} pending • {platformStats.activeAds} active</p>
            </div>

            {ads.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <TrendingUp size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No campaigns yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ads.map(ad => (
                  <div key={ad.id} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{ad.title}</h3>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: ad.status === 'active' ? '#d1fae5' : ad.status === 'pending_payment' ? '#fef3c7' : '#fee2e2',
                            color: ad.status === 'active' ? '#065f46' : ad.status === 'pending_payment' ? '#92400e' : '#b91c1c',
                          }}>
                            {ad.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{ad.description}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>By {ad.users?.display_name} • {new Date(ad.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>₦{ad.budget.toLocaleString()}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>Budget</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <div><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>Impressions</p><p style={{ fontSize: 20, fontWeight: 700, color: '#374151', margin: 0 }}>{ad.impressions.toLocaleString()}</p></div>
                      <div><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>Clicks</p><p style={{ fontSize: 20, fontWeight: 700, color: '#374151', margin: 0 }}>{ad.clicks.toLocaleString()}</p></div>
                    </div>
                    {ad.status === 'pending_payment' && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handleAdAction(ad.id, 'approve')} disabled={actionLoading === ad.id} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: actionLoading === ad.id ? 0.6 : 1 }}>
                          {actionLoading === ad.id ? 'Processing…' : '✓ Approve Campaign'}
                        </button>
                        <button onClick={() => handleAdAction(ad.id, 'reject')} disabled={actionLoading === ad.id} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#374151', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: actionLoading === ad.id ? 0.6 : 1 }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeSection === 'users' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>User Management</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{filteredUsers.length} of {users.length} users</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['all', 'sellers', 'verified', 'admins'] as const).map(f => (
                  <button key={f} onClick={() => setUserFilter(f)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: userFilter === f ? '#0f172a' : '#fff', color: userFilter === f ? '#fff' : '#64748b', border: '1px solid #e2e8f0' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Users table */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <Users size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>No users found</p>
                </div>
              ) : (
                filteredUsers.map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                        {u.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 14 }}>{u.display_name}</p>
                        {u.is_verified && <BadgeCheck size={13} color="#3b82f6" />}
                        {u.is_admin && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>ADMIN</span>}
                        {u.is_seller && <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>SELLER</span>}
                        {u.is_banned && <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>BANNED</span>}
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{u.email}</p>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleUserAction(u.id, u.is_verified ? 'unverify' : 'verify')}
                        disabled={actionLoading === u.id}
                        title={u.is_verified ? 'Remove verification' : 'Verify user'}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: u.is_verified ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: actionLoading === u.id ? 0.5 : 1 }}
                      >
                        <BadgeCheck size={14} color={u.is_verified ? '#3b82f6' : '#94a3b8'} />
                      </button>
                      <button
                        onClick={() => handleUserAction(u.id, u.is_admin ? 'remove_admin' : 'make_admin')}
                        disabled={actionLoading === u.id || u.id === user?.id}
                        title={u.is_admin ? 'Remove admin' : 'Make admin'}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: u.is_admin ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: actionLoading === u.id || u.id === user?.id ? 0.5 : 1 }}
                      >
                        <Activity size={14} color={u.is_admin ? '#f59e0b' : '#94a3b8'} />
                      </button>
                      <button
                        onClick={() => handleUserAction(u.id, u.is_banned ? 'unban' : 'ban')}
                        disabled={actionLoading === u.id || u.id === user?.id}
                        title={u.is_banned ? 'Unban user' : 'Ban user'}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: u.is_banned ? '#fee2e2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: actionLoading === u.id || u.id === user?.id ? 0.5 : 1 }}
                      >
                        <Ban size={14} color={u.is_banned ? '#ef4444' : '#94a3b8'} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTENT */}
        {activeSection === 'content' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Content Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Videos', value: platformStats.totalVideos, icon: Video, color: '#3b82f6', bg: '#dbeafe' },
                { label: 'Total Views', value: (platformStats.totalViews).toLocaleString(), icon: Eye, color: '#10b981', bg: '#d1fae5' },
                { label: 'Total Likes', value: platformStats.totalLikes.toLocaleString(), icon: Heart, color: '#ef4444', bg: '#fee2e2' },
                { label: 'Total Comments', value: platformStats.totalComments.toLocaleString(), icon: MessageCircle, color: '#8b5cf6', bg: '#ede9fe' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <item.icon size={24} color={item.color} />
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>{item.value}</p>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
