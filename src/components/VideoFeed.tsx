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
  engagementScore: number;
  personalityScore: number;
  freshnessScore: number;
  diversityScore: number;
}

export default function VideoFeed({ mode }: VideoFeedProps) {
  const [videos, setVideos] = useState<ScoredVideo[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [userInterests, setUserInterests] = useState<{ [key: string]: number }>({});
  const [videoStartTime, setVideoStartTime] = useState<{ [key: string]: number }>({});
  const [seenCategories, setSeenCategories] = useState<string[]>([]);
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

  // 📊 TRACK USER INTERESTS from their activity
  const loadUserInterests = async () => {
    if (!user) return;
    
    // Get videos user liked, commented on, watched fully
    const { data: likedPosts } = await supabase
      .from('likes')
      .select('video_id, videos!inner(hashtags)')
      .eq('user_id', user.id)
      .limit(100);

    const { data: commented } = await supabase
      .from('comments')
      .select('video_id, videos!inner(hashtags)')
      .eq('user_id', user.id)
      .limit(50);

    // Build interest map from hashtags
    const interests: { [key: string]: number } = {};
    
    likedPosts?.forEach((post: any) => {
      post.videos?.hashtags?.forEach((tag: string) => {
        interests[tag] = (interests[tag] || 0) + 2; // Likes = 2 points
      });
    });

    commented?.forEach((post: any) => {
      post.videos?.hashtags?.forEach((tag: string) => {
        interests[tag] = (interests[tag] || 0) + 3; // Comments = 3 points
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

    // FOLLOWING MODE: Show only followed users + recent
    if (mode === 'following') {
      if (followedUsers.size > 0) {
        query = query.in('user_id', Array.from(followedUsers));
      } else {
        setVideos([]);
        return;
      }
    }

    const { data } = await query.limit(100); // Get more for better ranking
    
    if (data) {
      const now = Date.now();
      
      const scoredVideos: ScoredVideo[] = (data as Video[]).map((video, index) => {
        const ageInHours = (now - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
        
        // 1️⃣ ENGAGEMENT SCORE (40% weight)
        const engagementScore = (
          (video.like_count * 1) +
          (video.comment_count * 3) +
          (video.share_count * 5) +
          (video.view_count * 0.05)
        );
        const engagementRate = video.view_count > 0 
          ? (video.like_count + video.comment_count + video.share_count) / video.view_count 
          : 0;

        // 2️⃣ PERSONALIZATION SCORE (30% weight)
        let personalityScore = 0;
        if (mode === 'for-you' && Object.keys(userInterests).length > 0) {
          video.hashtags?.forEach((tag: string) => {
            personalityScore += userInterests[tag] || 0;
          });
          // Boost if from creator user follows
          if (followedUsers.has(video.user_id)) {
            personalityScore += 50;
          }
        }

        // 3️⃣ FRESHNESS SCORE (20% weight) - Time decay with boost for new content
        let freshnessScore = 100;
        if (ageInHours < 2) {
          freshnessScore = 150; // Boost very new content
        } else if (ageInHours < 24) {
          freshnessScore = 100 - (ageInHours * 2);
        } else if (ageInHours < 168) { // < 1 week
          freshnessScore = 50 - (ageInHours / 168 * 50);
        } else {
          freshnessScore = Math.max(5, 50 - ageInHours / 168 * 10);
        }

        // 4️⃣ DIVERSITY SCORE (10% weight) - Avoid showing same categories
        let diversityScore = 100;
        const videoCategory = video.hashtags?.[0] || 'uncategorized';
        const categoryRecentlySeen = seenCategories.slice(-10).filter(c => c === videoCategory).length;
        diversityScore = Math.max(20, 100 - (categoryRecentlySeen * 30));

        // 🎯 COMBINED ALGORITHM SCORE
        const algorithmScore = (
          (engagementScore * engagementRate * 0.4) +
          (personalityScore * 0.3) +
          (freshnessScore * 0.2) +
          (diversityScore * 0.1)
        );

        return {
          ...video,
          algorithmScore,
          engagementScore,
          personalityScore,
          freshnessScore,
          diversityScore,
        };
      });

      // SORT by algorithm score
      let sortedVideos = mode === 'for-you'
        ? scoredVideos.sort((a, b) => b.algorithmScore - a.algorithmScore)
        : scoredVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 🎲 INJECT RANDOMNESS (10%) - Prevent echo chamber
      if (mode === 'for-you' && sortedVideos.length > 10) {
        const top90Percent = sortedVideos.slice(0, Math.floor(sortedVideos.length * 0.9));
        const bottom10Percent = sortedVideos.slice(Math.floor(sortedVideos.length * 0.9));
        
        // Randomly inject 1-2 low-scoring videos in top 20
        if (bottom10Percent.length > 0) {
          const randomVideo = bottom10Percent[Math.floor(Math.random() * bottom10Percent.length)];
          const randomPosition = Math.floor(Math.random() * 20);
          top90Percent.splice(randomPosition, 0, randomVideo);
        }
        
        sortedVideos = top90Percent;
      }

      // 📈 DIVERSITY INJECTION - Ensure variety every 5 videos
      const finalVideos: ScoredVideo[] = [];
      const usedCategories = new Set<string>();
      
      sortedVideos.forEach((video, idx) => {
        const category = video.hashtags?.[0] || 'uncategorized';
        
        // Every 5th video, try to show different category
        if (idx > 0 && idx % 5 === 0 && usedCategories.has(category)) {
          const differentVideo = sortedVideos.find(v => {
            const vCat = v.hashtags?.[0] || 'uncategorized';
            return !usedCategories.has(vCat) && !finalVideos.includes(v);
          });
          
          if (differentVideo) {
            finalVideos.push(differentVideo);
            usedCategories.add(differentVideo.hashtags?.[0] || 'uncategorized');
            return;
          }
        }
        
        finalVideos.push(video);
        usedCategories.add(category);
      });

      setVideos(finalVideos.slice(0, 50)); // Limit to 50 for performance
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

  // 📹 TRACK VIDEO VIEW TIME (for future personalization)
  const trackVideoView = async (videoId: string, watchTime: number, totalDuration: number) => {
    if (!user) return;
    
    const completionRate = totalDuration > 0 ? watchTime / totalDuration : 0;
    
    // Track view with completion rate
    await supabase.from('video_views').upsert({
      user_id: user.id,
      video_id: videoId,
      watch_time: watchTime,
      completion_rate: completionRate,
      viewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' });

    // Update video view count
    const video = videos.find(v => v.id === videoId);
    if (video) {
      await supabase.from('videos').update({ view_count: video.view_count + 1 }).eq('id', videoId);
    }

    // Track category
    const viewedVideo = videos.find(v => v.id === videoId);
    if (viewedVideo?.hashtags?.[0]) {
      setSeenCategories(prev => [...prev, viewedVideo.hashtags[0]]);
    }
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
      
      // 🎯 UPDATE USER INTERESTS when they like
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
      
      // 🎯 UPDATE USER INTERESTS when they comment
      video.hashtags?.forEach(tag => {
        setUserInterests(prev => ({ ...prev, [tag]: (prev[tag] || 0) + 3 }));
      });

      if (video.user_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: video.user_id, type: 'comment', actor_id: user.id, video_id: video.id, message: `${user.display_name} commented: ${commentText.slice(0, 30)}...` });
      }
    }
  };

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{mode === 'following' ? 'No posts from people you follow' : 'No posts yet'}</p>
        {mode === 'following' && <button onClick={() => navigate('/explore')} className="px-6 py-2 rounded-full mt-4" style={{ backgroundColor: '#3b82f6', color: 'white' }}>Explore Users</button>}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="min-h-screen w-full relative flex items-center justify-center" 
          style={{ backgroundColor: '#000' }}
          onMouseEnter={() => setVideoStartTime(prev => ({ ...prev, [video.id]: Date.now() }))}
          onMouseLeave={() => {
            if (videoStartTime[video.id]) {
              const watchTime = (Date.now() - videoStartTime[video.id]) / 1000;
              if (watchTime > 1) { // Only track if watched > 1 second
                trackVideoView(video.id, watchTime, 30); // Assume 30s average video
              }
            }
          }}
        >
          
          {video.type === 'video' && video.video_url ? (
            <video src={video.video_url} className="w-full h-screen object-cover" loop autoPlay muted playsInline />
          ) : video.type === 'image' && video.image_url ? (
            <img src={video.image_url} alt="" className="w-full h-screen object-cover" />
          ) : (
            <div className="w-full h-screen flex items-center justify-center p-8">
              <p className="text-lg text-center text-white">{video.caption}</p>
            </div>
          )}

          <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/profile/${video.user_id}`); }} className="flex flex-col items-center">
              <img src={video.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white" />
            </button>

            <button onClick={(e) => handleLike(video, e)} className="flex flex-col items-center gap-1">
              <Heart className="w-8 h-8" style={{ color: likedVideos.has(video.id) ? '#ef4444' : 'white' }} fill={likedVideos.has(video.id) ? '#ef4444' : 'none'} />
              <span className="text-xs font-medium text-white">{video.like_count}</span>
            </button>

            <button onClick={(e) => { e.stopPropagation(); setShowComments(showComments === video.id ? null : video.id); if (showComments !== video.id) loadComments(video.id); }} className="flex flex-col items-center gap-1">
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-white">{video.comment_count}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-white">{video.share_count}</span>
            </button>

            {video.product_tags && video.product_tags.length > 0 && (
              <button className="flex flex-col items-center gap-1"><ShoppingBag className="w-8 h-8 text-white" /></button>
            )}
          </div>

          <div className="absolute bottom-24 left-4 right-20 z-10">
            <p className="font-bold text-white mb-1">{video.user?.display_name}</p>
            <p className="text-sm text-white mb-2">{video.caption}</p>
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.hashtags.map((tag, i) => <span key={i} className="text-sm text-white opacity-80">#{tag}</span>)}
              </div>
            )}
          </div>

          {showComments === video.id && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end z-30" onClick={() => setShowComments(null)}>
              <div className="w-full rounded-t-3xl max-h-[70vh] flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }} onClick={(e) => e.stopPropagation()}>
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
                <div className="p-4 flex gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(video); } }} />
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