import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: PlusSquare, label: 'Post', path: '/create' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav
      className="bottom-nav"
      style={{ boxShadow: '0 -1px 0 var(--border-color), 0 -8px 32px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isPost = label === 'Post';

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 flex-1 py-1 relative transition-all active:scale-95"
            >
              {isPost ? (
                // Special "Post" button
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    boxShadow: isActive ? '0 4px 16px rgba(59,130,246,0.5)' : '0 2px 8px rgba(59,130,246,0.3)',
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <>
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    }}
                  >
                    <Icon
                      className="w-5 h-5 transition-all"
                      style={{
                        color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
                        strokeWidth: isActive ? 2.5 : 1.75,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-none transition-all"
                    style={{ color: isActive ? 'var(--brand)' : 'var(--text-tertiary)' }}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                      style={{ background: 'var(--brand)' }}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
