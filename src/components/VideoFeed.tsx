import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ShoppingBag, Send, X } from 'lucide-react';
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
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [userInterests, setUserInterests] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadFollowedUsers();
      loadUserInterests();
    }
  }, [user]);

  useEffect(() => {
    loadVideos();
    if (user) loadUserLikes();
  }, [mode, user, followedUsers, userInterests]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const scrollPosition = e.target.scrollTop;
      const windowHeight = window.innerHeight;
      const newIndex = Math.round(scrollPosition / windowHeight);
      if (newIndex !== currentVideoIndex && newIndex < videos.length) {
        setCurrentVideoIndex(newIndex);
        setShowComments(false);
      }
    };

    const scrollContainer = document.getElementById('video-scroll-container');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [currentVideoIndex, videos.length]);

  const loadUserInterests = async () => {
    if (!user) return;
    const { data: likedPosts } = await supabase.from('likes').select('video_id, videos!inner(hashtags)').eq('user_id', user.id).limit(100);
    const interests: { [key: string]: number } = {};
    likedPosts?.forEach((post: any) => {
      post.videos?.hashtags?.forEach((tag: string) => {
        interests[tag] = (interests[tag] || 0) + 2;
      });
    });
    setUserInterests(interests);
  };

  const loadFollowedUsers = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setFollowedUsers(new Set(data.map(f => f.following_id)));
  };

  const loadVideos = async () => {
    let query = supabase.from('videos').select('*, user:users!videos_user_id_fkey(*)');
    
    if (mode === 'following') {
      if (followedUsers.size > 0) {
        query = query.in('user_id', Array.from(followedUsers));
      } else {
        setVideos([]);
        return;
      }
    }
    
    const { data } = await query.limit(50);
    
    if (data) {
      const now = Date.now();
      const scoredVideos: ScoredVideo[] = (data as Video[]).map(video => {
        const ageInHours = (now - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
        
        // ENGAGEMENT SCORE (40%)
        const engagementScore = ((video.like_count * 2) + (video.comment_count * 3) + (video.share_count * 5) + (video.view_count * 0.1));
        const engagementRate = video.view_count > 0 ? (video.like_count + video.comment_count) / video.view_count : 0;
        
        // PERSONALIZATION SCORE (30%)
        let personalityScore = 0;
        if (mode === 'for-you') {
          video.hashtags?.forEach((tag: string) => {
            personalityScore += userInterests[tag] || 0;
          });
          if (followedUsers.has(video.user_id)) {
            personalityScore += 50;
          }
        }
        
        // FRESHNESS SCORE (20%)
        let freshnessScore = 100;
        if (ageInHours < 2) {
          freshnessScore = 150;
        } else if (ageInHours < 24) {
          freshnessScore = 100 - (ageInHours * 2);
        } else if (ageInHours < 168) {
          freshnessScore = 50 - (ageInHours / 168 * 50);
        } else {
          freshnessScore = Math.max(5, 50 - ageInHours / 168 * 10);
        }
        
        // DIVERSITY SCORE (10%)
        const diversityScore = 100;
        
        // COMBINED SCORE
        const algorithmScore = (engagementScore * engagementRate * 0.4) + (personalityScore * 0.3) + (freshnessScore * 0.2) + (diversityScore * 0.1);
        
        return { ...video, algorithmScore };
      });

      const sortedVideos = mode === 'for-you' 
        ? scoredVideos.sort((a, b) => b.algorithmScore - a.algorithmScore)
        : scoredVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setVideos(sortedVideos);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('video_id').eq('user_id', user.id);
    if (data) setLikedVideos(new Set(data.map(like => like.video_id)));
  };

  const loadComments = async (videoId: string) => {
    const { data } = await supabase.from('comments').select('*, user:users!comments_user_id_fkey(*)').eq('video_id', videoId).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handleLike = async (video: Video) => {
    if (!user) return;
    const isLiked = likedVideos.has(video.id);

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', video.id);
      await supabase.from('videos').update({ like_count: Math.max(0, video.like_count - 1) }).eq('id', video.id);
      setLikedVideos(prev => { const newSet = new Set(prev); newSet.delete(video.id); return newSet; });
      setVideos(videos.map(v => v.id === video.id ? { ...v, like_count: Math.max(0, v.like_count - 1) } : v));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, video_id: video.id });
      await supabase.from('videos').update({ like_count: video.like_count + 1 }).eq('id', video.id);
      setLikedVideos(prev => new Set(prev).add(video.id));
      setVideos(videos.map(v => v.id === video.id ? { ...v, like_count: v.like_count + 1 } : v));
      
      // Update user interests
      video.hashtags?.forEach(tag => {
        setUserInterests(prev => ({ ...prev, [tag]: (prev[tag] || 0) + 2 }));
      });

      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: video.user_id, type: 'like', actor_id: user.id, video_id: video.id, message: `${user.display_name} liked your post` });
      }
    }
  };

  const handleComment = async (video: Video) => {
    if (!user || !commentText.trim()) return;
    const { error } = await supabase.from('comments').insert({ user_id: user.id, video_id: video.id, content: commentText });
    if (!error) {
      await supabase.from('videos').update({ comment_count: video.comment_count + 1 }).eq('id', video.id);
      setVideos(videos.map(v => v.id === video.id ? { ...v, comment_count: v.comment_count + 1 } : v));
      setCommentText('');
      loadComments(video.id);
      
      // Update user interests
      video.hashtags?.forEach(tag => {
        setUserInterests(prev => ({ ...prev, [tag]: (prev[tag] || 0) + 3 }));
      });

      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: video.user_id, type: 'comment', actor_id: user.id, video_id: video.id, message: `${user.display_name} commented: ${commentText.slice(0, 30)}...` });
      }
    }
  };

  const handleShare = async (video: Video) => {
    await supabase.from('videos').update({ share_count: video.share_count + 1 }).eq('id', video.id);
    setVideos(videos.map(v => v.id === video.id ? { ...v, share_count: v.share_count + 1 } : v));

    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `Check out this post by ${video.user?.display_name} on VMS!\n\n${video.caption}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'VMS Post', text: shareText, url: shareUrl });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const currentVideo = videos[currentVideoIndex];

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{mode === 'following' ? 'No posts from people you follow' : 'No posts yet'}</p>
        {mode === 'following' && <button onClick={() => navigate('/explore')} className="px-6 py-2 rounded-full mt-4" style={{ backgroundColor: '#3b82f6', color: 'white' }}>Explore Users</button>}
      </div>
    );
  }

  return (
    <div 
      id="video-scroll-container"
      className="h-full overflow-y-scroll snap-y snap-mandatory" 
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      
      {videos.map((video, index) => (
        <div 
          key={video.id} 
          className="h-screen w-full snap-start snap-always relative flex items-center justify-center" 
          style={{ backgroundColor: '#000' }}
        >
          
          {video.type === 'video' && video.video_url ? (
            <video src={video.video_url} className="w-full h-full object-cover" loop autoPlay muted playsInline />
          ) : video.type === 'image' && video.image_url ? (
            <img src={video.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <p className="text-lg text-center text-white">{video.caption}</p>
            </div>
          )}

          {/* FIXED RIGHT ICONS - ALWAYS VISIBLE */}
          <div className="fixed right-4 bottom-32 flex flex-col gap-6 z-20">
            <button onClick={() => navigate(`/profile/${video.user_id}`)} className="flex flex-col items-center">
              <img src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white" />
            </button>

            <button onClick={() => handleLike(video)} className="flex flex-col items-center gap-1 active:scale-125 transition-transform">
              <Heart className="w-9 h-9" style={{ color: likedVideos.has(video.id) ? '#ef4444' : 'white' }} fill={likedVideos.has(video.id) ? '#ef4444' : 'none'} />
              <span className="text-xs font-bold text-white drop-shadow-lg">{video.like_count}</span>
            </button>

            <button onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(video.id); }} className="flex flex-col items-center gap-1 active:scale-125 transition-transform">
              <MessageCircle className="w-9 h-9 text-white drop-shadow-lg" />
              <span className="text-xs font-bold text-white drop-shadow-lg">{video.comment_count}</span>
            </button>

            <button onClick={() => handleShare(video)} className="flex flex-col items-center gap-1 active:scale-125 transition-transform">
              <Share2 className="w-9 h-9 text-white drop-shadow-lg" />
              <span className="text-xs font-bold text-white drop-shadow-lg">{video.share_count}</span>
            </button>

            {video.product_tags && video.product_tags.length > 0 && (
              <button onClick={() => { const productId = video.product_tags?.[0]; if (productId) navigate(`/product/${productId}`); }} className="flex flex-col items-center gap-1 active:scale-125 transition-transform">
                <ShoppingBag className="w-9 h-9 text-white drop-shadow-lg" />
              </button>
            )}
          </div>

          {/* FIXED BOTTOM INFO - ALWAYS VISIBLE */}
          <div className="fixed bottom-32 left-4 right-24 z-20">
            <p className="font-bold text-white mb-1 drop-shadow-lg">{video.user?.display_name}</p>
            <p className="text-sm text-white mb-2 drop-shadow-lg">{video.caption}</p>
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.hashtags.map((tag, i) => <span key={i} className="text-sm text-white opacity-90 drop-shadow-lg">#{tag}</span>)}
              </div>
            )}
          </div>

          {showComments && currentVideoIndex === index && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end z-40" onClick={() => setShowComments(false)}>
              <div className="w-full rounded-t-3xl max-h-[75vh] flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }} onClick={(e) => e.stopPropagation()}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{video.comment_count} {video.comment_count === 1 ? 'Comment' : 'Comments'}</h3>
                  <button onClick={() => setShowComments(false)}><X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8"><p style={{ color: 'var(--text-secondary)' }}>No comments yet. Be the first!</p></div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3 mb-4">
                        <img src={c.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.user?.display_name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-3 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(video); } }} />
                  <button onClick={() => handleComment(video)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
                    <Send className="w-5 h-5 text-white" />
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