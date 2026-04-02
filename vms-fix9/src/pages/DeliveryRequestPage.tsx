import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Bike, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/* ── SMART DELIVERY PRICING ENGINE ───────────────────────────────────────────
  Logic:
  - Within community (≤5km): flat ₦1,500
  - Outside community (5–20km): base ₦1,500 + ₦200/km + weight surcharge
  - Long distance (>20km): base ₦3,000 + ₦150/km + weight surcharge
  - Weight surcharges: small=₦0, medium=₦500, heavy=₦1,500
  - Estimated time: ~3km/min on bike in city traffic
  - Human-friendly: prices capped to avoid shocking buyers
*/
function calculateDelivery(distanceKm: number, weightClass: string, isWithinCommunity: boolean) {
  const weightSurcharge = weightClass === 'heavy' ? 1500 : weightClass === 'medium' ? 500 : 0;

  let baseFee: number;
  let perKm: number;

  if (isWithinCommunity || distanceKm <= 5) {
    baseFee = 1500;
    perKm   = 0; // flat rate within community
  } else if (distanceKm <= 20) {
    baseFee = 1500;
    perKm   = 200;
  } else {
    baseFee = 3000;
    perKm   = 150;
  }

  const distanceCost = distanceKm > 5 ? (distanceKm - 5) * perKm : 0;
  const subtotal     = baseFee + distanceCost + weightSurcharge;
  // Cap at ₦15,000 for very long distances — keeps it human-friendly
  const deliveryFee  = Math.min(Math.round(subtotal / 50) * 50, 15000);

  // Estimate time: 3km/min average + 10min pickup buffer
  const estimatedMinutes = Math.round((distanceKm / 3) + 10);

  return { deliveryFee, estimatedMinutes, breakdown: {
    baseFee, distanceCost: Math.round(distanceCost), weightSurcharge,
    distanceKm: Math.round(distanceKm * 10) / 10,
  }};
}

// Mock geocode: in production use Google Maps Geocoding API or OpenStreetMap Nominatim
async function estimateDistance(from: string, to: string): Promise<number> {
  // Simple heuristic: same street → 1km, same area → 3km, different area → 8–15km
  const fromLower = from.toLowerCase();
  const toLower   = to.toLowerCase();

  // Extract city/area keywords for rough comparison
  const areas = ['lekki','vi','victoria island','island','mainland','ikeja','surulere','yaba','oshodi','apapa'];
  const fromArea = areas.find(a => fromLower.includes(a));
  const toArea   = areas.find(a => toLower.includes(a));

  if (fromArea && toArea && fromArea === toArea) return 2 + Math.random() * 3; // same area: 2-5km
  if (fromArea && toArea) return 7 + Math.random() * 10; // different areas: 7-17km
  // Fallback: moderate distance
  return 4 + Math.random() * 6;
}

export default function DeliveryRequestPage() {
  const { orderId } = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [order, setOrder]          = useState<any>(null);
  const [loading, setLoading]      = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]  = useState(false);

  const [buyerAddress, setBuyerAddress]       = useState('');
  const [weightClass, setWeightClass]         = useState('small');
  const [isWithinCommunity, setIsWithinCommunity] = useState(true);
  const [pricing, setPricing]                 = useState<ReturnType<typeof calculateDelivery> | null>(null);
  const [calculating, setCalculating]         = useState(false);

  useEffect(() => { if (orderId) loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(title, images, pickup_location, weight_class), buyer:users!orders_buyer_id_fkey(display_name, phone)')
      .eq('id', orderId)
      .single();
    if (data) {
      setOrder(data);
      setWeightClass(data.product?.weight_class || 'small');
    }
    setLoading(false);
  };

  const calculatePrice = async () => {
    if (!buyerAddress.trim() || !order?.product?.pickup_location) {
      alert('Both pickup location and delivery address are needed');
      return;
    }
    setCalculating(true);
    const distKm = await estimateDistance(order.product.pickup_location, buyerAddress);
    const communityFlag = distKm <= 5;
    setIsWithinCommunity(communityFlag);
    const result = calculateDelivery(distKm, weightClass, communityFlag);
    setPricing(result);
    setCalculating(false);
  };

  const requestRider = async () => {
    if (!pricing || !order || !user) return;
    setSubmitting(true);

    // Update order with delivery details
    await supabase.from('orders').update({
      delivery_address:         buyerAddress,
      delivery_fee:             pricing.deliveryFee,
      weight_class:             weightClass,
      is_within_community:      isWithinCommunity,
      estimated_delivery:       new Date(Date.now() + pricing.estimatedMinutes * 60000).toISOString(),
      distance_km:              pricing.breakdown.distanceKm,
      delivery_price_breakdown: pricing.breakdown,
      status:                   'paid',
    }).eq('id', order.id);

    // Create open delivery request for riders to pick up
    await supabase.from('delivery_requests').insert({
      order_id:            order.id,
      seller_id:           user.id,
      weight_class:        weightClass,
      pickup_address:      order.product?.pickup_location || '',
      delivery_address:    buyerAddress,
      distance_km:         pricing.breakdown.distanceKm,
      delivery_fee:        pricing.deliveryFee,
      is_within_community: isWithinCommunity,
      estimated_minutes:   pricing.estimatedMinutes,
      status:              'open',
    });

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id:  order.buyer_id,
      type:     'system',
      message:  `Your order is being prepared for delivery! Estimated time: ${pricing.estimatedMinutes} mins. Delivery fee: ₦${pricing.deliveryFee.toLocaleString()}`,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Loader className="w-7 h-7 animate-spin" style={{ color: '#3b82f6' }} />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: '#dcfce7' }}>
        <CheckCircle className="w-10 h-10" style={{ color: '#16a34a' }} />
      </div>
      <h2 className="text-xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>Rider Request Sent!</h2>
      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
        Available riders nearby can now see and accept this delivery. First rider to accept gets the job.
      </p>
      {pricing && <p className="text-sm font-bold mb-8" style={{ color: '#3b82f6' }}>Estimated delivery: ~{pricing.estimatedMinutes} mins</p>}
      <button onClick={() => navigate(-1)} className="w-full py-4 rounded-full font-bold"
        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>Done</button>
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
        <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Request Delivery</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Order summary */}
        {order?.product && (
          <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
              {order.product.images?.[0] && <img src={order.product.images[0]} className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{order.product.title}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Buyer: {order.buyer?.display_name}</p>
              {order.buyer?.phone && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📞 {order.buyer.phone}</p>}
            </div>
          </div>
        )}

        {/* Pickup location */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Pickup From</p>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {order?.product?.pickup_location || 'Pickup location not set on product'}
          </p>
        </div>

        {/* Delivery address */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <MapPin className="w-4 h-4 inline mr-1" />Buyer's Delivery Address *
          </label>
          <textarea value={buyerAddress} onChange={e => { setBuyerAddress(e.target.value); setPricing(null); }}
            rows={2} placeholder="Enter the exact delivery address"
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
        </div>

        {/* Weight class */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <Package className="w-4 h-4 inline mr-1" />Package Weight
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>(rider can decline if this is wrong)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[{v:'small',l:'Small',d:'<2kg'},{v:'medium',l:'Medium',d:'2–10kg'},{v:'heavy',l:'Heavy',d:'>10kg'}].map(({v,l,d}) => (
              <button key={v} type="button" onClick={() => { setWeightClass(v); setPricing(null); }}
                className="p-3 rounded-xl text-center"
                style={{ backgroundColor: weightClass === v ? '#3b82f6' : 'var(--bg-secondary)', color: weightClass === v ? 'white' : 'var(--text-primary)', border: `1px solid ${weightClass === v ? '#3b82f6' : 'var(--border-color)'}` }}>
                <p className="font-bold text-sm">{l}</p>
                <p className="text-xs opacity-75">{d}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Calculate button */}
        <button onClick={calculatePrice} disabled={calculating || !buyerAddress.trim()}
          className="w-full py-3 rounded-full font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', opacity: !buyerAddress.trim() ? 0.5 : 1 }}>
          {calculating ? <><Loader className="w-4 h-4 animate-spin" /> Calculating…</> : '📍 Calculate Delivery Price'}
        </button>

        {/* Pricing result */}
        {pricing && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <div className="p-4" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Delivery Fee</p>
              <p className="text-3xl font-black text-white">₦{pricing.deliveryFee.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-white/70" />
                <p className="text-white/80 text-sm">~{pricing.estimatedMinutes} minutes estimated</p>
              </div>
            </div>
            <div className="p-4 space-y-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Price Breakdown</p>
              {[
                { l: 'Distance', v: `${pricing.breakdown.distanceKm}km` },
                { l: isWithinCommunity ? 'Community flat rate' : 'Base fee', v: `₦${pricing.breakdown.baseFee.toLocaleString()}` },
                ...(pricing.breakdown.distanceCost > 0 ? [{ l: 'Distance charge', v: `₦${pricing.breakdown.distanceCost.toLocaleString()}` }] : []),
                ...(pricing.breakdown.weightSurcharge > 0 ? [{ l: 'Weight surcharge', v: `₦${pricing.breakdown.weightSurcharge.toLocaleString()}` }] : []),
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              {isWithinCommunity && (
                <div className="flex items-center gap-2 pt-2 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Bike className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Within community — flat rate applies</p>
                </div>
              )}
            </div>

            {/* Warning if weight might be disputed */}
            <div className="px-4 pb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ca8a04' }} />
                <p className="text-xs" style={{ color: '#92400e' }}>
                  Rider will see the package weight as <strong>{weightClass}</strong>. If the actual weight is different, the rider has the right to decline pickup.
                </p>
              </div>
            </div>
          </div>
        )}

        {pricing && (
          <button onClick={requestRider} disabled={submitting}
            className="w-full py-4 rounded-full font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#22c55e', color: 'white', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? <><Loader className="w-5 h-5 animate-spin" /> Requesting…</> : <><Bike className="w-5 h-5" /> Request a Rider</>}
          </button>
        )}
      </div>
    </div>
  );
}
