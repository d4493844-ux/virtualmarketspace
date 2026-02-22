import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, TrendingUp, Eye, MousePointer, ShoppingCart, Play, Pause, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

interface Ad {
  id: string;
  title: string;
  description: string;
  budget: number;
  daily_budget: number;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  start_date: string;
  end_date: string;
  product_id: string;
}

export default function AdsDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
  });

  useEffect(() => {
    if (user) loadAds();
  }, [user]);

  const loadAds = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setAds(data as Ad[]);
      
      // Calculate stats
      const totalSpend = data.reduce((sum, ad) => sum + (ad.spend || 0), 0);
      const totalImpressions = data.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
      const totalClicks = data.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
      const totalConversions = data.reduce((sum, ad) => sum + (ad.conversions || 0), 0);
      
      setStats({ totalSpend, totalImpressions, totalClicks, totalConversions });
    }
    
    setLoading(false);
  };

  const toggleAdStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId);
    
    loadAds();
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Delete this ad campaign?')) return;
    
    await supabase.from('ads').delete().eq('id', adId);
    loadAds();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      case 'pending_payment': return '#3b82f6';
      default: return '#ef4444';
    }
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
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ads Manager</h1>
        </div>
        <button onClick={() => navigate('/ads/create')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Impressions</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalImpressions.toLocaleString()}</p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="w-4 h-4" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Clicks</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalClicks.toLocaleString()}</p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Conversions</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalConversions}</p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Spend</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>₦{stats.totalSpend.toLocaleString()}</p>
          </div>
        </div>

        {/* Ad Campaigns */}
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Your Campaigns</h3>
          
          {ads.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No Ad Campaigns Yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Start promoting your products to reach more buyers</p>
              <button onClick={() => navigate('/ads/create')} className="px-6 py-2 rounded-full font-medium" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                Create Your First Ad
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{ad.title}</h4>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{ad.description}</p>
                      <div className="inline-block px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: getStatusColor(ad.status) + '20', color: getStatusColor(ad.status) }}>
                        {ad.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Impressions</p>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ad.impressions}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Clicks</p>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ad.clicks}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sales</p>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ad.conversions}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Spend</p>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>₦{ad.spend}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(ad.status === 'active' || ad.status === 'paused') && (
                      <button 
                        onClick={() => toggleAdStatus(ad.id, ad.status)}
                        className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      >
                        {ad.status === 'active' ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Resume</>}
                      </button>
                    )}
                    <button 
                      onClick={() => deleteAd(ad.id)}
                      className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      style={{ backgroundColor: 'var(--bg-primary)', color: '#ef4444' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}