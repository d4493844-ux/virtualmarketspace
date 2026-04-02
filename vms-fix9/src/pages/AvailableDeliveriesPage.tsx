import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Bike, Clock, CheckCircle, Loader, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DeliveryRequest = {
  id: string;
  order_id: string;
  weight_class: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  delivery_fee: number;
  is_within_community: boolean;
  estimated_minutes: number;
  status: string;
  created_at: string;
  seller?: { display_name: string; avatar_url: string | null };
};

const WEIGHT_COLORS: Record<string, string> = {
  small: '#22c55e', medium: '#f59e0b', heavy: '#ef4444',
};

export default function AvailableDeliveriesPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [requests, setRequests]       = useState<DeliveryRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [accepting, setAccepting]     = useState<string | null>(null);
  const [myDeliveries, setMyDeliveries] = useState<DeliveryRequest[]>([]);
  const [tab, setTab]                 = useState<'available' | 'mine'>('available');

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadRequests = async () => {
    setLoading(true);
    const [{ data: open }, { data: mine }] = await Promise.all([
      supabase
        .from('delivery_requests')
        .select('*, seller:users!delivery_requests_seller_id_fkey(display_name, avatar_url)')
        .eq('status', 'open')
        .is('rider_id', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('delivery_requests')
        .select('*, seller:users!delivery_requests_seller_id_fkey(display_name, avatar_url)')
        .eq('rider_id', user?.id)
        .in('status', ['accepted', 'picked_up'])
        .order('accepted_at', { ascending: false }),
    ]);
    setRequests((open || []) as DeliveryRequest[]);
    setMyDeliveries((mine || []) as DeliveryRequest[]);
    setLoading(false);
  };

  const acceptDelivery = async (req: DeliveryRequest) => {
    if (!user) return;
    setAccepting(req.id);

    // Check it's still available (race condition protection)
    const { data: fresh } = await supabase
      .from('delivery_requests')
      .select('status, rider_id')
      .eq('id', req.id)
      .single();

    if (fresh?.status !== 'open' || fresh?.rider_id) {
      alert('This delivery was just taken by another rider. Refreshing list...');
      setAccepting(null);
      loadRequests();
      return;
    }

    await supabase.from('delivery_requests').update({
      rider_id:    user.id,
      status:      'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', req.id);

    await supabase.from('orders').update({
      rider_id: user.id,
      status:   'assigned',
    }).eq('id', req.order_id);

    // Notify seller
    if ((req as any).seller_id) {
      await supabase.from('notifications').insert({
        user_id: (req as any).seller_id, type: 'system',
        message: 'A rider has accepted your delivery request! They will pick up the order shortly.',
      });
    }

    setAccepting(null);
    loadRequests();
    setTab('mine');
  };

  const markPickedUp = async (req: DeliveryRequest) => {
    await supabase.from('delivery_requests').update({ status: 'picked_up' }).eq('id', req.id);
    await supabase.from('orders').update({ status: 'shipped', tracking_lat: null, tracking_lng: null }).eq('id', req.order_id);
    loadRequests();
  };

  const markDelivered = async (req: DeliveryRequest) => {
    await supabase.from('delivery_requests').update({
      status: 'delivered', delivered_at: new Date().toISOString(),
    }).eq('id', req.id);
    await supabase.from('orders').update({
      status: 'delivered', delivered_at: new Date().toISOString(),
    }).eq('id', req.order_id);

    // Credit rider wallet
    if (user && req.delivery_fee) {
      let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
      if (!wallet) {
        const { data: nw } = await supabase.from('wallets').insert({ user_id: user.id, balance: 0 }).select().single();
        wallet = nw;
      }
      if (wallet) {
        const newBal = Number(wallet.balance) + Number(req.delivery_fee);
        await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id, type: 'payment_received', amount: req.delivery_fee,
          description: `Delivery fee — ${req.is_within_community ? 'Community' : `${req.distance_km}km`}`, status: 'completed',
        });
      }
    }

    loadRequests();
    alert('✅ Delivery complete! Fee credited to your wallet.');
  };

  const renderCard = (req: DeliveryRequest, isMine: boolean) => (
    <div key={req.id} className="rounded-2xl overflow-hidden mb-3" style={{ border: '1px solid var(--border-color)' }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: WEIGHT_COLORS[req.weight_class] + '20', color: WEIGHT_COLORS[req.weight_class] }}>
            {req.weight_class.toUpperCase()}
          </span>
          {req.is_within_community && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
              Community
            </span>
          )}
        </div>
        <p className="text-lg font-black" style={{ color: '#3b82f6' }}>₦{Number(req.delivery_fee).toLocaleString()}</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Route */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-green-500" />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>PICKUP</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{req.pickup_address}</p>
            </div>
          </div>
          <div className="ml-0.5 pl-3 border-l border-dashed" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>~{req.distance_km}km · {req.estimated_minutes} mins</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>DELIVER TO</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{req.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Weight warning */}
        <div className="flex items-center gap-2 rounded-xl p-2.5" style={{ backgroundColor: WEIGHT_COLORS[req.weight_class] + '10' }}>
          <Package className="w-4 h-4 flex-shrink-0" style={{ color: WEIGHT_COLORS[req.weight_class] }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Package declared as <strong>{req.weight_class}</strong> by seller. You can decline at pickup if this is inaccurate.
          </p>
        </div>

        {/* Actions */}
        {!isMine ? (
          <button onClick={() => acceptDelivery(req)} disabled={accepting === req.id}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: '#22c55e', color: 'white', opacity: accepting === req.id ? 0.6 : 1 }}>
            {accepting === req.id ? <Loader className="w-4 h-4 animate-spin" /> : <Bike className="w-4 h-4" />}
            {accepting === req.id ? 'Accepting…' : 'Accept Delivery'}
          </button>
        ) : (
          <div className="flex gap-2">
            {req.status === 'accepted' && (
              <button onClick={() => markPickedUp(req)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                Picked Up ✓
              </button>
            )}
            {req.status === 'picked_up' && (
              <button onClick={() => markDelivered(req)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#22c55e', color: 'white' }}>
                Mark Delivered ✓
              </button>
            )}
            <button onClick={() => navigate(`/delivery/${req.order_id}`)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              Track
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-base font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Deliveries</h1>
        <button onClick={loadRequests} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
        {[{k:'available',l:`Available (${requests.length})`},{k:'mine',l:`My Deliveries (${myDeliveries.length})`}].map(({k,l}) => (
          <button key={k} onClick={() => setTab(k as any)}
            className="flex-1 py-3 text-sm font-semibold"
            style={{ color: tab === k ? '#3b82f6' : 'var(--text-secondary)', borderBottom: tab === k ? '2px solid #3b82f6' : '2px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center pt-12">
            <Loader className="w-7 h-7 animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : tab === 'available' ? (
          requests.length === 0 ? (
            <div className="text-center pt-16">
              <Bike className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No deliveries available</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Check back soon — orders refresh every 15 seconds</p>
            </div>
          ) : requests.map(r => renderCard(r, false))
        ) : (
          myDeliveries.length === 0 ? (
            <div className="text-center pt-16">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No active deliveries</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Accept an order from the Available tab</p>
            </div>
          ) : myDeliveries.map(r => renderCard(r, true))
        )}
      </div>
    </div>
  );
}
