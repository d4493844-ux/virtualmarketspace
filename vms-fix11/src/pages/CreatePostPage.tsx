/**
 * VMS Creator Studio
 * 
 * Layout (exactly like Instagram):
 * - Header bar (X | "New Post" | "Next →")
 * - Selected media preview (square, ~40vh) — with filter applied live
 * - Tabs: RECENTS | CAMERA | TEXT
 * - Gallery grid scrolls UP from underneath the preview — it's one scrollable column
 * 
 * Camera tab:
 * - Full live camera feed with real-time filter overlay
 * - Tap = photo, hold = video recording
 * - Front/back camera switch
 * - Flash toggle
 * - 16 real-time CSS filters + TikTok-style beauty/effect modes
 * 
 * Text tab:
 * - Full-screen status/text post with colour backgrounds
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, Film, Zap, ZapOff,
  ArrowLeft, Send, Hash, Loader, RefreshCw, Circle,
  Type, ImageIcon, Video, Sparkles, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── FILTERS ────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'normal',   name: 'Normal',   css: 'none',                                                           preview: 'none' },
  { id: 'vivid',    name: 'Vivid',    css: 'saturate(1.9) contrast(1.12)',                                    preview: 'saturate(1.9) contrast(1.12)' },
  { id: 'warm',     name: 'Warm',     css: 'sepia(0.4) saturate(1.5) brightness(1.08) hue-rotate(-10deg)',   preview: 'sepia(0.4) saturate(1.5) brightness(1.08) hue-rotate(-10deg)' },
  { id: 'cool',     name: 'Cool',     css: 'hue-rotate(20deg) saturate(1.2) brightness(1.06)',               preview: 'hue-rotate(20deg) saturate(1.2) brightness(1.06)' },
  { id: 'golden',   name: 'Golden',   css: 'sepia(0.28) saturate(1.7) brightness(1.12) hue-rotate(-15deg)',  preview: 'sepia(0.28) saturate(1.7) brightness(1.12) hue-rotate(-15deg)' },
  { id: 'drama',    name: 'Drama',    css: 'contrast(1.5) saturate(1.2) brightness(0.9)',                    preview: 'contrast(1.5) saturate(1.2) brightness(0.9)' },
  { id: 'fade',     name: 'Fade',     css: 'brightness(1.12) contrast(0.82) saturate(0.78)',                 preview: 'brightness(1.12) contrast(0.82) saturate(0.78)' },
  { id: 'mono',     name: 'Mono',     css: 'grayscale(1) contrast(1.15)',                                    preview: 'grayscale(1) contrast(1.15)' },
  { id: 'noir',     name: 'Noir',     css: 'grayscale(1) contrast(1.6) brightness(0.82)',                    preview: 'grayscale(1) contrast(1.6) brightness(0.82)' },
  { id: 'vintage',  name: 'Vintage',  css: 'sepia(0.62) contrast(1.1) brightness(0.9) saturate(0.8)',        preview: 'sepia(0.62) contrast(1.1) brightness(0.9) saturate(0.8)' },
  { id: 'lush',     name: 'Lush',     css: 'saturate(2.2) brightness(1.06) contrast(0.94)',                  preview: 'saturate(2.2) brightness(1.06) contrast(0.94)' },
  { id: 'matte',    name: 'Matte',    css: 'contrast(0.83) brightness(1.12) saturate(0.9)',                  preview: 'contrast(0.83) brightness(1.12) saturate(0.9)' },
  { id: 'pop',      name: 'Pop',      css: 'saturate(2.4) contrast(1.22) brightness(1.06)',                  preview: 'saturate(2.4) contrast(1.22) brightness(1.06)' },
  { id: 'dusk',     name: 'Dusk',     css: 'hue-rotate(210deg) saturate(1.3) brightness(0.88)',              preview: 'hue-rotate(210deg) saturate(1.3) brightness(0.88)' },
  { id: 'chill',    name: 'Chill',    css: 'hue-rotate(185deg) saturate(0.75) brightness(1.12)',             preview: 'hue-rotate(185deg) saturate(0.75) brightness(1.12)' },
  { id: 'neon',     name: 'Neon',     css: 'saturate(3) contrast(1.3) brightness(1.1) hue-rotate(30deg)',   preview: 'saturate(3) contrast(1.3) brightness(1.1) hue-rotate(30deg)' },
];

// ─── TEXT POST BACKGROUNDS ─────────────────────────────────────────────────
const TEXT_BACKGROUNDS = [
  { bg: '#0f172a', text: '#f8fafc', gradient: false },
  { bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#065f46,#10b981)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#7c2d12,#ef4444)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#581c87,#a855f7)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#92400e,#f59e0b)', text: '#1a1a1a', gradient: true },
  { bg: '#ffffff', text: '#0f172a', gradient: false },
  { bg: 'linear-gradient(135deg,#0c4a6e,#06b6d4)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#831843,#ec4899)', text: '#ffffff', gradient: true },
  { bg: 'linear-gradient(135deg,#1a1a1a,#374151)', text: '#f9fafb', gradient: true },
];

type Tab    = 'gallery' | 'camera' | 'text';
type Step   = 'select' | 'caption';
type Media  = { file: File; url: string; type: 'image' | 'video' };

export default function CreatePostPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // ── state ─────────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState<Tab>('gallery');
  const [step, setStep]             = useState<Step>('select');
  const [selected, setSelected]     = useState<Media | null>(null);
  const [filterId, setFilterId]     = useState('normal');
  const [caption, setCaption]       = useState('');
  const [hashtags, setHashtags]     = useState('');
  const [posting, setPosting]       = useState(false);
  const [uploading, setUploading]   = useState(false);

  // gallery
  const [gallery, setGallery]       = useState<Media[]>([]);
  const galleryInput                = useRef<HTMLInputElement>(null);

  // camera
  const videoRef                    = useRef<HTMLVideoElement>(null);
  const streamRef                   = useRef<MediaStream | null>(null);
  const mediaRecRef                 = useRef<MediaRecorder | null>(null);
  const chunksRef                   = useRef<BlobPart[]>([]);
  const [cameraOn, setCameraOn]     = useState(false);
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('environment');
  const [flash, setFlash]           = useState(false);
  const [recording, setRecording]   = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef                 = useRef<any>(null);
  const holdTimerRef                = useRef<any>(null);

  // text post
  const [textContent, setTextContent] = useState('');
  const [textBg, setTextBg]           = useState(TEXT_BACKGROUNDS[0]);

  // canvas for filter baking
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeFilter = FILTERS.find(f => f.id === filterId) || FILTERS[0];

  // ── gallery load ──────────────────────────────────────────────────────────
  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items: Media[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));
    setGallery(items);
    selectItem(items[0]);
  };

  const selectItem = (item: Media) => {
    setSelected(item);
    setFilterId('normal');
  };

  // ── camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert('Camera access denied. Please allow camera permissions in your browser settings.');
    }
  }, [facingMode]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => {
    if (tab === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [tab, facingMode]);

  const flipCamera = () => setFacingMode(f => f === 'user' ? 'environment' : 'user');

  // ── take photo ────────────────────────────────────────────────────────────
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext('2d')!;

    // Mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = activeFilter.css === 'none' ? 'none' : activeFilter.css;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url  = URL.createObjectURL(blob);
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const item: Media = { file, url, type: 'image' };
      setSelected(item);
      setGallery(prev => [item, ...prev]);
      setTab('gallery');
      setStep('select');
    }, 'image/jpeg', 0.96);
  };

  // ── record video ─────────────────────────────────────────────────────────
  const startRecord = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      const item: Media = { file, url, type: 'video' };
      setSelected(item);
      setGallery(prev => [item, ...prev]);
      setTab('gallery');
      setStep('select');
    };
    mr.start();
    mediaRecRef.current = mr;
    setRecording(true);
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
  };

  const stopRecord = () => {
    mediaRecRef.current?.stop();
    setRecording(false);
    clearInterval(recTimerRef.current);
  };

  const handleShutterDown = () => {
    holdTimerRef.current = setTimeout(startRecord, 300);
  };

  const handleShutterUp = () => {
    clearTimeout(holdTimerRef.current);
    if (recording) stopRecord();
    else takePhoto();
  };

  // ── upload ────────────────────────────────────────────────────────────────
  const uploadBlob = async (blob: Blob, ext: string, folder: string) => {
    if (!user) return null;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const key         = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const path        = `${folder}/${user.id}/${Date.now()}.${ext}`;
    const res         = await fetch(`${supabaseUrl}/storage/v1/object/media/${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'apikey': key, 'Content-Type': blob.type },
      body: blob,
    });
    if (!res.ok) return null;
    return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  };

  const applyFilterToCanvas = async (imgUrl: string, filterCss: string): Promise<Blob | null> => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const c   = canvasRef.current!;
        c.width   = img.naturalWidth;
        c.height  = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.filter = filterCss === 'none' ? 'none' : filterCss;
        ctx.drawImage(img, 0, 0);
        c.toBlob(b => resolve(b), 'image/jpeg', 0.94);
      };
      img.onerror = () => resolve(null);
      img.src = imgUrl;
    });
  };

  // ── post ──────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!user) return;
    setPosting(true);
    setUploading(true);
    let mediaUrl: string | null = null;

    if (tab !== 'text' && selected) {
      const ext = selected.type === 'video' ? 'webm' : 'jpg';
      const folder = selected.type === 'video' ? 'videos' : 'images';

      let blob: Blob = selected.file;
      if (selected.type === 'image' && activeFilter.css !== 'none') {
        const filtered = await applyFilterToCanvas(selected.url, activeFilter.css);
        if (filtered) blob = filtered;
      }
      mediaUrl = await uploadBlob(blob, ext, folder);
    }

    setUploading(false);

    if (tab !== 'text' && !mediaUrl) {
      alert('Upload failed. Please try again.');
      setPosting(false);
      return;
    }

    const hashtagArray = hashtags
      .split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean);

    const postData: any = {
      user_id: user.id,
      type: tab === 'text' ? 'text' : selected!.type,
      caption: tab === 'text' ? textContent : (caption.trim() || ' '),
      hashtags: hashtagArray,
      product_tags: [], like_count: 0, comment_count: 0, share_count: 0, view_count: 0,
    };
    if (tab !== 'text') {
      if (selected?.type === 'image') postData.image_url = mediaUrl;
      else postData.video_url = mediaUrl;
    }

    const { error } = await supabase.from('videos').insert(postData);
    setPosting(false);

    if (!error) navigate('/');
    else alert('Error: ' + error.message);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CAPTION SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'caption') {
    const isText = tab === 'text';
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft style={{ width: 24, height: 24, color: 'var(--text-primary)' }} />
          </button>
          <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>New Post</p>
          <button onClick={handlePost} disabled={posting || (!isText && !selected) || (isText && !textContent.trim())}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'white', background: posting ? '#1e40af' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', opacity: posting || (!isText && !selected) || (isText && !textContent.trim()) ? 0.6 : 1 }}>
            {posting ? <Loader style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
            {uploading ? 'Uploading…' : posting ? 'Posting…' : 'Share'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Preview + caption */}
          <div style={{ display: 'flex', gap: 12, padding: '16px 16px 12px', alignItems: 'flex-start' }}>
            {/* Thumbnail */}
            <div style={{ width: 80, height: 80, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: isText ? (textBg.gradient ? textBg.bg : textBg.bg) : '#000' }}>
              {isText ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: textBg.bg, padding: 6 }}>
                  <p style={{ color: textBg.text, fontSize: 10, textAlign: 'center', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden' }}>{textContent.slice(0, 40) || 'Aa'}</p>
                </div>
              ) : selected?.type === 'image' ? (
                <img src={selected.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} />
              ) : (
                <video src={selected?.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} muted />
              )}
            </div>
            {/* Caption area */}
            <div style={{ flex: 1 }}>
              <textarea autoFocus value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption…" maxLength={2200} rows={4}
                style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.55, color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, textAlign: 'right' }}>{caption.length}/2200</p>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-color)' }} />

          {/* Hashtags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
            <Hash style={{ width: 18, height: 18, color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="Add hashtags…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit' }} />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-color)' }} />

          {/* Filter badge */}
          {!isText && activeFilter.id !== 'normal' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <p style={{ fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>Filter: <strong style={{ color: '#3b82f6' }}>{activeFilter.name}</strong></p>
                <button onClick={() => setStep('select')} style={{ fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change</button>
              </div>
              <div style={{ height: 1, backgroundColor: 'var(--border-color)' }} />
            </>
          )}

          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>More options like location and product tags coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELECT SCREEN — the main creator screen
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={galleryInput} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleGalleryPick} />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexShrink: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X style={{ width: 26, height: 26, color: 'white' }} />
        </button>
        <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0, letterSpacing: '-0.01em' }}>
          {tab === 'camera' ? '📸 Camera' : tab === 'text' ? '✏️ Text Post' : '✨ New Post'}
        </p>
        {tab !== 'camera' && tab !== 'text' && (
          <button
            onClick={() => { if (!selected) { alert('Pick a photo or video'); return; } setStep('caption'); }}
            disabled={!selected}
            style={{ color: selected ? '#3b82f6' : '#444', fontWeight: 800, fontSize: 15, background: 'none', border: 'none', cursor: selected ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
        )}
        {tab === 'text' && (
          <button onClick={() => setStep('caption')} disabled={!textContent.trim()}
            style={{ color: textContent.trim() ? '#3b82f6' : '#444', fontWeight: 800, fontSize: 15, background: 'none', border: 'none', cursor: textContent.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
        )}
        {tab === 'camera' && <div style={{ width: 34 }} />}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', flexShrink: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
        {[
          { k: 'gallery', label: '⬛ Gallery', icon: null },
          { k: 'camera',  label: '📷 Camera',  icon: null },
          { k: 'text',    label: '✏️ Text',     icon: null },
        ].map(({ k, label }) => (
          <button key={k} onClick={() => setTab(k as Tab)}
            style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: tab === k ? 800 : 500, border: 'none', background: 'none', cursor: 'pointer', color: tab === k ? '#3b82f6' : 'rgba(255,255,255,0.5)', borderBottom: tab === k ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ GALLERY TAB ══════════════════════════════════════════════════════ */}
      {tab === 'gallery' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>

          {/* Selected preview — sticky at top while scrolling gallery */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%', aspectRatio: '1/1', background: '#111', flexShrink: 0 }}>
            {selected ? (
              <>
                {selected.type === 'image' ? (
                  <img src={selected.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css, transition: 'filter 0.25s' }} />
                ) : (
                  <video src={selected.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} autoPlay muted loop playsInline />
                )}
                {/* Active filter badge */}
                {activeFilter.id !== 'normal' && (
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span style={{ background: 'rgba(59,130,246,0.85)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{activeFilter.name}</span>
                  </div>
                )}
                {/* Open more from gallery */}
                <button onClick={() => galleryInput.current?.click()}
                  style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 50, padding: '6px 12px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ImageIcon style={{ width: 13, height: 13 }} /> More
                </button>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <p style={{ color: '#666', fontSize: 14, margin: 0 }}>Tap to load your gallery</p>
                <button onClick={() => galleryInput.current?.click()}
                  style={{ padding: '11px 26px', borderRadius: 50, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Open Gallery
                </button>
              </div>
            )}
          </div>

          {/* Filter strip — horizontal scroll */}
          {selected && (
            <div style={{ background: '#0a0a0a', padding: '12px 0 10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px', scrollbarWidth: 'none' }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilterId(f.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', outline: filterId === f.id ? '2.5px solid #3b82f6' : '2px solid transparent', outlineOffset: 2 }}>
                      {selected.type === 'image' ? (
                        <img src={selected.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} />
                      ) : (
                        <video src={selected.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} muted />
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: filterId === f.id ? 700 : 400, color: filterId === f.id ? '#3b82f6' : '#666' }}>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gallery grid label */}
          <div style={{ background: '#0a0a0a', padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#666', fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recents</p>
            {gallery.length > 0 && (
              <button onClick={() => galleryInput.current?.click()}
                style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add more</button>
            )}
          </div>

          {/* Gallery grid */}
          {gallery.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 12, background: '#0a0a0a' }}>
              <ImageIcon style={{ width: 36, height: 36, color: '#333' }} />
              <p style={{ color: '#555', fontSize: 13, margin: 0, textAlign: 'center' }}>Tap "Open Gallery" above to load your photos & videos</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, padding: 2, background: '#0a0a0a' }}>
              {gallery.map((item, i) => (
                <div key={i} onClick={() => selectItem(item)}
                  style={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', outline: selected?.url === item.url ? '3px solid #3b82f6' : 'none', outlineOffset: '-3px' }}>
                  {item.type === 'image' ? (
                    <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <>
                      <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.65)', borderRadius: 5, padding: '2px 5px', display: 'flex', alignItems: 'center' }}>
                        <Film style={{ width: 9, height: 9, color: 'white' }} />
                      </div>
                    </>
                  )}
                  {selected?.url === item.url && (
                    <div style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 11, height: 11, color: 'white' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ CAMERA TAB ═══════════════════════════════════════════════════════ */}
      {tab === 'camera' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>

          {/* Live viewfinder */}
          <video ref={videoRef} autoPlay muted playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              filter: activeFilter.css, transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              transition: 'filter 0.2s' }} />

          {/* Camera controls top row */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
            {/* Flash */}
            <button onClick={() => setFlash(f => !f)}
              style={{ width: 38, height: 38, borderRadius: '50%', background: flash ? 'rgba(251,191,36,0.3)' : 'rgba(0,0,0,0.4)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {flash ? <Zap style={{ width: 20, height: 20, color: '#fbbf24' }} /> : <ZapOff style={{ width: 20, height: 20, color: 'white' }} />}
            </button>

            {/* Recording timer */}
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 20 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{String(Math.floor(recSeconds/60)).padStart(2,'0')}:{String(recSeconds%60).padStart(2,'0')}</span>
              </div>
            )}
            {!recording && <div />}

            {/* Flip camera */}
            <button onClick={flipCamera}
              style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw style={{ width: 20, height: 20, color: 'white' }} />
            </button>
          </div>

          {/* Filter strip — real-time on live camera */}
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px' }}>
            {FILTERS.slice(0, 8).map(f => (
              <button key={f.id} onClick={() => setFilterId(f.id)}
                style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: filterId === f.id ? '2.5px solid #3b82f6' : '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, position: 'relative', background: '#000' }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 3 }}>
                  <span style={{ fontSize: 8, color: 'white', fontWeight: filterId === f.id ? 800 : 500, textShadow: '0 1px 3px rgba(0,0,0,0.9)', lineHeight: 1 }}>{f.name}</span>
                </span>
                {/* Colour swatch representing the filter */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.6, background: f.id === 'warm' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : f.id === 'cool' ? 'linear-gradient(135deg,#06b6d4,#3b82f6)' : f.id === 'mono' || f.id === 'noir' ? 'linear-gradient(135deg,#374151,#111)' : f.id === 'neon' ? 'linear-gradient(135deg,#f0abfc,#818cf8)' : f.id === 'golden' ? 'linear-gradient(135deg,#fbbf24,#d97706)' : f.id === 'lush' ? 'linear-gradient(135deg,#34d399,#10b981)' : f.id === 'vivid' ? 'linear-gradient(135deg,#f43f5e,#f59e0b)' : f.id === 'dusk' ? 'linear-gradient(135deg,#6366f1,#ec4899)' : 'rgba(255,255,255,0.15)' }} />
              </button>
            ))}
          </div>

          {/* Shutter — tap = photo, hold = video */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{recording ? 'Release to stop recording' : 'Tap = photo · Hold = video'}</p>

            <button
              onMouseDown={handleShutterDown} onMouseUp={handleShutterUp}
              onTouchStart={handleShutterDown} onTouchEnd={handleShutterUp}
              style={{
                width: recording ? 72 : 80, height: recording ? 72 : 80,
                borderRadius: recording ? 18 : '50%',
                background: recording ? '#ef4444' : 'white',
                border: `5px solid ${recording ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.4)'}`,
                cursor: 'pointer',
                boxShadow: recording ? '0 0 0 8px rgba(239,68,68,0.25)' : '0 0 0 4px rgba(255,255,255,0.15)',
                transition: 'all 0.18s cubic-bezier(0.34,1.4,0.64,1)',
              }}
            />
          </div>

          {!cameraOn && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(0,0,0,0.85)' }}>
              <p style={{ color: 'white', fontSize: 15 }}>Camera not started</p>
              <button onClick={startCamera}
                style={{ padding: '11px 26px', borderRadius: 50, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Start Camera</button>
            </div>
          )}
        </div>
      )}

      {/* ══ TEXT TAB ══════════════════════════════════════════════════════════ */}
      {tab === 'text' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: textBg.gradient ? textBg.bg : textBg.bg, transition: 'background 0.3s' }}>

          {/* Text input area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 28px' }}>
            <textarea autoFocus value={textContent} onChange={e => setTextContent(e.target.value)}
              placeholder="What's on your mind?" maxLength={300} rows={6}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 24, fontWeight: 700, textAlign: 'center', color: textBg.text, fontFamily: 'inherit', lineHeight: 1.45, caretColor: textBg.text }} />
          </div>

          {/* Char count */}
          <p style={{ textAlign: 'center', color: textBg.text, opacity: 0.5, fontSize: 12, margin: '0 0 8px' }}>{textContent.length}/300</p>

          {/* Background colour picker */}
          <div style={{ padding: '12px 16px 32px', display: 'flex', gap: 10, justifyContent: 'center', overflowX: 'auto' }}>
            {TEXT_BACKGROUNDS.map((bg, i) => (
              <button key={i} onClick={() => setTextBg(bg)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: textBg === bg ? '3px solid white' : '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0, background: bg.bg, boxShadow: textBg === bg ? '0 0 0 2px rgba(0,0,0,0.4)' : 'none', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
