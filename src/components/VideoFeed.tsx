import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, ShoppingBag, Send } from 'lucide-react';
import { supabase, type Video, type User } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type FeedMode = 'following' | 'for-you';

export default function VideoFeed({ mode }: { mode: FeedMode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, [mode]);

  useEffect(() => {
    const currentVideo = videoRefs.current[videos[currentIndex]?.id];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }
  }, [currentIndex, videos]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select(`
          *,
          user:users!videos_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (mode === 'following' && user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = follows?.map(f => f.following_id) || [];
        query = query.in('user_id', followingIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVideos((data as Video[]) || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const videoHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / videoHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);

      Object.keys(videoRefs.current).forEach(id => {
        const video = videoRefs.current[id];
        if (id !== videos[newIndex]?.id) {
          video?.pause();
        }
      });
    }
  };

  const toggleLike = async (video: Video) => {
    if (!user) return;

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', video.id)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      setVideos(videos.map(v =>
        v.id === video.id ? { ...v, like_count: v.like_count - 1 } : v
      ));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, video_id: video.id });
      setVideos(videos.map(v =>
        v.id === video.id ? { ...v, like_count: v.like_count + 1 } : v
      ));

      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: video.user_id,
          type: 'like',
          actor_id: user.id,
          video_id: video.id,
          message: `${user.display_name} liked your post`,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading feed...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No videos yet</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'following' ? 'Follow creators to see their content' : 'Check back soon'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {videos.map((video, index) => (
        <div key={video.id} className="h-screen snap-start relative">
          {video.type === 'video' && video.video_url ? (
            <video
              ref={el => { if (el) videoRefs.current[video.id] = el; }}
              src={video.video_url}
              loop
              muted={muted}
              playsInline
              className="w-full h-full object-cover"
              poster={video.thumbnail_url || undefined}
            />
          ) : video.type === 'image' && video.image_url ? (
            <img
              src={video.image_url}
              alt={video.caption}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xl text-center" style={{ color: 'var(--text-primary)' }}>{video.caption}</p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

          <div className="absolute top-4 right-4">
            <button
              onClick={() => setMuted(!muted)}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 pb-24">
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=100'}
                    alt={video.user?.display_name}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate(`/profile/${video.user_id}`)}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{video.user?.display_name}</p>
                    {video.user?.location && (
                      <p className="text-white/70 text-xs">{video.user.location}</p>
                    )}
                  </div>
                </div>
                <p className="text-white text-sm mb-2">{video.caption}</p>
                {video.hashtags.length > 0 && (
                  <p className="text-white/80 text-sm">
                    {video.hashtags.map(tag => `#${tag}`).join(' ')}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => toggleLike(video)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Heart className="w-6 h-6 text-white" fill="white" />
                  </div>
                  <span className="text-white text-xs">{video.like_count}</span>
                </button>

                <button
                  onClick={() => navigate(`/video/${video.id}`)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs">{video.comment_count}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs">{video.share_count}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                </button>

                {video.product_tags.length > 0 && (
                  <>
                    <button
                      onClick={() => navigate(`/product/${video.product_tags[0]}`)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                    </button>
                    <button
                      onClick={() => navigate(`/profile/${video.user_id}`)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <Send className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
