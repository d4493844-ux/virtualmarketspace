import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, CheckCircle, Bike, Clock, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';


type Order = {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  tracking_lat: number | null;
  tracking_lng: number | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  rider_id: string | null;
  delivery_notes: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  created_at: string;
  product?: { title: string; images: string[] };
  rider?: { display_name: string; avatar_url: string | null; phone: string | null };
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'paid', label: 'Payment Confirmed', icon: CheckCircle },
  { key: 'assigned', label: 'Rider Assigned', icon: Bike },
  { key: 'shipped', label: 'On the Way', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function DeliveryTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // Poll for rider location every 10 seconds when order is active
      const interval = setInterval(() => {
        if (orderId) loadOrder();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  useEffect(() => {
    if (order?.tracking_lat && order?.tracking_lng) {
      initMap(order.tracking_lat, order.tracking_lng);
    }
  }, [order?.tracking_lat, order?.tracking_lng]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, product:products(title, images), rider:users!orders_rider_id_fkey(display_name, avatar_url, phone)`)
      .eq('id', orderId)
      .single();
    if (data) setOrder(data as Order);
    setLoading(false);
  };

  const initMap = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    // Use Leaflet.js for map (loaded via CDN in index.html)
    const L = (window as any).L;
    if (!L) {
      // Leaflet not loaded yet — show static coords
      return;
    }
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
    if (markerRef.current) markerRef.current.remove();
    const riderIcon = L.divIcon({
      html: `<div style="background:#3b82f6;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🛵</div>`,
      className: '', iconSize: [36, 36], iconAnchor: [18, 18]
    });
    markerRef.current = L.marker([lat, lng], { icon: riderIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${order?.rider?.display_name || 'Your Rider'}</b><br>On the way!`)
      .openPopup();
  };

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order?.status);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: '#3b82f6' }} />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <p style={{ color: 'var(--text-primary)' }}>Order not found</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-full text-white" style={{ backgroundColor: '#3b82f6' }}>Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Track Delivery</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Live Map */}
      <div className="relative" style={{ height: '280px', backgroundColor: '#1a1a2e' }}>
        {order.tracking_lat && order.tracking_lng ? (
          <>
            <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
            {/* Fallback if Leaflet not available */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-black/60 rounded-2xl px-4 py-2 text-center">
                <p className="text-white text-xs">📍 Rider at {order.tracking_lat.toFixed(4)}, {order.tracking_lng.toFixed(4)}</p>
                <p className="text-white/60 text-xs">Live GPS tracking active</p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
              <MapPin className="w-8 h-8" style={{ color: '#3b82f6' }} />
            </div>
            <p className="text-white/60 text-sm">
              {order.status === 'pending' || order.status === 'paid'
                ? 'Waiting for rider assignment...'
                : 'GPS location will appear once rider starts delivery'}
            </p>
          </div>
        )}

        {/* Live badge */}
        {order.status === 'shipped' && order.tracking_lat && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Status stepper */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Delivery Progress</h3>
          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: done ? '#3b82f6' : 'var(--bg-tertiary)', border: active ? '2px solid #60a5fa' : 'none' }}>
                      <Icon className="w-4 h-4" style={{ color: done ? 'white' : 'var(--text-tertiary)' }} />
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ backgroundColor: i < currentStepIndex ? '#3b82f6' : 'var(--border-color)' }} />
                    )}
                  </div>
                  <div className="pb-3 flex-1">
                    <p className="text-sm font-semibold" style={{ color: done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{step.label}</p>
                    {active && <p className="text-xs" style={{ color: '#3b82f6' }}>Current status</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {order.estimated_delivery && order.status !== 'delivered' && (
            <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Est. delivery: <span className="font-bold">{new Date(order.estimated_delivery).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          )}
        </div>

        {/* Rider info */}
        {order.rider && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <img src={order.rider.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
              className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{order.rider.display_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your delivery rider</p>
            </div>
            <div className="flex gap-2">
              {order.rider.phone && (
                <a href={`tel:${order.rider.phone}`} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => navigate(`/messages/${order.rider_id}`)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Order Details</h3>
          {order.product && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200">
                {order.product.images?.[0] && <img src={order.product.images[0]} className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{order.product.title}</p>
                <p className="text-sm font-bold" style={{ color: '#3b82f6' }}>₦{Number(order.total_amount).toLocaleString()}</p>
              </div>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-start gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.delivery_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
