import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, ShoppingBag, X, BadgeCheck, MapPin, Store } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerSent, setOfferSent] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, seller:users!products_seller_id_fkey(*)`)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      setProduct(data as Product);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (!product || !user) return;
    navigate(`/messages/${product.seller_id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, text: `Check this out on VMS: ${product?.title} — ₦${product?.price?.toLocaleString()}`, url });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleSendOffer = async () => {
    if (!product || !user || !offerAmount) return;
    setSendingOffer(true);
    const amount = parseFloat(offerAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) { setSendingOffer(false); return; }

    // Find or create conversation, send offer as message
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id, product.seller_id])
      .maybeSingle();

    let convId: string;
    if (existingConv) {
      convId = existingConv.id;
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_ids: [user.id, product.seller_id] })
        .select()
        .single();
      if (!newConv) { setSendingOffer(false); return; }
      convId = newConv.id;
    }

    const offerMsg = `🏷️ OFFER on "${product.title}"\n\nOffer Price: ₦${amount.toLocaleString()}\nAsking Price: ₦${product.price.toLocaleString()}${offerNote ? `\n\nNote: ${offerNote}` : ''}`;

    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content: offerMsg,
    });

    setSendingOffer(false);
    setOfferSent(true);
    setTimeout(() => {
      setShowOfferModal(false);
      setOfferSent(false);
      setOfferAmount('');
      setOfferNote('');
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>Product</h1>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          {shareCopied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded-lg whitespace-nowrap">
              Link copied!
            </span>
          )}
        </button>
      </div>

      {/* Image gallery */}
      <div className="aspect-square relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {product.images && product.images.length > 0 ? (
          <>
            <img src={product.images[currentImageIndex]} alt={product.title} className="w-full h-full object-cover" />
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.images.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)' }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <ShoppingBag size={60} />
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Seller info */}
        <div
          className="flex items-center gap-3 mb-5 p-3 rounded-2xl cursor-pointer"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => navigate(`/store/${product.seller_id}`)}
        >
          {product.seller?.avatar_url ? (
            <img src={product.seller.avatar_url} alt={product.seller.display_name} className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
              {product.seller?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {product.seller?.display_name}
              </p>
              {product.seller?.is_verified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />}
            </div>
            {product.seller?.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} style={{ color: 'var(--text-secondary)' }} />
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{product.seller.location}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
            <Store size={13} /> View Store
          </div>
        </div>

        {/* Price & title */}
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{product.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>₦{product.price?.toLocaleString()}</p>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: product.stock > 0 ? '#d1fae5' : '#fee2e2', color: product.stock > 0 ? '#065f46' : '#b91c1c' }}
          >
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
          {product.category && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {product.category}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Description</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{product.description}</p>
        </div>

        {product.sku && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>SKU: {product.sku}</p>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleMessage}
          className="flex-1 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 text-sm"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          <MessageCircle className="w-4 h-4" />
          Message Seller
        </button>
        <button
          onClick={() => { if (product.stock > 0) setShowOfferModal(true); }}
          disabled={product.stock === 0}
          className="flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-40"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          <ShoppingBag className="w-4 h-4" />
          Make Offer
        </button>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowOfferModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            {offerSent ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="text-4xl">🎉</div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Offer Sent!</p>
                <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                  Your offer has been sent to {product.seller?.display_name}. Check messages for their reply.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Make an Offer</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Asking: ₦{product.price?.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setShowOfferModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <X size={16} style={{ color: 'var(--text-primary)' }} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                      Your Offer Price (₦)
                    </label>
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={e => setOfferAmount(e.target.value)}
                      placeholder={`e.g. ${Math.round(product.price * 0.9).toLocaleString()}`}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                      Note to Seller (optional)
                    </label>
                    <textarea
                      value={offerNote}
                      onChange={e => setOfferNote(e.target.value)}
                      placeholder="e.g. Can you include delivery to Lekki?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' }}
                    />
                  </div>
                  <button
                    onClick={handleSendOffer}
                    disabled={!offerAmount || sendingOffer}
                    className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-40"
                    style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  >
                    {sendingOffer ? 'Sending…' : 'Send Offer via Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
