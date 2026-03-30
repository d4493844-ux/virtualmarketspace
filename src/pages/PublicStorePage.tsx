import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, MapPin, BadgeCheck, Star, Package, Grid3X3, List, Search, ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase, type Product, type User } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function PublicStorePage() {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [shareCopied, setShareCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { loadStoreData(); }, [sellerId]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const shareStore = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${seller?.display_name}'s Store on VMS`, text: `Shop ${seller?.display_name}'s products on Virtual Market Space!`, url });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleMessage = () => {
    if (!user) { navigate('/auth'); return; }
    navigate(`/messages/${sellerId}`);
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <ShoppingBag size={48} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
        <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Store not found</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          Go Back
        </button>
      </div>
    );
  }

  const inStockCount = products.filter(p => p.stock > 0).length;

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1 px-3 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{seller.display_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shareStore}
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            {shareCopied && (
              <span className="absolute -top-8 right-0 text-xs bg-black text-white px-2 py-1 rounded-lg whitespace-nowrap z-50">
                Link copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Store Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f172a 100%)', padding: '28px 20px 24px' }}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.display_name}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '3px solid rgba(255,255,255,0.2)' }}
              >
                {seller.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {seller.is_verified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#3b82f6' }}>
                <BadgeCheck size={14} color="#fff" fill="#fff" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-extrabold" style={{ color: '#fff' }}>{seller.display_name}</h1>
            </div>
            {seller.business_type && (
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
              >
                {seller.business_type}
              </span>
            )}
            {seller.location && (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={12} color="rgba(255,255,255,0.5)" />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{seller.location}</span>
              </div>
            )}
            {seller.bio && (
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{seller.bio}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-5">
          {[
            { label: 'Products', value: products.length },
            { label: 'In Stock', value: inStockCount },
            { label: 'Rating', value: '5.0 ★' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex-1 rounded-xl py-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-base font-extrabold" style={{ color: '#fff' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleMessage}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: '#fff', color: '#0f172a' }}
          >
            <MessageCircle size={16} /> Message Seller
          </button>
          <button
            onClick={shareStore}
            className="px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ExternalLink size={16} />
            Share Store
          </button>
        </div>
      </div>

      {/* Products section */}
      <div className="px-4 pt-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search this store…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: selectedCategory === cat ? 'var(--text-primary)' : 'var(--bg-secondary)',
                  color: selectedCategory === cat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--bg-secondary)' }}
            >
              <Grid3X3 size={14} style={{ color: viewMode === 'grid' ? 'var(--bg-primary)' : 'var(--text-secondary)' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: viewMode === 'list' ? 'var(--text-primary)' : 'var(--bg-secondary)' }}
            >
              <List size={14} style={{ color: viewMode === 'list' ? 'var(--bg-primary)' : 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Products grid/list */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Package size={36} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No products found</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'Try a different search' : 'This seller has no products yet'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="aspect-square relative" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <ShoppingBag size={32} />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                      <span className="text-xs font-bold text-white px-2 py-1 rounded-full" style={{ background: 'rgba(220,38,38,0.9)' }}>Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2 mb-1.5" style={{ color: 'var(--text-primary)' }}>{product.title}</p>
                  <p className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>₦{product.price?.toLocaleString()}</p>
                  {product.delivery_fee > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>+₦{product.delivery_fee.toLocaleString()} delivery</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="flex gap-3 rounded-2xl overflow-hidden cursor-pointer p-3"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>{product.title}</p>
                  <p className="text-base font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>₦{product.price?.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: product.stock > 0 ? '#d1fae5' : '#fee2e2', color: product.stock > 0 ? '#065f46' : '#b91c1c' }}
                    >
                      {product.stock > 0 ? 'In Stock' : 'Sold Out'}
                    </span>
                    {product.category && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.category}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
