import { Home, Search, Plus, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-4 backdrop-blur-lg z-20"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex flex-col items-center justify-center gap-1 transition-all"
      >
        <Home
          className="w-6 h-6"
          style={{ color: isActive('/') ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          fill={isActive('/') ? 'var(--text-primary)' : 'none'}
        />
      </button>

      <button
        onClick={() => navigate('/explore')}
        className="flex flex-col items-center justify-center gap-1 transition-all"
      >
        <Search
          className="w-6 h-6"
          style={{ color: isActive('/explore') ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        />
      </button>

      <button
        onClick={() => navigate('/create')}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: 'var(--text-primary)' }}
      >
        <Plus className="w-6 h-6" style={{ color: 'var(--bg-primary)' }} />
      </button>

      <button
        onClick={() => navigate('/notifications')}
        className="flex flex-col items-center justify-center gap-1 transition-all"
      >
        <Bell
          className="w-6 h-6"
          style={{ color: isActive('/notifications') ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          fill={isActive('/notifications') ? 'var(--text-primary)' : 'none'}
        />
      </button>

      <button
        onClick={() => navigate('/profile')}
        className="flex flex-col items-center justify-center gap-1 transition-all"
      >
        <User
          className="w-6 h-6"
          style={{ color: isActive('/profile') ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          fill={isActive('/profile') ? 'var(--text-primary)' : 'none'}
        />
      </button>
    </div>
  );
}
