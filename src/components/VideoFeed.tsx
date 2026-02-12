import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, ShoppingBag, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Video } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VideoFeedProps {
  mode: 'following' | 'for-you';
}

export default function VideoFeed({ mode }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadFollowedUsers();
    }
  }, [user]);

  useEffect(() => {
    loadVideos();
    if (user) loadUserLikes();
  }, [mode, user, followedUsers]);

  const loadFollowedUsers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    if (data) {
      setFollowedUsers(new Set(data.map(f => f.following_id)));
    }
  };

  const loadVideos = async () => {
    let query = supabase
      .from('videos')
      .select('*, user:users!videos_user_id_fkey(*)');

    // ALGORITHM: Filter by mode
    if (mode === 'following' && followedUsers.size > 0) {
      // Show only videos from users you follow
      query = query.in('user_id', Array.from(followedUsers));
    }
    // For "for-you" mode, show all videos with smart sorting

    // ALGORITHM: Sort by engagement score
    const { data } = await query;
    
    if (data) {
      const scoredVideos = (data as Video[]).map(video => {
        // Calculate engagement score
        const ageInHours = (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
        const engagementScore = (
          (video.like_count * 2) + 
          (video.comment_count * 3) + 
          (video.share_count * 5) + 
          (video.view_count * 0.1)
        ) / Math.max(ageInHours, 1); // Decay over time

        return { ...video, engagementScore };
      });

      // Sort by engagement score for "for-you", chronological for "following"
      const sortedVideos = mode === 'for-you' 
        ? scoredVideos.sort((a, b) => b.engagementScore - a.engagementScore)
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
    const { data } = await supabase
      .from('comments')
      .select('*, user:users!comments_user_id_fkey(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handleLike = async (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
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
      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: video.user_id, type: 'like', actor_id: user.id, video_id: video.id,
          message: `${user.display_name} liked your post`,
        });
      }
    }
  };

  const handleComment = async (video: Video) => {
    if (!user || !commentText.trim()) return;
    const { error } = await supabase.from('comments').insert({
      user_id: user.id, video_id: video.id, content: commentText,
    });
    if (!error) {
      await supabase.from('videos').update({ comment_count: video.comment_count + 1 }).eq('id', video.id);
      setVideos(videos.map(v => v.id === video.id ? { ...v, comment_count: v.comment_count + 1 } : v));
      setCommentText('');
      loadComments(video.id);
      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: video.user_id, type: 'comment', actor_id: user.id, video_id: video.id,
          message: `${user.display_name} commented: ${commentText.slice(0, 30)}...`,
        });
      }
    }
  };

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {mode === 'following' ? 'No posts from people you follow' : 'No posts yet'}
        </p>
        {mode === 'following' && (
          <button onClick={() => navigate('/explore')} className="px-6 py-2 rounded-full mt-4" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
            Explore Users
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        scrollBehavior: 'smooth'
      }}
    >
      <style>{`
        .snap-container::-webkit-scrollbar { display: none; }
        .video-item { scroll-snap-align: start; scroll-snap-stop: always; }
      `}</style>
      
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="video-item h-full w-full relative flex items-center justify-center" 
          style={{ backgroundColor: '#000', minHeight: '100vh' }}
        >
          
          {/* Video/Image */}
          {video.type === 'video' && video.video_url ? (
            <video src={video.video_url} className="w-full h-full object-cover" loop autoPlay muted playsInline />
          ) : video.type === 'image' && video.image_url ? (
            <img src={video.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <p className="text-lg text-center text-white">{video.caption}</p>
            </div>
          )}

          {/* Right Actions */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${video.user_id}`); }} 
              className="flex flex-col items-center"
            >
              <img 
                src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white" 
              />
            </button>

            <button 
              onClick={(e) => handleLike(video, e)} 
              className="flex flex-col items-center gap-1"
            >
              <Heart 
                className="w-8 h-8" 
                style={{ color: likedVideos.has(video.id) ? '#ef4444' : 'white' }} 
                fill={likedVideos.has(video.id) ? '#ef4444' : 'none'} 
              />
              <span className="text-xs font-medium text-white">{video.like_count}</span>
            </button>

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowComments(showComments === video.id ? null : video.id); 
                if (showComments !== video.id) loadComments(video.id); 
              }} 
              className="flex flex-col items-center gap-1"
            >
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-white">{video.comment_count}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-white">{video.share_count}</span>
            </button>

            {video.product_tags && video.product_tags.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); }} className="flex flex-col items-center gap-1">
                <ShoppingBag className="w-8 h-8 text-white" />
              </button>
            )}
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-24 left-4 right-20 z-10">
            <p className="font-bold text-white mb-1">{video.user?.display_name}</p>
            <p className="text-sm text-white mb-2">{video.caption}</p>
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.hashtags.map((tag, i) => <span key={i} className="text-sm text-white opacity-80">#{tag}</span>)}
              </div>
            )}
          </div>

          {/* Comments Modal */}
          {showComments === video.id && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 flex items-end z-30"
              onClick={(e) => { e.stopPropagation(); setShowComments(null); }}
            >
              <div 
                className="w-full rounded-t-3xl max-h-[70vh] flex flex-col" 
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Comments ({video.comment_count})</h3>
                  <button onClick={() => setShowComments(null)}><X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 mb-4">
                      <img src={c.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.user?.display_name}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <input 
                    type="text" 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="Add a comment..." 
                    className="flex-1 px-4 py-2 rounded-full" 
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(video); } }} 
                  />
                  <button onClick={() => handleComment(video)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
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