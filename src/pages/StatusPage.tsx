import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X, Plus, Type, Mic, MicOff, Send, ChevronLeft,
  Play, Pause, Loader, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Status = {
  id: string;
  user_id: string;
  type: 'text' | 'voice';
  content: string | null;       // text content
  voice_url: string | null;     // audio file url
  duration_seconds: number | null;
  background_color: string;
  text_color: string;
  view_count: number;
  expires_at: string;
  created_at: string;
  user?: { display_name: string; avatar_url: string | null };
};

const BG_COLORS = [
  { bg: '#1e3a8a', text: '#ffffff' },
  { bg: '#065f46', text: '#ffffff' },
  { bg: '#7c2d12', text: '#ffffff' },
  { bg: '#581c87', text: '#ffffff' },
  { bg: '#0f172a', text: '#ffffff' },
  { bg: '#ffffff', text: '#0f172a' },
  { bg: '#fef3c7', text: '#78350f' },
  { bg: '#f0fdf4', text: '#14532d' },
];

export default function StatusPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwnStatus = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [createType, setCreateType] = useState<'text' | 'voice'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [posting, setPosting] = useState(false);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Progress bar for viewing
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<any>(null);

  useEffect(() => {
    if (targetUserId) loadStatuses();
  }, [targetUserId]);

  // Auto-advance through statuses
  useEffect(() => {
    if (statuses.length === 0 || showCreate) return;
    clearInterval(progressRef.current);
    setProgress(0);

    const currentStatus = statuses[currentIndex];
    const duration = currentStatus?.type === 'voice'
      ? (currentStatus.duration_seconds || 10) * 1000
      : 5000;

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex(i => i + 1);
          } else {
            navigate(-1);
          }
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    // Record view
    if (currentStatus && !isOwnStatus) {
      supabase.from('statuses')
        .update({ view_count: (currentStatus.view_count || 0) + 1 })
        .eq('id', currentStatus.id);
    }

    return () => clearInterval(progressRef.current);
  }, [currentIndex, statuses.length, showCreate]);

  const loadStatuses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('statuses')
      .select('*, user:users!statuses_user_id_fkey(display_name, avatar_url)')
      .eq('user_id', targetUserId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    setStatuses((data as Status[]) || []);
    setLoading(false);

    // If viewing own status with none, show create form
    if (isOwnStatus && (!data || data.length === 0)) {
      setShowCreate(true);
    }
  };

  // ── VOICE RECORDING ─────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      alert('Microphone permission denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  // ── POST STATUS ──────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!user) return;
    if (createType === 'text' && !textContent.trim()) { alert('Write something first'); return; }
    if (createType === 'voice' && !audioBlob) { alert('Record a voice note first'); return; }

    setPosting(true);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    let voiceUrl: string | null = null;
    let durationSecs: number | null = null;

    if (createType === 'voice' && audioBlob) {
      // Upload voice note
      const fileName = `${user.id}/${Date.now()}.webm`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/storage/v1/object/media/voice-notes/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'audio/webm',
        },
        body: audioBlob,
      });

      if (res.ok) {
        voiceUrl = `${supabaseUrl}/storage/v1/object/public/media/voice-notes/${fileName}`;
        durationSecs = recordingSeconds;
      } else {
        alert('Failed to upload voice note. Try again.');
        setPosting(false);
        return;
      }
    }

    const { error } = await supabase.from('statuses').insert({
      user_id: user.id,
      type: createType,
      content: createType === 'text' ? textContent.trim() : null,
      voice_url: voiceUrl,
      duration_seconds: durationSecs,
      background_color: selectedBg.bg,
      text_color: selectedBg.text,
      expires_at: expiresAt,
      view_count: 0,
    });

    setPosting(false);

    if (!error) {
      setTextContent('');
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSeconds(0);
      setShowCreate(false);
      loadStatuses();
    } else {
      alert('Error posting status: ' + error.message);
    }
  };

  const deleteStatus = async (statusId: string) => {
    await supabase.from('statuses').delete().eq('id', statusId);
    loadStatuses();
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
      <Loader style={{ width: 28, height: 28, color: 'white', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  // ── CREATE STATUS SCREEN ─────────────────────────────────────────────────
  if (showCreate) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: selectedBg.bg,
        display: 'flex', flexDirection: 'column',
        transition: 'background-color 0.3s',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <button onClick={() => statuses.length > 0 ? setShowCreate(false) : navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18, color: 'white' }} />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCreateType('text')}
              style={{ padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: createType === 'text' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', color: createType === 'text' ? '#0f172a' : 'white' }}>
              <Type style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />Text
            </button>
            <button onClick={() => setCreateType('voice')}
              style={{ padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: createType === 'voice' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', color: createType === 'voice' ? '#0f172a' : 'white' }}>
              <Mic style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />Voice
            </button>
          </div>
          <button onClick={handlePost} disabled={posting}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: posting ? 'rgba(255,255,255,0.3)' : 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: posting ? 'not-allowed' : 'pointer' }}>
            {posting ? <Loader style={{ width: 16, height: 16, color: '#0f172a' }} /> : <Send style={{ width: 16, height: 16, color: '#0f172a' }} />}
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {createType === 'text' ? (
            <textarea
              autoFocus
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={300}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none',
                color: selectedBg.text, fontSize: 26, fontWeight: 700, textAlign: 'center',
                lineHeight: 1.4, fontFamily: 'inherit',
              }}
              rows={5}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              {!audioUrl ? (
                <>
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    style={{
                      width: 100, height: 100, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      backgroundColor: recording ? '#ef4444' : 'rgba(255,255,255,0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: recording ? '0 0 0 12px rgba(239,68,68,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {recording ? <MicOff style={{ width: 40, height: 40, color: 'white' }} /> : <Mic style={{ width: 40, height: 40, color: '#0f172a' }} />}
                  </button>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' }}>
                    {recording ? `🔴 Recording… ${recordingSeconds}s (release to stop)` : 'Hold to record a voice note'}
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <button onClick={togglePlay}
                    style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {playing ? <Pause style={{ width: 32, height: 32, color: '#0f172a' }} /> : <Play style={{ width: 32, height: 32, color: '#0f172a' }} />}
                  </button>
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>🎙️ {recordingSeconds}s voice note</p>
                  <button onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecordingSeconds(0); }}
                    style={{ padding: '8px 20px', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                    Re-record
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Background color picker (text mode only) */}
        {createType === 'text' && (
          <div style={{ display: 'flex', gap: 8, padding: '16px 20px 32px', justifyContent: 'center', overflowX: 'auto' }}>
            {BG_COLORS.map((c, i) => (
              <button key={i} onClick={() => setSelectedBg(c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', backgroundColor: c.bg,
                  border: selectedBg.bg === c.bg ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer', flexShrink: 0,
                }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── VIEW STATUS SCREEN ───────────────────────────────────────────────────
  if (statuses.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>No active status</p>
        {isOwnStatus && (
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '12px 24px', borderRadius: 50, backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
            Create Status
          </button>
        )}
        <button onClick={() => navigate(-1)}
          style={{ padding: '10px 20px', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  const current = statuses[currentIndex];

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: current.background_color || '#0f172a', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}
      onClick={() => {
        if (currentIndex < statuses.length - 1) setCurrentIndex(i => i + 1);
        else navigate(-1);
      }}
    >
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 8px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        {statuses.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', backgroundColor: 'white', borderRadius: 3,
              width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              transition: i === currentIndex ? 'none' : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }} onClick={e => e.stopPropagation()}>
        <img
          src={current.user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'}
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{current.user?.display_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
            {new Date(current.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {isOwnStatus && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye style={{ width: 14, height: 14 }} /> {current.view_count}
            </span>
            <button
              onClick={() => deleteStatus(current.id)}
              style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X style={{ width: 15, height: 15, color: 'white' }} />
            </button>
          </div>
        )}
        <button onClick={() => navigate(-1)}
          style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft style={{ width: 16, height: 16, color: 'white' }} />
        </button>
      </div>

      {/* Status content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        {current.type === 'text' ? (
          <p style={{ color: current.text_color || 'white', fontSize: 28, fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
            {current.content}
          </p>
        ) : current.voice_url ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic style={{ width: 36, height: 36, color: 'white' }} />
            </div>
            <audio controls src={current.voice_url} autoPlay style={{ width: '100%', maxWidth: 280 }} />
            {current.duration_seconds && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>🎙️ {current.duration_seconds}s voice note</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Nav hint */}
      {isOwnStatus && (
        <div style={{ padding: '0 20px 40px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setShowCreate(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Plus style={{ width: 16, height: 16 }} /> Add another status
          </button>
        </div>
      )}
    </div>
  );
}
