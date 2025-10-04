import { useState, useEffect } from 'react';
import { Search, TrendingUp, ShoppingBag } from 'lucide-react';
import { supabase, type Product, type Video } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{ videos: Video[]; products: Product[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopProducts();
    loadTrendingHashtags();
  }, []);

  const loadTopProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select(`*, seller:users!products_seller_id_fkey(*)`)
      .eq('is_featured', true)
      .order('purchase_count', { ascending: false })
      .limit(6);

    if (data) setTopProducts(data as Product[]);
  };

  const loadTrendingHashtags = async () => {
    const { data } = await supabase
      .from('videos')
      .select('hashtags')
      .order('view_count', { ascending: false })
      .limit(20);

    if (data) {
      const allTags = data.flatMap(v => v.hashtags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sorted = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      setTrendingHashtags(sorted);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${searchQuery}%`;

      const [videosRes, productsRes] = await Promise.all([
        supabase
          .from('videos')
          .select(`*, user:users!videos_user_id_fkey(*)`)
          .or(`caption.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('products')
          .select(`*, seller:users!products_seller_id_fkey(*)`)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10),
      ]);

      setSearchResults({
        videos: (videosRes.data as Video[]) || [],
        products: (productsRes.data as Product[]) || [],
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search products, users, hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="p-4">
        {searchResults ? (
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Search Results
            </h2>

            {searchResults.products.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Products
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="rounded-xl overflow-hidden cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="aspect-square bg-gray-200">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                          {product.title}
                        </p>
                        <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          ₦{product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.videos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Videos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {searchResults.videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => navigate(`/video/${video.id}`)}
                      className="aspect-[9/16] rounded-lg overflow-hidden cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <p className="text-xs line-clamp-3" style={{ color: 'var(--text-primary)' }}>
                            {video.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.products.length === 0 && searchResults.videos.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
                No results found
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Trending Hashtags
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(`#${tag}`);
                      handleSearch();
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Top Products
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="rounded-xl overflow-hidden cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="aspect-square bg-gray-200">
                      {product.images[0] && (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {product.title}
                      </p>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {product.seller?.display_name}
                      </p>
                      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        ₦{product.price.toLocaleString()}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {product.purchase_count} sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
