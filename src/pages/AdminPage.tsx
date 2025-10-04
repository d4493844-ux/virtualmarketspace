import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, Flag, BadgeCheck, TrendingUp, Video, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Stats = {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalVideos: number;
  totalReports: number;
  pendingVerifications: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalVideos: 0,
    totalReports: 0,
    pendingVerifications: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'verifications'>('overview');
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [usersRes, sellersRes, productsRes, videosRes, reportsRes, verificationsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('videos').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('*').eq('status', 'pending'),
        supabase.from('verification_requests').select('*, user:users(*)').eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalVideos: videosRes.count || 0,
        totalReports: reportsRes.data?.length || 0,
        pendingVerifications: verificationsRes.data?.length || 0,
      });

      setReports(reportsRes.data || []);
      setVerifications(verificationsRes.data || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (requestId: string, userId: string) => {
    await supabase.from('verification_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId);
    await supabase.from('users').update({ is_verified: true }).eq('id', userId);
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'verification',
      message: 'Your verification request has been approved!',
    });
    loadAdminData();
  };

  const handleRejectVerification = async (requestId: string, userId: string) => {
    await supabase.from('verification_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', requestId);
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'verification',
      message: 'Your verification request was not approved at this time.',
    });
    loadAdminData();
  };

  const handleResolveReport = async (reportId: string) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    loadAdminData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
      </div>

      <div className="p-4">
        <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'overview' ? 'var(--text-primary)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all relative"
            style={{
              backgroundColor: activeTab === 'reports' ? 'var(--text-primary)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Reports
            {stats.totalReports > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all relative"
            style={{
              backgroundColor: activeTab === 'verifications' ? 'var(--text-primary)' : 'transparent',
              color: activeTab === 'verifications' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Verifications
            {stats.pendingVerifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <Users className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalUsers}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Total Users
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalSellers}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Sellers
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalProducts}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Products
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <Video className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalVideos}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Videos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No pending reports
              </p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Flag className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {report.reason}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Reported {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveReport(report.id)}
                    className="w-full py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--text-primary)',
                      color: 'var(--bg-primary)',
                    }}
                  >
                    Mark as Resolved
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="space-y-3">
            {verifications.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No pending verifications
              </p>
            ) : (
              verifications.map((request) => (
                <div key={request.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={request.user?.avatar_url || ''}
                      alt={request.user?.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {request.user?.display_name}
                      </p>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {request.user?.business_type}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveVerification(request.id, request.user_id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectVerification(request.id, request.user_id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
