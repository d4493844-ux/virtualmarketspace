import { useState } from 'react';
import VideoFeed from '../components/VideoFeed';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
  const [feedMode, setFeedMode] = useState<'following' | 'for-you'>('for-you');

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-center h-12" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex rounded-full p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setFeedMode('following')}
            className="px-6 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: feedMode === 'following' ? 'var(--text-primary)' : 'transparent',
              color: feedMode === 'following' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            Following
          </button>
          <button
            onClick={() => setFeedMode('for-you')}
            className="px-6 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: feedMode === 'for-you' ? 'var(--text-primary)' : 'transparent',
              color: feedMode === 'for-you' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            For You
          </button>
        </div>
      </div>

      <div className="flex-1 mt-12">
        <VideoFeed mode={feedMode} />
      </div>

      <BottomNav />
    </div>
  );
}