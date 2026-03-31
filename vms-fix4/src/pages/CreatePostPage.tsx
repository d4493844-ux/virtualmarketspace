import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video as VideoIcon, Type, X, Upload, Loader, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreatePostPage() {
  const [postType, setPostType] = useState<'video' | 'image' | 'text'>('text');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { alert('Video must be less than 100MB'); return; }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, folder: 'videos' | 'images'): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    setUploading(true);

    try {
      // Use fetch directly with the anon key so demo users (no auth session) can upload
      // This bypasses the broken refresh token issue from demo login
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filePath}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: file,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Upload failed:', response.status, errText);
        setUploading(false);
        return null;
      }

      setUploading(false);

      // Build public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filePath}`;
      return publicUrl;

    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (postType === 'video' && !videoFile) { alert('Please select a video file'); return; }
    if (postType === 'image' && !imageFile) { alert('Please select an image file'); return; }

    setLoading(true);

    let videoUrl = null;
    let imageUrl = null;

    if (postType === 'video' && videoFile) {
      videoUrl = await uploadFile(videoFile, 'videos');
      if (!videoUrl) { alert('Failed to upload video. Please check your internet and try again.'); setLoading(false); return; }
    }

    if (postType === 'image' && imageFile) {
      imageUrl = await uploadFile(imageFile, 'images');
      if (!imageUrl) { alert('Failed to upload image. Please check your internet and try again.'); setLoading(false); return; }
    }

    // Parse hashtags — support both #tag format and plain words
    const hashtagArray = hashtags
      .split(/[\s,]+/)
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);

    const postData: any = {
      user_id: user.id,
      type: postType,
      caption,
      hashtags: hashtagArray,
      product_tags: [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_count: 0,
    };

    if (postType === 'video') {
      postData.video_url = videoUrl;
      postData.thumbnail_url = null;
    } else if (postType === 'image') {
      postData.image_url = imageUrl;
    }

    const { error } = await supabase.from('videos').insert(postData);

    setLoading(false);

    if (!error) {
      alert('Post created successfully! 🎉');
      navigate('/');
    } else {
      console.error('Post insert error:', error);
      alert('Error creating post: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Post</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">

        {/* Post Type */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Post Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'text', label: 'Text', Icon: Type },
              { type: 'image', label: 'Image', Icon: ImageIcon },
              { type: 'video', label: 'Video', Icon: VideoIcon },
            ].map(({ type, label, Icon }) => (
              <button key={type} type="button" onClick={() => setPostType(type as any)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{
                  backgroundColor: postType === type ? '#3b82f6' : 'var(--bg-secondary)',
                  color: postType === type ? 'white' : 'var(--text-primary)',
                }}>
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Upload */}
        {postType === 'video' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Video *</label>
            {!videoPreview ? (
              <label className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Upload className="w-12 h-12 mb-2" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Tap to upload video</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>MP4, MOV, AVI · Max 100MB</p>
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <video src={videoPreview} className="w-full aspect-video rounded-xl object-cover" controls />
                <button type="button"
                  onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Image Upload */}
        {postType === 'image' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Image *</label>
            {!imagePreview ? (
              <label className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Upload className="w-12 h-12 mb-2" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Tap to upload image</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>JPG, PNG, GIF · Max 10MB</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} className="w-full aspect-square rounded-xl object-cover" />
                <button type="button"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Caption *</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} required rows={4}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="Write your caption here..." />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
            <Hash className="w-4 h-4" /> Hashtags
          </label>
          <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)}
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="#fashion #style #trending" />
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            Separate with spaces. With or without # symbol.
          </p>
        </div>

        {/* Upload spinner */}
        {uploading && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Loader className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: '#3b82f6' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Uploading file…</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Please keep this page open</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading || uploading}
          className="w-full py-4 rounded-full font-bold text-lg"
          style={{ backgroundColor: '#3b82f6', color: 'white', opacity: (loading || uploading) ? 0.6 : 1 }}>
          {loading ? 'Creating Post…' : uploading ? 'Uploading…' : 'Create Post'}
        </button>

      </form>
    </div>
  );
}
