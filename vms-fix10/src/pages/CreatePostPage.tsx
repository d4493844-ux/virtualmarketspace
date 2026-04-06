import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, Grid, Film, Camera,
  ArrowLeft, Send, Hash, Loader, SwitchCamera, ZoomIn
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── IMAGE FILTERS ────────────────────────────────────────────────────────────
const IMAGE_FILTERS = [
  { name: 'Normal',    css: 'none' },
  { name: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { name: 'Warm',      css: 'sepia(0.4) saturate(1.3) brightness(1.05)' },
  { name: 'Cool',      css: 'hue-rotate(20deg) saturate(1.2) brightness(1.05)' },
  { name: 'Fade',      css: 'brightness(1.1) contrast(0.85) saturate(0.8)' },
  { name: 'Drama',     css: 'contrast(1.4) saturate(1.2) brightness(0.95)' },
  { name: 'Mono',      css: 'grayscale(1) contrast(1.1)' },
  { name: 'Vintage',   css: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(0.8)' },
  { name: 'Bright',    css: 'brightness(1.25) contrast(0.9) saturate(1.1)' },
  { name: 'Matte',     css: 'contrast(0.85) brightness(1.1) saturate(0.9)' },
  { name: 'Golden',    css: 'sepia(0.3) saturate(1.5) brightness(1.1) hue-rotate(-10deg)' },
  { name: 'Noir',      css: 'grayscale(1) contrast(1.5) brightness(0.85)' },
  { name: 'Lush',      css: 'saturate(2) brightness(1.05) contrast(0.95)' },
  { name: 'Dusk',      css: 'hue-rotate(200deg) saturate(1.3) brightness(0.9)' },
  { name: 'Pop',       css: 'saturate(2.2) contrast(1.2) brightness(1.05)' },
  { name: 'Chill',     css: 'hue-rotate(180deg) saturate(0.8) brightness(1.1) contrast(0.95)' },
];

// ── VIDEO FILTERS (applied via overlay blend) ────────────────────────────────
const VIDEO_FILTERS = [
  { name: 'Normal',  css: 'none' },
  { name: 'Vivid',   css: 'saturate(1.7) contrast(1.1)' },
  { name: 'Warm',    css: 'sepia(0.35) saturate(1.4) brightness(1.05)' },
  { name: 'Cool',    css: 'hue-rotate(20deg) saturate(1.2)' },
  { name: 'Drama',   css: 'contrast(1.4) saturate(1.1) brightness(0.92)' },
  { name: 'Mono',    css: 'grayscale(1) contrast(1.15)' },
  { name: 'Fade',    css: 'brightness(1.1) contrast(0.8) saturate(0.75)' },
  { name: 'Vintage', css: 'sepia(0.55) contrast(1.1) brightness(0.9)' },
  { name: 'Bright',  css: 'brightness(1.2) contrast(0.9)' },
  { name: 'Golden',  css: 'sepia(0.25) saturate(1.6) brightness(1.1)' },
];

type Step = 'gallery' | 'filter' | 'caption';
type MediaType = 'image' | 'video';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]             = useState<Step>('gallery');
  const [mediaType, setMediaType]   = useState<MediaType>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [filter, setFilter]         = useState(IMAGE_FILTERS[0]);
  const [caption, setCaption]       = useState('');
  const [hashtags, setHashtags]     = useState('');
  const [uploading, setUploading]   = useState(false);
  const [posting, setPosting]       = useState(false);
  const [galleryTab, setGalleryTab] = useState<'all' | 'photo' | 'video'>('all');

  // Gallery items loaded from device via input[multiple]
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<{ url: string; type: MediaType; file: File }[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Canvas for applying filter to image before upload
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load gallery on mount — trigger the hidden file input
  useEffect(() => {
    // Small delay so the page renders first
    const t = setTimeout(() => galleryInputRef.current?.click(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleGalleryLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const items: { url: string; type: MediaType; file: File }[] = [];
    files.forEach(file => {
      const type: MediaType = file.type.startsWith('video') ? 'video' : 'image';
      items.push({ url: URL.createObjectURL(file), type, file });
    });
    setGalleryPreviews(items);
    setGalleryFiles(files);

    // Auto-select first item
    if (items[0]) selectMedia(items[0].file, items[0].url, items[0].type);
  };

  const selectMedia = (file: File, url: string, type: MediaType) => {
    setSelectedFile(file);
    setPreview(url);
    setMediaType(type);
    // Reset filter to match media type
    setFilter(type === 'image' ? IMAGE_FILTERS[0] : VIDEO_FILTERS[0]);
  };

  const goToFilter = () => {
    if (!selectedFile) { alert('Pick a photo or video first'); return; }
    setStep('filter');
  };

  // ── Apply CSS filter to image via canvas, return filtered Blob ─────────────
  const applyFilterToImage = async (imgUrl: string, filterCss: string): Promise<Blob | null> => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        // Apply filter via ctx
        ctx.filter = filterCss === 'none' ? 'none' : filterCss;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
      };
      img.onerror = () => resolve(null);
      img.src = imgUrl;
    });
  };

  // ── Upload via direct fetch (works for demo/anon users) ──────────────────
  const uploadFile = async (blob: Blob, ext: string, folder: string): Promise<string | null> => {
    if (!user) return null;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const fileName    = `${user.id}/${Date.now()}.${ext}`;
    const path        = `${folder}/${fileName}`;

    const res = await fetch(`${supabaseUrl}/storage/v1/object/media/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': blob.type || 'application/octet-stream',
      },
      body: blob,
    });

    if (!res.ok) { console.error('Upload failed:', await res.text()); return null; }
    return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  };

  // ── Final post submission ─────────────────────────────────────────────────
  const handlePost = async () => {
    if (!user || !selectedFile || !preview) return;
    setPosting(true);
    setUploading(true);

    let mediaUrl: string | null = null;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');

    if (mediaType === 'image') {
      // Apply CSS filter to image via canvas
      const filtered = filter.css !== 'none'
        ? await applyFilterToImage(preview, filter.css)
        : selectedFile;

      if (filtered) {
        mediaUrl = await uploadFile(filtered instanceof Blob ? filtered : selectedFile, ext, 'images');
      }
    } else {
      // Video — upload as-is (filter shown as preview only, actual filter on video needs server-side processing)
      mediaUrl = await uploadFile(selectedFile, ext, 'videos');
    }

    setUploading(false);

    if (!mediaUrl) {
      alert('Upload failed. Check your connection and try again.');
      setPosting(false);
      return;
    }

    const hashtagArray = hashtags
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(t => t.length > 0);

    const { error } = await supabase.from('videos').insert({
      user_id:       user.id,
      type:          mediaType,
      caption:       caption.trim() || ' ',
      hashtags:      hashtagArray,
      product_tags:  [],
      like_count:    0,
      comment_count: 0,
      share_count:   0,
      view_count:    0,
      ...(mediaType === 'image' ? { image_url: mediaUrl } : { video_url: mediaUrl }),
    });

    setPosting(false);

    if (!error) {
      navigate('/');
    } else {
      alert('Error posting: ' + error.message);
    }
  };

  const filters = mediaType === 'image' ? IMAGE_FILTERS : VIDEO_FILTERS;
  const filteredGallery = galleryPreviews.filter(item =>
    galleryTab === 'all' ? true :
    galleryTab === 'photo' ? item.type === 'image' : item.type === 'video'
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — GALLERY
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'gallery') {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', overflowY: 'hidden' }}>

        {/* Hidden input that loads ALL gallery files at once */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleGalleryLoad}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#111', flexShrink: 0 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 26, height: 26, color: 'white' }} />
          </button>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>New Post</p>
          <button onClick={goToFilter}
            disabled={!selectedFile}
            style={{ color: selectedFile ? '#3b82f6' : '#444', fontWeight: 700, fontSize: 15, background: 'none', border: 'none', cursor: selectedFile ? 'pointer' : 'not-allowed' }}>
            Next
          </button>
        </div>

        {/* Selected preview */}
        <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#000', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
          {preview ? (
            mediaType === 'image' ? (
              <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css }} />
            ) : (
              <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css }}
                autoPlay muted loop playsInline />
            )
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Grid style={{ width: 48, height: 48, color: '#444' }} />
              <p style={{ color: '#666', fontSize: 14 }}>Tap to load your gallery</p>
              <button onClick={() => galleryInputRef.current?.click()}
                style={{ padding: '10px 24px', borderRadius: 50, backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Open Gallery
              </button>
            </div>
          )}

          {/* Media type badge */}
          {selectedFile && (
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                {mediaType === 'video' ? '🎬 Video' : '🖼️ Photo'}
              </span>
              {filter.name !== 'Normal' && (
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(59,130,246,0.8)', color: 'white' }}>
                  {filter.name}
                </span>
              )}
            </div>
          )}

          {/* Re-open gallery */}
          {preview && (
            <button onClick={() => galleryInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Grid style={{ width: 18, height: 18, color: 'white' }} />
            </button>
          )}
        </div>

        {/* Gallery tabs */}
        <div style={{ display: 'flex', backgroundColor: '#111', flexShrink: 0 }}>
          {[{k:'all',l:'All'},{k:'photo',l:'Photos'},{k:'video',l:'Videos'}].map(({k,l}) => (
            <button key={k} onClick={() => setGalleryTab(k as any)}
              style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                color: galleryTab === k ? '#3b82f6' : '#666',
                borderBottom: galleryTab === k ? '2px solid #3b82f6' : '2px solid transparent' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {galleryPreviews.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <p style={{ color: '#666', fontSize: 14 }}>No photos loaded yet</p>
              <button onClick={() => galleryInputRef.current?.click()}
                style={{ padding: '10px 24px', borderRadius: 50, backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Load Gallery
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
              {filteredGallery.map((item, i) => (
                <div key={i}
                  onClick={() => selectMedia(item.file, item.url, item.type)}
                  style={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden',
                    outline: preview === item.url ? '3px solid #3b82f6' : 'none',
                    outlineOffset: '-3px' }}>
                  {item.type === 'image' ? (
                    <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      <div style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 5px' }}>
                        <Film style={{ width: 10, height: 10, color: 'white' }} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — FILTERS
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'filter') {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#111', flexShrink: 0 }}>
          <button onClick={() => setStep('gallery')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft style={{ width: 24, height: 24, color: 'white' }} />
          </button>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {mediaType === 'image' ? 'Edit Photo' : 'Edit Video'}
          </p>
          <button onClick={() => setStep('caption')}
            style={{ color: '#3b82f6', fontWeight: 700, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer' }}>
            Next
          </button>
        </div>

        {/* Preview with filter */}
        <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#000', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
          {mediaType === 'image' ? (
            <img src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css, transition: 'filter 0.25s ease' }} />
          ) : (
            <video src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css, transition: 'filter 0.25s ease' }}
              autoPlay muted loop playsInline />
          )}
          {/* Filter name overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
              {filter.name}
            </span>
          </div>
        </div>

        {/* Filter strip */}
        <div style={{ flexShrink: 0, padding: '16px 0 8px', backgroundColor: '#111' }}>
          <p style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 16px' }}>
            Filters
          </p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {filters.map(f => (
              <button key={f.name} onClick={() => setFilter(f)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                {/* Filter thumbnail */}
                <div style={{
                  width: 72, height: 72, borderRadius: 10, overflow: 'hidden',
                  outline: filter.name === f.name ? '3px solid #3b82f6' : '2px solid transparent',
                  outlineOffset: '2px', transition: 'outline 0.15s',
                }}>
                  {mediaType === 'image' ? (
                    <img src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} />
                  ) : (
                    <video src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} muted />
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: filter.name === f.name ? 700 : 400, color: filter.name === f.name ? '#3b82f6' : '#888' }}>
                  {f.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments info */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #222', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          <p style={{ color: '#555', fontSize: 12, margin: 0, textAlign: 'center' }}>
            {mediaType === 'image' ? '✨ Filter will be baked into the image on upload' : '🎬 Filter previewed — tap Next to add caption'}
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — CAPTION
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', flexShrink: 0 }}>
        <button onClick={() => setStep('filter')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft style={{ width: 24, height: 24, color: 'var(--text-primary)' }} />
        </button>
        <p style={{ fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>New Post</p>
        <button onClick={handlePost} disabled={posting}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 50, backgroundColor: posting ? '#1e40af' : '#3b82f6', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: posting ? 'not-allowed' : 'pointer' }}>
          {posting ? <Loader style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
          {uploading ? 'Uploading…' : posting ? 'Posting…' : 'Share'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Preview thumbnail + caption row */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 16px 8px', alignItems: 'flex-start' }}>
          <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {mediaType === 'image' ? (
              <img src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css }} />
            ) : (
              <video src={preview!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css }} muted />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              autoFocus
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption…"
              maxLength={2200}
              rows={4}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, textAlign: 'right' }}>{caption.length}/2200</p>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 16px' }} />

        {/* Hashtags */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="Add hashtags (e.g. #fashion #lagos)"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 16px' }} />

        {/* Filter applied */}
        {filter.name !== 'Normal' && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filter applied:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{filter.name}</span>
            <button onClick={() => setStep('filter')}
              style={{ marginLeft: 'auto', fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
              Change
            </button>
          </div>
        )}

        <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 16px' }} />

        {/* Advanced options hint */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>Tag Products</p>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '3px 10px', borderRadius: 20 }}>Coming Soon</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>Location</p>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '3px 10px', borderRadius: 20 }}>Coming Soon</span>
          </div>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div style={{ margin: '0 16px', padding: '14px', borderRadius: 16, backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader style={{ width: 20, height: 20, color: '#3b82f6', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Uploading your {mediaType}…</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Please keep this screen open</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
