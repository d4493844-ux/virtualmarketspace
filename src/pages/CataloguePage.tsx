import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Share2, Copy, Check } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter(p => p.id !== id));
  };

  const shareStore = async () => {
    const storeUrl = `${window.location.origin}/store/${user?.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.display_name}'s Store`,
          text: `Check out my product catalogue!`,
          url: storeUrl,
        });
      } catch (err) {
        copyToClipboard(storeUrl);
      }
    } else {
      copyToClipboard(storeUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>My Catalogue</h1>
        <button onClick={shareStore} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />}
        </button>
      </div>

      <div className="p-4">
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-4 mb-4">
            <img src={user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt={user?.display_name} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{user?.display_name}</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.business_type}</p>
            </div>
          </div>
          {user?.bio && (
            <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{user.bio}</p>
          )}
          <button onClick={shareStore} className="w-full py-3 rounded-full font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            <Copy className="w-4 h-4" />
            {copied ? 'Store Link Copied!' : 'Copy Store Link'}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Products ({products.length})</h3>
          <button onClick={() => navigate('/catalogue/add')} className="flex items-center gap-2 px-4 py-2 rounded-full font-medium" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No products yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Start building your catalogue</p>
            <button onClick={() => navigate('/catalogue/add')} className="px-6 py-3 rounded-full font-medium" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    {product.images[0] && <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{product.title}</h4>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>₦{product.price.toLocaleString()}</p>
                      {product.delivery_fee > 0 && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>+ ₦{product.delivery_fee} delivery</p>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Stock: {product.stock}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => navigate(`/catalogue/edit/${product.id}`)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <Edit className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
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
