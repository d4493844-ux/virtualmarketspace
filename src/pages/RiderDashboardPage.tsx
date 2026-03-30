import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, CheckCircle, Navigation, Phone, Loader, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DeliveryOrder = {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  created_at: string;
  product?: { title: string; images: string[] };
  buyer?: { display_name: string; avatar_url: string | null };
  seller?: { display_name: string; location: string | null };
};

export default function RiderDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeOrders, setActiveOrders] = useState<DeliveryOrder[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      ensureRiderProfile();
      loadOrders();
      startLocationTracking();
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user?.id]);

  const ensureRiderProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('riders').select('*').eq('user_id', user.id).maybeSingle();
    if (!data) {
      await supabase.from('riders').insert({ user_id: user.id, is_active: true, is_available: true, vehicle_type: 'bike' });
    } else {
      setIsAvailable(data.is_available);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select(`*, product:products(title, images), buyer:users!orders_buyer_id_fkey(display_name, avatar_url), seller:users!orders_seller_id_fkey(display_name, location)`)
      .eq('rider_id', user.id)
      .in('status', ['assigned', 'shipped'])
      .order('created_at', { ascending: false });

    setActiveOrders((data || []) as DeliveryOrder[]);

    // Count today's completed
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: completed } = await supabase
      .from('orders')
      .select('id, delivery_fee')
      .eq('rider_id', user.id)
      .eq('status', 'delivered')
      .gte('delivered_at', today.toISOString());

    setCompletedToday(completed?.length || 0);
    setEarnings(completed?.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0) || 0);
    setLoading(false);
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng });
        setLocationLoading(false);
        if (!user) return;
        // Update rider's location in DB
        await supabase.from('riders').update({
          current_lat: lat, current_lng: lng, last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        // Also update any active order's tracking coords
        await supabase.from('orders').update({ tracking_lat: lat, tracking_lng: lng })
          .eq('rider_id', user.id).in('status', ['assigned', 'shipped']);
      },
      (err) => { console.warn('GPS error:', err); setLocationLoading(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    await supabase.from('riders').update({ is_available: newVal }).eq('user_id', user.id);
  };

  const markPickedUp = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    loadOrders();
  };

  const markDelivered = async (order: DeliveryOrder) => {
    await supabase.from('orders').update({
      status: 'delivered', delivered_at: new Date().toISOString()
    }).eq('id', order.id);

    // Credit rider's wallet with delivery fee
    if (order.delivery_fee && user) {
      let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
      if (!wallet) {
        const { data: nw } = await supabase.from('wallets').insert({ user_id: user.id, balance: 0 }).select().single();
        wallet = nw;
      }
      if (wallet) {
        const newBal = Number(wallet.balance) + Number(order.delivery_fee);
        await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id, type: 'payment_received', amount: order.delivery_fee,
          description: `Delivery fee for order #${order.id.slice(0, 8)}`, status: 'completed'
        });
      }
    }

    // Notify buyer
    if (order.buyer) {
      await supabase.from('notifications').insert({
        user_id: (order as any).buyer_id, type: 'system',
        message: `Your order has been delivered! 🎉`
      });
    }

    loadOrders();
    alert('✅ Delivery marked as complete! Fee credited to your wallet.');
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Rider Dashboard</h1>
        <button onClick={toggleAvailability} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: isAvailable ? '#22c55e20' : '#ef444420', color: isAvailable ? '#22c55e' : '#ef4444' }}>
          {isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {isAvailable ? 'Available' : 'Offline'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* GPS Status */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentLocation ? '#22c55e20' : '#f59e0b20', color: currentLocation ? '#22c55e' : '#f59e0b' }}>
            {locationLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {locationLoading ? 'Getting GPS...' : currentLocation ? 'Location Active' : 'GPS Unavailable'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {currentLocation ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'Enable location permissions'}
            </p>
          </div>
          {currentLocation && <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Orders', value: activeOrders.length, color: '#3b82f6' },
            { label: 'Delivered Today', value: completedToday, color: '#22c55e' },
            { label: "Today's Earnings", value: `₦${earnings.toLocaleString()}`, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active deliveries */}
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Active Deliveries</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Package className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No active deliveries</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Stay available to receive delivery requests</p>
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200">
                    {order.product?.images?.[0] && <img src={order.product.images[0]} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{order.product?.title || 'Order'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>From: {order.seller?.display_name}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: order.status === 'shipped' ? '#22c55e20' : '#f59e0b20', color: order.status === 'shipped' ? '#22c55e' : '#f59e0b' }}>
                    {order.status === 'shipped' ? 'In Transit' : 'Assigned'}
                  </span>
                </div>

                <div className="flex items-start gap-2 mb-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{order.delivery_address || 'Address not set'}</p>
                </div>

                {order.buyer_phone && (
                  <a href={`tel:${order.buyer_phone}`} className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#22c55e' }}>
                    <Phone className="w-4 h-4" />
                    <span>Call buyer: {order.buyer_phone}</span>
                  </a>
                )}

                <div className="flex gap-2">
                  {order.status === 'assigned' && (
                    <button onClick={() => markPickedUp(order.id)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                      style={{ backgroundColor: '#f59e0b' }}>
                      <Package className="w-4 h-4" /> Picked Up
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button onClick={() => markDelivered(order)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                      style={{ backgroundColor: '#22c55e' }}>
                      <CheckCircle className="w-4 h-4" /> Mark Delivered
                    </button>
                  )}
                  <button onClick={() => navigate(`/messages/${(order as any).buyer_id}`)}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    Chat
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
