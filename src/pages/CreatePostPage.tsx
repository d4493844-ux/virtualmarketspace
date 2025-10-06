import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Video, Type, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreatePostPage() {
  const [postType, setPostType] = useState<'video' | 'image' | 'text'>('text');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const hashtagArray = hashtags
      .split(' ')
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.slice(1));

    const postData: any = {
      user_id: user.id,
      type: postType,
      caption,
      hashtags: hashtagArray,
      product_tags: [],
    };

    if (postType === 'video' && videoUrl) {
      postData.video_url = videoUrl;
      postData.thumbnail_url = thumbnailUrl || null;
    } else if (postType === 'image' && imageUrl) {
      postData.image_url = imageUrl;
    }

    const { error } = await supabase.from('videos').insert(postData);

    setLoading(false);

    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Post</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Post Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPostType('text')}
              className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{
                backgroundColor: postType === 'text' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: postType === 'text' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Type className="w-6 h-6" />
              <span className="text-sm font-medium">Text</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('image')}
              className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{
                backgroundColor: postType === 'image' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: postType === 'image' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Image className="w-6 h-6" />
              <span className="text-sm font-medium">Image</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('video')}
              className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{
                backgroundColor: postType === 'video' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: postType === 'video' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Video className="w-6 h-6" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
        </div>

        {postType === 'video' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Video URL *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                placeholder="https://images.pexels.com/..."
              />
            </div>
          </>
        )}

        {postType === 'image' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Image URL *</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              placeholder="https://images.pexels.com/..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Caption *</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="Write your caption here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="#fashion #style #trend"
          />
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Separate hashtags with spaces</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-full font-bold text-lg"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}
