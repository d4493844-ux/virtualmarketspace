import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, ShoppingBag, Send, X, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Video } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VideoFeedProps {
  mode: 'following' | 'for-you';
}

interface ScoredVideo extends Video {
  algorithmScore: number;
}

export default function VideoFeed({ mode }: VideoFeedProps) {
  const [videos, setVideos] = useState<ScoredVideo[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [userInterests, setUserInterests] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  // Track which video is currently visible for view counting
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadFollowedUsers();
      loadUserInterests();
    }
  }, [user?.id]);

  useEffect(() => {
    loadVideos();
    if (user) {
      loadUserLikes();
      loadUserBookmarks();
    }
  }, [mode, user?.id]);

  // ── IMPROVED ALGORITHM ─────────────────────────────────────────────────────
  // Inspired by TikTok/Instagram Reels ranking signals
  const loadUserInterests = async () => {
    if (!user) return;
    const interests: { [key: string]: number } = {};

    // Signal 1: liked posts (weight: 2 per tag)
    const { data: liked } = await supabase
      .from('likes').select('video_id, videos!inner(hashtags)').eq('user_id', user.id).limit(200);
    liked?.forEach((p: any) => p.videos?.hashtags?.forEach((t: string) => { interests[t] = (interests[t] || 0) + 2; }));

    // Signal 2: commented posts (weight: 4 per tag — stronger intent signal)
    const { data: commented } = await supabase
      .from('comments').select('video_id, videos!inner(hashtags)').eq('user_id', user.id).limit(100);
    commented?.forEach((p: any) => p.videos?.hashtags?.forEach((t: string) => { interests[t] = (interests[t] || 0) + 4; }));

    // Signal 3: viewed seller products (weight: 3)
    const { data: viewed } = await supabase
      .from('products').select('category').order('view_count', { ascending: false }).limit(20);
    viewed?.forEach((p: any) => { if (p.category) interests[p.category] = (interests[p.category] || 0) + 3; });

    setUserInterests(interests);
  };

  const loadFollowedUsers = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setFollowedUsers(new Set(data.map((f: any) => f.following_id)));
  };

  const scoreVideo = (video: Video): number => {
    const now = Date.now();
    const ageMs = now - new Date(video.created_at).getTime();
    const ageHours = ageMs / 3_600_000;

    // ── ENGAGEMENT RATE (like TikTok: completion + engagement relative to views)
    const totalEngagement = video.like_count + (video.comment_count * 2) + (video.share_count * 3);
    const engagementRate = video.view_count > 0 ? totalEngagement / video.view_count : 0;
    // Boost raw engagement counts but normalise by views (viral ceiling protection)
    const engagementScore = Math.min(engagementRate * 1000, 500) + Math.log1p(totalEngagement) * 10;

    // ── FRESHNESS (exponential decay — strongly favour recent content)
    // < 1h: full boost, 24h: 50%, 72h: 20%, 7d: 5%, older: near 0
    const freshnessScore = 100 * Math.exp(-0.015 * ageHours);

    // ── PERSONAL RELEVANCE (based on user's interest graph)
    let personalScore = 0;
    if (mode === 'for-you') {
      video.hashtags?.forEach((tag: string) => {
        personalScore += (userInterests[tag] || 0) * 5;
      });
      // Following boost — content from followed accounts gets significant lift
      if (followedUsers.has(video.user_id)) personalScore += 80;
    }

    // ── DIVERSITY — mild random factor prevents the same creators dominating (±10%)
    const diversityFactor = 0.9 + Math.random() * 0.2;

    // ── VERIFIED SELLER boost
    const verifiedBoost = (video.user as any)?.is_verified ? 20 : 0;

    // ── FINAL SCORE: weighted combination
    const score = (
      engagementScore   * 0.35 +
      freshnessScore    * 0.30 +
      personalScore     * 0.25 +
      verifiedBoost     * 0.10
    ) * diversityFactor;

    return score;
  };

  const loadVideos = async () => {
    let query = supabase
      .from('videos')
      .select('*, user:users!videos_user_id_fkey(*)');

    if (mode === 'following') {
      if (followedUsers.size > 0) {
        query = query.in('user_id', Array.from(followedUsers));
      } else {
        setVideos([]);
        return;
      }
    }

    // Fetch more videos so the algorithm has a bigger pool to rank
    const { data } = await query.limit(80);

    if (data) {
      const scored: ScoredVideo[] = (data as Video[]).map(v => ({
        ...v,
        algorithmScore: scoreVideo(v),
      }));

      const sorted = mode === 'for-you'
        ? scored.sort((a, b) => b.algorithmScore - a.algorithmScore)
        : scored.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setVideos(sorted);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('video_id').eq('user_id', user.id);
    if (data) setLikedVideos(new Set(data.map((l: any) => l.video_id)));
  };

  const loadUserBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase.from('bookmarks').select('video_id').eq('user_id', user.id);
    if (data) setBookmarkedVideos(new Set(data.map((b: any) => b.video_id)));
  };

  const loadComments = async (videoId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users!comments_user_id_fkey(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  // Count a view when a video enters the viewport
  const recordView = useCallback(async (videoId: string) => {
    if (viewedRef.current.has(videoId)) return;
    viewedRef.current.add(videoId);
    await supabase.from('videos').update({ view_count: supabase.rpc('increment', { x: 1 }) as any }).eq('id', videoId);
  }, []);

  const handleLike = async (video: Video) => {
    if (!user) return;
    const isLiked = likedVideos.has(video.id);
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', video.id);
      await supabase.from('videos').update({ like_count: Math.max(0, video.like_count - 1) }).eq('id', video.id);
      setLikedVideos(prev => { const s = new Set(prev); s.delete(video.id); return s; });
      setVideos(vs => vs.map(v => v.id === video.id ? { ...v, like_count: Math.max(0, v.like_count - 1) } : v));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, video_id: video.id });
      await supabase.from('videos').update({ like_count: video.like_count + 1 }).eq('id', video.id);
      setLikedVideos(prev => new Set(prev).add(video.id));
      setVideos(vs => vs.map(v => v.id === video.id ? { ...v, like_count: v.like_count + 1 } : v));
      video.hashtags?.forEach(tag => setUserInterests(prev => ({ ...prev, [tag]: (prev[tag] || 0) + 2 })));
      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: video.user_id, type: 'like', actor_id: user.id, video_id: video.id, message: `${user.display_name} liked your post` });
      }
    }
  };

  const handleBookmark = async (video: Video) => {
    if (!user) return;
    const isBookmarked = bookmarkedVideos.has(video.id);
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('video_id', video.id);
      setBookmarkedVideos(prev => { const s = new Set(prev); s.delete(video.id); return s; });
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, video_id: video.id });
      setBookmarkedVideos(prev => new Set(prev).add(video.id));
    }
  };

  const handleComment = async (video: Video) => {
    if (!user || !commentText.trim()) return;
    const { error } = await supabase.from('comments').insert({ user_id: user.id, video_id: video.id, content: commentText });
    if (!error) {
      await supabase.from('videos').update({ comment_count: video.comment_count + 1 }).eq('id', video.id);
      setVideos(vs => vs.map(v => v.id === video.id ? { ...v, comment_count: v.comment_count + 1 } : v));
      setCommentText('');
      loadComments(video.id);
      video.hashtags?.forEach(tag => setUserInterests(prev => ({ ...prev, [tag]: (prev[tag] || 0) + 3 })));
      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: video.user_id, type: 'comment', actor_id: user.id, video_id: video.id, message: `${user.display_name} commented: ${commentText.slice(0, 30)}...` });
      }
    }
  };

  const handleShare = async (video: Video) => {
    await supabase.from('videos').update({ share_count: video.share_count + 1 }).eq('id', video.id);
    setVideos(vs => vs.map(v => v.id === video.id ? { ...v, share_count: v.share_count + 1 } : v));
    const url = `${window.location.origin}/video/${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'VMS Post', text: video.caption, url }); } catch { navigator.clipboard.writeText(url); }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  if (videos.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 8 }}>
          {mode === 'following' ? 'No posts from people you follow' : 'No posts yet'}
        </p>
        {mode === 'following' && (
          <button onClick={() => navigate('/explore')} style={{ padding: '8px 24px', borderRadius: 50, backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', marginTop: 16 }}>
            Explore Users
          </button>
        )}
      </div>
    );
  }

  return (
    // FIX: use exact 100dvh (dynamic viewport — accounts for browser chrome on mobile)
    // overflow-y: scroll + snap-type on the same element for reliable TikTok-style snapping
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        ::-webkit-scrollbar { display: none; }
        .vms-video-slide { scroll-snap-align: start; scroll-snap-stop: always; }
      `}</style>

      {videos.map((video) => (
        <div
          key={video.id}
          className="vms-video-slide"
          onMouseEnter={() => recordView(video.id)}
          style={{
            // FIX: each slide is exactly 100% of the scroll container height
            // This prevents partial slides from bleeding into view
            height: '100%',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            flexShrink: 0,
          }}
        >
          {/* Media */}
          {video.type === 'video' && video.video_url ? (
            <video
              src={video.video_url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loop autoPlay muted playsInline
            />
          ) : video.type === 'image' && video.image_url ? (
            <img src={video.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <p style={{ color: 'white', fontSize: 18, textAlign: 'center', lineHeight: 1.6 }}>{video.caption}</p>
            </div>
          )}

          {/* Gradient overlay for readability */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.2) 100%)',
          }} />

          {/* Right action buttons */}
          <div style={{ position: 'absolute', right: 16, bottom: 120, display: 'flex', flexDirection: 'column', gap: 20, zIndex: 10, alignItems: 'center' }}>
            {/* Avatar */}
            <button onClick={() => navigate(`/profile/${video.user_id}`)} style={{ position: 'relative' }}>
              <img
                src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
                alt=""
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              />
              {/* Follow indicator dot */}
              {!followedUsers.has(video.user_id) && video.user_id !== user?.id && (
                <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#3b82f6', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>+</span>
                </div>
              )}
            </button>

            {/* Like */}
            <button onClick={() => handleLike(video)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Heart
                style={{ width: 32, height: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', color: likedVideos.has(video.id) ? '#ef4444' : 'white' }}
                fill={likedVideos.has(video.id) ? '#ef4444' : 'none'}
              />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{video.like_count}</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => { setShowComments(showComments === video.id ? null : video.id); if (showComments !== video.id) loadComments(video.id); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <MessageCircle style={{ width: 32, height: 32, color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{video.comment_count}</span>
            </button>

            {/* Share */}
            <button onClick={() => handleShare(video)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Share2 style={{ width: 32, height: 32, color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{video.share_count}</span>
            </button>

            {/* Bookmark */}
            <button onClick={() => handleBookmark(video)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Bookmark
                style={{ width: 28, height: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', color: bookmarkedVideos.has(video.id) ? '#f59e0b' : 'white' }}
                fill={bookmarkedVideos.has(video.id) ? '#f59e0b' : 'none'}
              />
            </button>

            {/* Product tag */}
            {video.product_tags && video.product_tags.length > 0 && (
              <button
                onClick={() => { const pid = video.product_tags?.[0]; if (pid) navigate(`/product/${pid}`); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ShoppingBag style={{ width: 30, height: 30, color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>Buy</span>
              </button>
            )}
          </div>

          {/* Bottom text info */}
          <div style={{ position: 'absolute', bottom: 72, left: 16, right: 72, zIndex: 10 }}>
            <button onClick={() => navigate(`/profile/${video.user_id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15, textShadow: '0 1px 4px rgba(0,0,0,0.8)', margin: 0 }}>
                @{video.user?.display_name}
                {(video.user as any)?.is_verified && <span style={{ color: '#60a5fa', marginLeft: 4 }}>✓</span>}
              </p>
            </button>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, margin: '0 0 6px', textShadow: '0 1px 4px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {video.caption}
            </p>
            {video.hashtags && video.hashtags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {video.hashtags.slice(0, 4).map((tag, i) => (
                  <span key={i} style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Comments drawer */}
          {showComments === video.id && (
            <div
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 30 }}
              onClick={() => setShowComments(null)}
            >
              <div
                style={{ width: '100%', borderRadius: '24px 24px 0 0', maxHeight: '75%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{video.comment_count} Comments</p>
                  <button onClick={() => setShowComments(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X style={{ width: 22, height: 22, color: 'var(--text-primary)' }} />
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
                  {comments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>No comments yet. Be the first!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        <img src={c.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div>
                          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, margin: 0 }}>{c.user?.display_name}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '2px 0 0' }}>{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(video); } }}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: 50, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', outline: 'none', fontSize: 14 }}
                  />
                  <button
                    onClick={() => handleComment(video)}
                    style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Send style={{ width: 18, height: 18, color: 'white' }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
