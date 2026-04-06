/**
 * VMS Creator — Professional Instagram/TikTok-grade creator UI
 *
 * Layout (identical to Instagram):
 * ┌─────────────────────────────┐
 * │  ✕          New Post    Next│  ← fixed header
 * ├─────────────────────────────┤
 * │                             │
 * │   SELECTED PREVIEW (1:1)    │  ← sticky, ~45vh
 * │   [filter name badge]       │
 * ├─────────────────────────────┤
 * │  Recents ▾     [multi]  [⚡]│  ← album row
 * ├──┬──┬──┬──┬──┬──┬──┬──┬───┤
 * │  │  │  │  │  │  │  │  │   │  ← 3-col gallery grid
 * │  │  │  │  │  │  │  │  │   │    scrolls UP under preview
 * │  │  │  │  │  │  │  │  │   │
 * └──┴──┴──┴──┴──┴──┴──┴──┴───┘
 *
 * Tabs: RECENTS | CAMERA | TEXT  (text only, no emoji icons)
 *
 * Camera:
 * - Full-screen viewfinder, filters on right sidebar
 * - Tap shutter = photo, hold = video
 * - Flash, flip camera
 *
 * Text:
 * - Full-screen coloured canvas, colour dots at bottom
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronDown, ChevronRight, Check, Film,
  ArrowLeft, Send, Hash, Loader, RefreshCw,
  Zap, ZapOff, Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── 16 filters ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'normal',  label: 'Normal',  css: 'none' },
  { id: 'vivid',   label: 'Vivid',   css: 'saturate(1.9) contrast(1.12)' },
  { id: 'warm',    label: 'Warm',    css: 'sepia(0.38) saturate(1.5) brightness(1.08) hue-rotate(-10deg)' },
  { id: 'cool',    label: 'Cool',    css: 'hue-rotate(22deg) saturate(1.2) brightness(1.06)' },
  { id: 'golden',  label: 'Golden',  css: 'sepia(0.28) saturate(1.7) brightness(1.12) hue-rotate(-15deg)' },
  { id: 'drama',   label: 'Drama',   css: 'contrast(1.55) saturate(1.15) brightness(0.88)' },
  { id: 'fade',    label: 'Fade',    css: 'brightness(1.14) contrast(0.8) saturate(0.75)' },
  { id: 'mono',    label: 'Mono',    css: 'grayscale(1) contrast(1.18)' },
  { id: 'noir',    label: 'Noir',    css: 'grayscale(1) contrast(1.65) brightness(0.8)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.65) contrast(1.1) brightness(0.88) saturate(0.78)' },
  { id: 'lush',    label: 'Lush',    css: 'saturate(2.2) brightness(1.06) contrast(0.93)' },
  { id: 'matte',   label: 'Matte',   css: 'contrast(0.82) brightness(1.14) saturate(0.88)' },
  { id: 'pop',     label: 'Pop',     css: 'saturate(2.5) contrast(1.24) brightness(1.06)' },
  { id: 'dusk',    label: 'Dusk',    css: 'hue-rotate(215deg) saturate(1.28) brightness(0.86)' },
  { id: 'chill',   label: 'Chill',   css: 'hue-rotate(188deg) saturate(0.72) brightness(1.14)' },
  { id: 'neon',    label: 'Neon',    css: 'saturate(3) contrast(1.32) brightness(1.1) hue-rotate(30deg)' },
];

// ── text post backgrounds ────────────────────────────────────────────────────
const TEXT_BGS = [
  { bg: '#0f172a',                                              text: '#f8fafc' },
  { bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#065f46,#10b981)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#7c2d12,#ef4444)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#581c87,#a855f7)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#92400e,#fbbf24)',             text: '#1a1a1a' },
  { bg: '#ffffff',                                              text: '#0f172a' },
  { bg: 'linear-gradient(135deg,#0c4a6e,#06b6d4)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#831843,#ec4899)',             text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#14532d,#86efac)',             text: '#0f172a' },
];

type Tab   = 'gallery' | 'camera' | 'text';
type Step  = 'select' | 'caption';
type Media = { file: File; url: string; kind: 'image' | 'video' };

export default function CreatePostPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [tab, setTab]           = useState<Tab>('gallery');
  const [step, setStep]         = useState<Step>('select');
  const [media, setMedia]       = useState<Media | null>(null);
  const [gallery, setGallery]   = useState<Media[]>([]);
  const [filterId, setFilterId] = useState('normal');
  const [caption, setCaption]   = useState('');
  const [tags, setTags]         = useState('');
  const [posting, setPosting]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // text post
  const [text, setText]         = useState('');
  const [textBg, setTextBg]     = useState(TEXT_BGS[0]);

  // camera
  const vidRef      = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const mrRef       = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<BlobPart[]>([]);
  const holdRef     = useRef<any>(null);
  const recTimerRef = useRef<any>(null);
  const [camReady, setCamReady]     = useState(false);
  const [facing, setFacing]         = useState<'user'|'environment'>('environment');
  const [flash, setFlash]           = useState(false);
  const [recording, setRecording]   = useState(false);
  const [recSecs, setRecSecs]       = useState(0);

  const galleryRef = useRef<HTMLInputElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const activeFilter = FILTERS.find(f => f.id === filterId)!;

  // ── gallery ────────────────────────────────────────────────────────────────
  const loadGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items: Media[] = files.map(f => ({
      file: f,
      url:  URL.createObjectURL(f),
      kind: f.type.startsWith('video') ? 'video' : 'image',
    }));
    setGallery(items);
    pick(items[0]);
  };

  const pick = (item: Media) => {
    setMedia(item);
    setFilterId('normal');
    setShowFilters(false);
  };

  // ── camera ─────────────────────────────────────────────────────────────────
  const startCam = useCallback(async () => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = s;
      if (vidRef.current) { vidRef.current.srcObject = s; await vidRef.current.play(); }
      setCamReady(true);
    } catch { alert('Camera permission denied. Enable it in browser settings.'); }
  }, [facing]);

  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamReady(false);
  };

  useEffect(() => {
    if (tab === 'camera') startCam();
    else stopCam();
    return stopCam;
  }, [tab, facing]);

  const snap = () => {
    const v = vidRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 1080; c.height = v.videoHeight || 1920;
    const ctx = c.getContext('2d')!;
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.filter = activeFilter.css === 'none' ? 'none' : activeFilter.css;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const item: Media = { file, url: URL.createObjectURL(blob), kind: 'image' };
      setGallery(g => [item, ...g]);
      pick(item);
      setTab('gallery');
    }, 'image/jpeg', 0.96);
  };

  const startRec = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `vid-${Date.now()}.webm`, { type: 'video/webm' });
      const item: Media = { file, url: URL.createObjectURL(blob), kind: 'video' };
      setGallery(g => [item, ...g]);
      pick(item);
      setTab('gallery');
    };
    mr.start(); mrRef.current = mr;
    setRecording(true); setRecSecs(0);
    recTimerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
  };

  const stopRec = () => {
    mrRef.current?.stop(); setRecording(false);
    clearInterval(recTimerRef.current);
  };

  const onShutterDown = () => { holdRef.current = setTimeout(startRec, 350); };
  const onShutterUp   = () => {
    clearTimeout(holdRef.current);
    if (recording) stopRec(); else snap();
  };

  // ── upload + post ──────────────────────────────────────────────────────────
  const uploadBlob = async (blob: Blob, ext: string, folder: string) => {
    if (!user) return null;
    const base = import.meta.env.VITE_SUPABASE_URL;
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`;
    const res  = await fetch(`${base}/storage/v1/object/media/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': blob.type },
      body: blob,
    });
    if (!res.ok) return null;
    return `${base}/storage/v1/object/public/media/${path}`;
  };

  const bakeFilter = (imgUrl: string, css: string): Promise<Blob | null> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current!;
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.filter = css === 'none' ? 'none' : css;
        ctx.drawImage(img, 0, 0);
        c.toBlob(b => resolve(b), 'image/jpeg', 0.94);
      };
      img.onerror = () => resolve(null);
      img.src = imgUrl;
    });

  const post = async () => {
    if (!user) return;
    const isText = tab === 'text';
    if (!isText && !media) { alert('Select a photo or video'); return; }
    if (isText && !text.trim()) { alert('Write something'); return; }

    setPosting(true); setUploading(true);
    let url: string | null = null;

    if (!isText && media) {
      const ext    = media.kind === 'video' ? 'webm' : 'jpg';
      const folder = media.kind === 'video' ? 'videos' : 'images';
      let blob: Blob = media.file;
      if (media.kind === 'image' && activeFilter.css !== 'none') {
        const baked = await bakeFilter(media.url, activeFilter.css);
        if (baked) blob = baked;
      }
      url = await uploadBlob(blob, ext, folder);
    }

    setUploading(false);
    if (!isText && !url) { alert('Upload failed. Try again.'); setPosting(false); return; }

    const hashArr = tags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean);
    const row: any = {
      user_id: user.id,
      type: isText ? 'text' : media!.kind,
      caption: isText ? text.trim() : (caption.trim() || ' '),
      hashtags: hashArr,
      product_tags: [], like_count: 0, comment_count: 0, share_count: 0, view_count: 0,
    };
    if (!isText) {
      if (media!.kind === 'image') row.image_url = url;
      else row.video_url = url;
    }

    const { error } = await supabase.from('videos').insert(row);
    setPosting(false);
    if (!error) navigate('/'); else alert('Error: ' + error.message);
  };

  const canGoNext = tab === 'text' ? text.trim().length > 0 : !!media;

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTION SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'caption') {
    const isText = tab === 'text';
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 54, borderBottom: '1px solid var(--border-color)', flexShrink: 0, gap: 12 }}>
          <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginLeft: -6 }}>
            <ArrowLeft style={{ width: 22, height: 22, color: 'var(--text-primary)' }} />
          </button>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>New post</span>
          <button onClick={post} disabled={posting}
            style={{ background: posting ? '#1e40af' : '#0095f6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 14, cursor: posting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {posting
              ? <Loader style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }} />
              : null}
            {uploading ? 'Uploading…' : posting ? 'Sharing…' : 'Share'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* media thumbnail + caption */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: isText ? textBg.bg : '#111' }}>
              {isText ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: textBg.bg, padding: 6 }}>
                  <p style={{ color: textBg.text, fontSize: 9, textAlign: 'center', fontWeight: 700, lineHeight: 1.3, margin: 0, overflow: 'hidden' }}>{text.slice(0, 50) || 'Aa'}</p>
                </div>
              ) : media?.kind === 'image' ? (
                <img src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} />
              ) : (
                <video src={media?.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} muted />
              )}
            </div>
            <textarea
              autoFocus value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption…" maxLength={2200} rows={4}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.5, color: 'var(--text-primary)', fontFamily: 'inherit', padding: 0 }}
            />
          </div>

          {/* hashtags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <Hash style={{ width: 17, height: 17, color: '#0095f6', flexShrink: 0 }} />
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Add hashtags"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit' }} />
          </div>

          {/* filter info */}
          {!isText && activeFilter.id !== 'normal' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>Filter</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: '#0095f6', fontWeight: 600 }}>{activeFilter.label}</span>
                <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0095f6', fontSize: 14 }}>Edit</button>
              </div>
            </div>
          )}

          <div style={{ padding: '14px 16px' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0, textAlign: 'center' }}>Tag products and add location — coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN CREATOR SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={loadGallery} />

      {/* ── HEADER — same as Instagram ── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 50, padding: '0 16px', flexShrink: 0, background: '#000' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 6px 6px 0', marginRight: 'auto' }}>
          <X style={{ width: 28, height: 28, color: '#fff' }} />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>New post</span>
        {canGoNext && (
          <button
            onClick={() => { if (tab === 'camera') return; setStep('caption'); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#0095f6', fontWeight: 700, fontSize: 16, padding: '6px 0 6px 6px' }}>
            Next
          </button>
        )}
        {!canGoNext && <div style={{ width: 36 }} />}
      </div>

      {/* ── GALLERY TAB — preview + grid in ONE scroll ── */}
      {tab === 'gallery' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>

          {/* ── PREVIEW (sticky) ── */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, width: '100%', aspectRatio: '1/1', background: '#111', flexShrink: 0, overflow: 'hidden' }}>
            {media ? (
              <>
                {media.kind === 'image'
                  ? <img src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css, transition: 'filter 0.2s' }} />
                  : <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: activeFilter.css }} autoPlay muted loop playsInline />
                }
                {/* filter badge */}
                {activeFilter.id !== 'normal' && (
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', padding: '3px 10px', borderRadius: 30 }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{activeFilter.label}</span>
                  </div>
                )}
                {/* Filters toggle button — bottom left */}
                <button onClick={() => setShowFilters(v => !v)}
                  style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', border: showFilters ? '1.5px solid #fff' : '1.5px solid transparent', borderRadius: 30, padding: '5px 12px', cursor: 'pointer' }}>
                  <Layers style={{ width: 14, height: 14, color: '#fff' }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Filters</span>
                </button>
              </>
            ) : (
              /* No media yet — prompt */
              <button onClick={() => galleryRef.current?.click()}
                style={{ width: '100%', height: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ color: '#555', fontSize: 15 }}>Tap below to select a photo or video</span>
              </button>
            )}
          </div>

          {/* ── FILTER STRIP (collapsible, sits between preview and grid) ── */}
          {media && showFilters && (
            <div style={{ background: '#000', flexShrink: 0, padding: '14px 0 12px' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilterId(f.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 6, overflow: 'hidden', outline: filterId === f.id ? '2.5px solid #fff' : '2px solid transparent', outlineOffset: 1.5 }}>
                      {media.kind === 'image'
                        ? <img src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} />
                        : <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }} muted />
                      }
                    </div>
                    <span style={{ fontSize: 10, color: filterId === f.id ? '#fff' : '#666', fontWeight: filterId === f.id ? 700 : 400 }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ALBUM ROW — exactly like Instagram ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 44, background: '#000', flexShrink: 0 }}>
            <button onClick={() => galleryRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Recents</span>
              <ChevronDown style={{ width: 16, height: 16, color: '#fff' }} />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => galleryRef.current?.click()}
                style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Film style={{ width: 15, height: 15, color: '#fff' }} />
              </button>
            </div>
          </div>

          {/* ── GALLERY GRID — 3 column, tight gap, like Instagram ── */}
          {gallery.length === 0 ? (
            <div style={{ background: '#111', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '40px 20px', minHeight: 300 }}>
              <p style={{ color: '#555', fontSize: 15, margin: 0, textAlign: 'center' }}>Your gallery will appear here</p>
              <button onClick={() => galleryRef.current?.click()}
                style={{ padding: '11px 28px', borderRadius: 8, background: '#0095f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Open Gallery
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, background: '#000', flexShrink: 0 }}>
              {gallery.map((item, i) => (
                <div key={i} onClick={() => pick(item)}
                  style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer' }}>
                  {item.kind === 'image'
                    ? <img src={item.url} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <>
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 5px' }}>
                          <Film style={{ width: 10, height: 10, color: '#fff' }} />
                        </div>
                      </>
                  }
                  {/* selection circle — top right, exactly like Instagram */}
                  <div style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%',
                    background: media?.url === item.url ? '#0095f6' : 'rgba(0,0,0,0.35)',
                    border: media?.url === item.url ? '2px solid #0095f6' : '2px solid rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {media?.url === item.url && <Check style={{ width: 12, height: 12, color: '#fff', strokeWidth: 3 }} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAMERA TAB ─────────────────────────────────────────────────────── */}
      {tab === 'camera' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>

          {/* Viewfinder */}
          <video ref={vidRef} autoPlay muted playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              filter: activeFilter.css,
              transform: facing === 'user' ? 'scaleX(-1)' : 'none',
              transition: 'filter 0.2s' }} />

          {/* Top controls */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom,rgba(0,0,0,0.5),transparent)' }}>
            <button onClick={() => setFlash(f => !f)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: flash ? 'rgba(251,191,36,0.25)' : 'rgba(0,0,0,0.4)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {flash ? <Zap style={{ width: 20, height: 20, color: '#fbbf24' }} /> : <ZapOff style={{ width: 20, height: 20, color: '#fff' }} />}
            </button>

            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.5)', padding: '5px 14px', borderRadius: 30 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                  {String(Math.floor(recSecs / 60)).padStart(2, '0')}:{String(recSecs % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            <button onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw style={{ width: 20, height: 20, color: '#fff' }} />
            </button>
          </div>

          {/* Filters — right vertical strip */}
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FILTERS.slice(0, 9).map(f => (
              <button key={f.id} onClick={() => setFilterId(f.id)}
                style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', position: 'relative', border: filterId === f.id ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0 }}>
                {/* colour swatch */}
                <div style={{ position: 'absolute', inset: 0, background:
                  f.id === 'warm'   ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                  f.id === 'cool'   ? 'linear-gradient(135deg,#06b6d4,#6366f1)' :
                  f.id === 'golden' ? 'linear-gradient(135deg,#fbbf24,#d97706)' :
                  f.id === 'drama'  ? 'linear-gradient(135deg,#1e293b,#334155)' :
                  f.id === 'noir'   ? '#111' :
                  f.id === 'mono'   ? 'linear-gradient(135deg,#9ca3af,#374151)' :
                  f.id === 'lush'   ? 'linear-gradient(135deg,#34d399,#059669)' :
                  f.id === 'vivid'  ? 'linear-gradient(135deg,#f43f5e,#f59e0b)' :
                  f.id === 'neon'   ? 'linear-gradient(135deg,#f0abfc,#818cf8)' :
                  f.id === 'dusk'   ? 'linear-gradient(135deg,#7c3aed,#db2777)' :
                  f.id === 'pop'    ? 'linear-gradient(135deg,#22d3ee,#a78bfa)' :
                  'rgba(255,255,255,0.15)'
                }} />
                <span style={{ position: 'absolute', bottom: 3, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 8.5, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Shutter area */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'linear-gradient(to top,rgba(0,0,0,0.55),transparent)' }}>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: '0.02em' }}>
              {recording ? 'Release to stop' : 'Tap for photo  ·  Hold for video'}
            </span>
            {/* Shutter button — TikTok/Instagram style */}
            <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* outer ring */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${recording ? '#ef4444' : '#fff'}`, transition: 'border-color 0.2s' }} />
              {/* inner button */}
              <button
                onMouseDown={onShutterDown} onMouseUp={onShutterUp}
                onTouchStart={onShutterDown} onTouchEnd={onShutterUp}
                style={{
                  width: 68, height: 68,
                  borderRadius: recording ? 16 : '50%',
                  background: recording ? '#ef4444' : '#fff',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.34,1.4,0.64,1)',
                  boxShadow: recording ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
                }}
              />
            </div>
          </div>

          {!camReady && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <p style={{ color: '#fff', fontSize: 15, margin: 0 }}>Camera not started</p>
              <button onClick={startCam} style={{ padding: '11px 28px', borderRadius: 8, background: '#0095f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Start Camera</button>
            </div>
          )}
        </div>
      )}

      {/* ── TEXT TAB ──────────────────────────────────────────────────────── */}
      {tab === 'text' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: textBg.bg }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 28px 0' }}>
            <textarea
              autoFocus value={text} onChange={e => setText(e.target.value)}
              placeholder="What's on your mind?" maxLength={300} rows={7}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 26, fontWeight: 700, textAlign: 'center', color: textBg.text, fontFamily: 'inherit', lineHeight: 1.42, caretColor: textBg.text }}
            />
          </div>
          <p style={{ textAlign: 'center', color: textBg.text, opacity: 0.45, fontSize: 12, margin: '6px 0 10px' }}>{text.length}/300</p>
          {/* colour dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '12px 16px 36px', overflowX: 'auto' }}>
            {TEXT_BGS.map((b, i) => (
              <button key={i} onClick={() => setTextBg(b)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: textBg === b ? '3px solid #fff' : '2px solid rgba(255,255,255,0.35)', cursor: 'pointer', flexShrink: 0, background: b.bg, boxShadow: textBg === b ? '0 0 0 2.5px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.14s' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM TAB BAR — no icons, text only, exactly like TikTok ── */}
      <div style={{ display: 'flex', height: 46, background: '#000', flexShrink: 0, borderTop: '1px solid #1a1a1a' }}>
        {(['gallery', 'camera', 'text'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? '#fff' : '#555',
              fontWeight: tab === t ? 700 : 500,
              fontSize: 14,
              letterSpacing: '-0.01em',
              borderTop: tab === t ? '2px solid #fff' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
            {t === 'gallery' ? 'Gallery' : t === 'camera' ? 'Camera' : 'Text'}
          </button>
        ))}
      </div>

    </div>
  );
}
