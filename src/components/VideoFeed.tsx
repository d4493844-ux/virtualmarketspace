import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ShoppingBag, MoreVertical, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Video } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VideoFeedProps {
  mode: 'following' | 'for-you';
}

export default function VideoFeed({ mode }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
    if (user) {
      loadUserLikes();
    }
  }, [mode, user]);

  const loadVideos = async () => {
    const query = supabase
      .from('videos')
      .select('*, user:users!videos_user_id_fkey(*)')
      .order('created_at', { ascending: false });

    const { data } = await query;
    if (data) setVideos(data as Video[]);
  };

  const loadUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', user.id);
    
    if (data) {
      setLikedVideos(new Set(data.map(like => like.video_id)));
    }
  };

  const loadComments = async (videoId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users!comments_user_id_fkey(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data);
  };

  const handleLike = async (video: Video) => {
    if (!user) return;

    const isLiked = likedVideos.has(video.id);

    if (isLiked) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', video.id);

      await supabase
        .from('videos')
        .update({ like_count: Math.max(0, video.like_count - 1) })
        .eq('id', video.id);

      setLikedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });

      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, like_count: Math.max(0, v.like_count - 1) }
          : v
      ));
    } else {
      // Like
      await supabase.from('likes').insert({
        user_id: user.id,
        video_id: video.id,
      });

      await supabase
        .from('videos')
        .update({ like_count: video.like_count + 1 })
        .eq('id', video.id);

      setLikedVideos(prev => new Set(prev).add(video.id));

      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, like_count: v.like_count + 1 }
          : v
      ));

      // Create notification
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

  const handleComment = async (video: Video) => {
    if (!user || !commentText.trim()) return;

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      video_id: video.id,
      content: commentText,
    });

    if (!error) {
      await supabase
        .from('videos')
        .update({ comment_count: video.comment_count + 1 })
        .eq('id', video.id);

      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, comment_count: v.comment_count + 1 }
          : v
      ));

      setCommentText('');
      loadComments(video.id);

      // Create notification
      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: video.user_id,
          type: 'comment',
          actor_id: user.id,
          video_id: video.id,
          message: `${user.display_name} commented: ${commentText.slice(0, 30)}...`,
        });
      }
    }
  };

  const handleShare = async (video: Video) => {
    await supabase
      .from('videos')
      .update({ share_count: video.share_count + 1 })
      .eq('id', video.id);

    setVideos(videos.map(v => 
      v.id === video.id 
        ? { ...v, share_count: v.share_count + 1 }
        : v
    ));

    if (navigator.share) {
      navigator.share({
        title: 'Check this out on VMS',
        text: video.caption,
        url: window.location.href,
      });
    }
  };

  const currentVideo = videos[currentIndex];

  if (!currentVideo) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="h-full relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Video Content */}
      <div className="h-full flex items-center justify-center">
        {currentVideo.type === 'video' && currentVideo.video_url ? (
          <video
            src={currentVideo.video_url}
            className="w-full h-full object-cover"
            loop
            autoPlay
            muted
            playsInline
          />
        ) : currentVideo.type === 'image' && currentVideo.image_url ? (
          <img
            src={currentVideo.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8">
            <p className="text-lg text-center" style={{ color: 'var(--text-primary)' }}>
              {currentVideo.caption}
            </p>
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6">
        <button
          onClick={() => navigate(`/profile/${currentVideo.user_id}`)}
          className="flex flex-col items-center"
        >
          <img
            src={currentVideo.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2"
            style={{ borderColor: 'var(--bg-primary)' }}
          />
        </button>

        <button
          onClick={() => handleLike(currentVideo)}
          className="flex flex-col items-center gap-1"
        >
          <Heart
            className="w-8 h-8"
            style={{ color: likedVideos.has(currentVideo.id) ? '#ef4444' : 'white' }}
            fill={likedVideos.has(currentVideo.id) ? '#ef4444' : 'none'}
          />
          <span className="text-xs font-medium text-white">
            {currentVideo.like_count}
          </span>
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) loadComments(currentVideo.id);
          }}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-xs font-medium text-white">
            {currentVideo.comment_count}
          </span>
        </button>

        <button
          onClick={() => handleShare(currentVideo)}
          className="flex flex-col items-center gap-1"
        >
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-xs font-medium text-white">
            {currentVideo.share_count}
          </span>
        </button>

        {currentVideo.product_tags && currentVideo.product_tags.length > 0 && (
          <button className="flex flex-col items-center gap-1">
            <ShoppingBag className="w-8 h-8 text-white" />
          </button>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-24 left-4 right-20">
        <div className="flex items-center gap-2 mb-3">
          <p className="font-bold text-white">{currentVideo.user?.display_name}</p>
        </div>
        <p className="text-sm text-white mb-2">{currentVideo.caption}</p>
        {currentVideo.hashtags && currentVideo.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentVideo.hashtags.map((tag, i) => (
              <span key={i} className="text-sm text-white opacity-80">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl" style={{ backgroundColor: 'var(--bg-primary)', maxHeight: '60vh' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Comments ({currentVideo.comment_count})
            </h3>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '40vh' }}>
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 flex gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <img
                  src={comment.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {comment.user?.display_name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {comment.content}
                  </p>
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleComment(currentVideo);
              }}
            />
            <button
              onClick={() => handleComment(currentVideo)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#3b82f6' }}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 -translate-y-1/2 pointer-events-none">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <span className="text-white text-2xl">←</span>
          </button>
        )}
        <div className="flex-1" />
        {currentIndex < videos.length - 1 && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <span className="text-white text-2xl">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
