import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video as VideoIcon, Type, X, Upload, Loader } from 'lucide-react';
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
  // FIX 8: removed uploadProgress state — Supabase doesn't emit progress events, was always stuck at 0%
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('Video must be less than 100MB');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, folder: 'videos' | 'images'): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    setUploading(true);

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setUploading(false);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (postType === 'video' && !videoFile) {
      alert('Please select a video file');
      return;
    }

    if (postType === 'image' && !imageFile) {
      alert('Please select an image file');
      return;
    }

    setLoading(true);

    let videoUrl = null;
    let imageUrl = null;

    if (postType === 'video' && videoFile) {
      videoUrl = await uploadFile(videoFile, 'videos');
      if (!videoUrl) {
        alert('Failed to upload video');
        setLoading(false);
        return;
      }
    }

    if (postType === 'image' && imageFile) {
      imageUrl = await uploadFile(imageFile, 'images');
      if (!imageUrl) {
        alert('Failed to upload image');
        setLoading(false);
        return;
      }
    }

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
      alert('Post created successfully!');
      navigate('/');
    } else {
      alert('Error creating post: ' + error.message);
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
            <button type="button" onClick={() => navigate('/status')} className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <Type className="w-6 h-6" />
              <span className="text-sm font-medium">Status</span>
            </button>
            <button type="button" onClick={() => setPostType('image')} className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{ backgroundColor: postType === 'image' ? '#3b82f6' : 'var(--bg-secondary)', color: postType === 'image' ? 'white' : 'var(--text-primary)' }}>
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Image</span>
            </button>
            <button type="button" onClick={() => setPostType('video')} className="p-4 rounded-xl flex flex-col items-center gap-2"
              style={{ backgroundColor: postType === 'video' ? '#3b82f6' : 'var(--bg-secondary)', color: postType === 'video' ? 'white' : 'var(--text-primary)' }}>
              <VideoIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
        </div>

        {postType === 'video' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Video *</label>
            {!videoPreview ? (
              <label className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Upload className="w-12 h-12 mb-2" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Click to upload video</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>MP4, MOV, AVI (max 100MB)</p>
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <video src={videoPreview} className="w-full aspect-video rounded-xl object-cover" controls />
                <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {postType === 'image' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Image *</label>
            {!imagePreview ? (
              <label className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Upload className="w-12 h-12 mb-2" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Click to upload image</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>JPG, PNG, GIF (max 10MB)</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} className="w-full aspect-square rounded-xl object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Caption *</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} required rows={4}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="Write your caption here..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Hashtags</label>
          <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)}
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="#fashion #style #trending" />
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Separate hashtags with spaces</p>
        </div>

        {/* FIX 8: clean spinner instead of broken progress bar */}
        {uploading && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Loader className="w-5 h-5 animate-spin" style={{ color: '#3b82f6' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Uploading file, please wait...</p>
          </div>
        )}

        <button type="submit" disabled={loading || uploading}
          className="w-full py-4 rounded-full font-bold text-lg"
          style={{ backgroundColor: '#3b82f6', color: 'white', opacity: (loading || uploading) ? 0.6 : 1 }}>
          {loading ? 'Creating Post...' : uploading ? 'Uploading...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
