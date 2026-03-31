import { useState } from 'react';
import VideoFeed from '../components/VideoFeed';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
  const [feedMode, setFeedMode] = useState<'following' | 'for-you'>('for-you');

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Floating tab pill */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 6px',
        borderRadius: 50,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',        // ← prevents any wrapping on the container
      }}>
        <button
          onClick={() => setFeedMode('following')}
          style={{
            padding: '7px 18px',
            borderRadius: 50,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
            background: feedMode === 'following'
              ? 'rgba(255,255,255,0.95)'
              : 'transparent',
            color: feedMode === 'following'
              ? '#0f172a'
              : 'rgba(255,255,255,0.75)',
            boxShadow: feedMode === 'following'
              ? '0 2px 8px rgba(0,0,0,0.2)'
              : 'none',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',    // ← key fix: keeps "Following" on one line
            display: 'inline-block',
          }}
        >
          Following
        </button>
        <button
          onClick={() => setFeedMode('for-you')}
          style={{
            padding: '7px 18px',
            borderRadius: 50,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
            background: feedMode === 'for-you'
              ? 'rgba(255,255,255,0.95)'
              : 'transparent',
            color: feedMode === 'for-you'
              ? '#0f172a'
              : 'rgba(255,255,255,0.75)',
            boxShadow: feedMode === 'for-you'
              ? '0 2px 8px rgba(0,0,0,0.2)'
              : 'none',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',    // ← key fix: keeps "For You" on one line
            display: 'inline-block',
          }}
        >
          For You
        </button>
      </div>

      {/* Video feed — overflow:hidden is critical for snap scroll to work correctly */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <VideoFeed mode={feedMode} />
      </div>

      <BottomNav />
    </div>
  );
}
