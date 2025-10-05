import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, BadgeCheck, MapPin, Grid2x2 as Grid, ShoppingBag } from 'lucide-react';
import { supabase, type User, type Video, type Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

export default function ProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'products'>('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === user?.id;
  const profileToShow = isOwnProfile ? user : profile;

  useEffect(() => {
    if (userId && userId !== user?.id) {
      loadProfile();
      checkFollowing();
    }
    if (profileToShow) {
      loadUserContent();
    }
  }, [userId, user]);

  const loadProfile = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) setProfile(data as User);
  };

  const checkFollowing = async () => {
    if (!user || !userId) return;
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const loadUserContent = async () => {
    if (!profileToShow) return;

    const [videosRes, productsRes] = await Promise.all([
      supabase
        .from('videos')
        .select('*')
        .eq('user_id', profileToShow.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('products')
        .select('*')
        .eq('seller_id', profileToShow.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setVideos((videosRes.data as Video[]) || []);
    setProducts((productsRes.data as Product[]) || []);
  };

  const toggleFollow = async () => {
    if (!user || !userId) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
      });
      setIsFollowing(true);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'follow',
        actor_id: user.id,
        message: `${user.display_name} started following you`,
      });
    }
  };

  if (!profileToShow) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h1>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <Settings className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-4 mb-6">
          <img
            src={profileToShow.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
            alt={profileToShow.display_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {profileToShow.display_name}
              </h2>
              {profileToShow.is_verified && (
                <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" />
              )}
            </div>
            {profileToShow.location && (
              <div className="flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {profileToShow.location}
                </p>
              </div>
            )}
            {profileToShow.business_type && (
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                {profileToShow.business_type}
              </p>
            )}
          </div>
        </div>

        {profileToShow.bio && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            {profileToShow.bio}
          </p>
        )}

        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {profileToShow.follower_count}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Followers
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {profileToShow.following_count}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Following
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {videos.length}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Posts
            </p>
          </div>
        </div>

        {!isOwnProfile ? (
          <button
            onClick={toggleFollow}
            className="w-full py-3 rounded-full font-medium mb-6"
            style={{
              backgroundColor: isFollowing ? 'var(--bg-secondary)' : 'var(--text-primary)',
              color: isFollowing ? 'var(--text-primary)' : 'var(--bg-primary)',
              border: isFollowing ? '1px solid var(--border-color)' : 'none',
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        ) : (
          profileToShow.is_seller && (
            <button
              onClick={() => navigate('/catalogue')}
              className="w-full py-3 rounded-full font-medium mb-6"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              Manage Catalogue
            </button>
          )
        )}

        {profileToShow.is_seller && (
          <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setActiveTab('videos')}
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: activeTab === 'videos' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'videos' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              <Grid className="w-4 h-4" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: activeTab === 'products' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'products' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Products
            </button>
          </div>
        )}

        {activeTab === 'videos' ? (
          <div className="grid grid-cols-3 gap-1">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => navigate(`/video/${video.id}`)}
                className="aspect-[9/16] rounded-lg overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : video.image_url ? (
                  <img src={video.image_url} alt="" className="w-full h-full object-cover" />
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
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
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && <BottomNav />}
    </div>
  );
}
