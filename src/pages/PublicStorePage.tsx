import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, MapPin, BadgeCheck } from 'lucide-react';
import { supabase, type Product, type User } from '../lib/supabase';

export default function PublicStorePage() {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStoreData();
  }, [sellerId]);

  const loadStoreData = async () => {
    if (!sellerId) return;

    const [sellerRes, productsRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', sellerId).maybeSingle(),
      supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }),
    ]);

    if (sellerRes.data) setSeller(sellerRes.data as User);
    if (productsRes.data) setProducts(productsRes.data as Product[]);
    setLoading(false);
  };

  const shareStore = async () => {
    const storeUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${seller?.display_name}'s Store`,
          text: `Check out ${seller?.display_name}'s products!`,
          url: storeUrl,
        });
      } catch (err) {
        navigator.clipboard.writeText(storeUrl);
      }
    } else {
      navigator.clipboard.writeText(storeUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-primary)' }}>Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold truncate flex-1 px-4" style={{ color: 'var(--text-primary)' }}>{seller.display_name}</h1>
        <button onClick={shareStore} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      <div className="p-4">
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-start gap-4 mb-4">
            <img src={seller.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt={seller.display_name} className="w-20 h-20 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{seller.display_name}</h2>
                {seller.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" />}
              </div>
              {seller.business_type && (
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{seller.business_type}</p>
              )}
              {seller.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{seller.location}</p>
                </div>
              )}
            </div>
          </div>

          {seller.bio && (
            <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{seller.bio}</p>
          )}

          <div className="flex gap-2">
            <button onClick={() => navigate(`/profile/${sellerId}`)} className="flex-1 py-3 rounded-full font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              <MessageCircle className="w-4 h-4" />
              Message Seller
            </button>
            <button onClick={shareStore} className="px-4 py-3 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Products ({products.length})</h3>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-lg" style={{ color: 'var(--text-primary)' }}>No products available</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="rounded-xl overflow-hidden cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="aspect-square" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  {product.images[0] && <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>{product.title}</p>
                  <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>₦{product.price.toLocaleString()}</p>
                  {product.delivery_fee > 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>+ ₦{product.delivery_fee} delivery</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: product.stock > 0 ? 'var(--text-secondary)' : '#ef4444' }}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
