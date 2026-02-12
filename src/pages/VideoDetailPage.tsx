import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { supabase, type Video } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function VideoDetailPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      loadVideo();
      loadComments();
      checkIfLiked();
    }
  }, [videoId]);

  const loadVideo = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*, user:users!videos_user_id_fkey(*)')
      .eq('id', videoId)
      .single();

    if (data) {
      setVideo(data as Video);
      
      // Increment view count
      await supabase
        .from('videos')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', videoId);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users!comments_user_id_fkey(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (data) setComments(data);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user || !video) return;

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', video.id);

      await supabase
        .from('videos')
        .update({ like_count: Math.max(0, video.like_count - 1) })
        .eq('id', video.id);

      setIsLiked(false);
      setVideo({ ...video, like_count: Math.max(0, video.like_count - 1) });
    } else {
      await supabase.from('likes').insert({
        user_id: user.id,
        video_id: video.id,
      });

      await supabase
        .from('videos')
        .update({ like_count: video.like_count + 1 })
        .eq('id', video.id);

      setIsLiked(true);
      setVideo({ ...video, like_count: video.like_count + 1 });

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

  const handleComment = async () => {
    if (!user || !commentText.trim() || !video) return;

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

      setVideo({ ...video, comment_count: video.comment_count + 1 });
      setCommentText('');
      loadComments();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Post not found</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 rounded-full" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Post</h1>
      </div>

      {/* Video/Image Content */}
      <div className="w-full aspect-[9/16] bg-black">
        {video.type === 'video' && video.video_url ? (
          <video src={video.video_url} className="w-full h-full object-contain" controls autoPlay loop />
        ) : video.type === 'image' && video.image_url ? (
          <img src={video.image_url} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8">
            <p className="text-lg text-center text-white">{video.caption}</p>
          </div>
        )}
      </div>

      {/* Post Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
            alt=""
            onClick={() => navigate(`/profile/${video.user_id}`)}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
          />
          <div className="flex-1">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{video.user?.display_name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="mb-3" style={{ color: 'var(--text-primary)' }}>{video.caption}</p>

        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {video.hashtags.map((tag, i) => (
              <span key={i} className="text-sm" style={{ color: '#3b82f6' }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 py-3" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={handleLike} className="flex items-center gap-2">
            <Heart className="w-6 h-6" style={{ color: isLiked ? '#ef4444' : 'var(--text-primary)' }} fill={isLiked ? '#ef4444' : 'none'} />
            <span style={{ color: 'var(--text-primary)' }}>{video.like_count}</span>
          </button>

          <button className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>{video.comment_count}</span>
          </button>

          <button className="flex items-center gap-2">
            <Share2 className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>{video.share_count}</span>
          </button>
        </div>

        {/* Comments */}
        <div className="mt-4">
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Comments ({video.comment_count})</h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 rounded-full"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleComment();
              }}
            />
            <button onClick={handleComment} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{comment.user?.display_name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
