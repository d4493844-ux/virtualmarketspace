import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, ShoppingBag } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadProduct();
  }, [id]);

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Product</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      <div className="aspect-square relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {product.images.length > 0 && (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <img
            src={product.seller?.avatar_url || ''}
            alt={product.seller?.display_name}
            className="w-12 h-12 rounded-full object-cover cursor-pointer"
            onClick={() => navigate(`/profile/${product.seller_id}`)}
          />
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {product.seller?.display_name}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {product.seller?.location}
            </p>
          </div>
          <button
            onClick={handleMessage}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            Message
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {product.title}
        </h1>

        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ₦{product.price.toLocaleString()}
          </p>
          {product.stock > 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {product.stock} in stock
            </p>
          ) : (
            <p className="text-sm" style={{ color: '#c00' }}>
              Out of stock
            </p>
          )}
        </div>

        {product.category && (
          <div className="inline-block px-3 py-1 rounded-full text-sm mb-4" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            {product.category}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Description
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {product.description}
          </p>
        </div>

        {product.sku && (
          <div className="text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>
            SKU: {product.sku}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleMessage}
          className="flex-1 py-4 rounded-full font-medium flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        >
          <MessageCircle className="w-5 h-5" />
          Message Seller
        </button>
        <button
          disabled={product.stock === 0}
          className="flex-1 py-4 rounded-full font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          <ShoppingBag className="w-5 h-5" />
          Make Offer
        </button>
      </div>
    </div>
  );
}
