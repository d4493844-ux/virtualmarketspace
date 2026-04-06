import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: Home,          label: 'Home',     path: '/' },
  { icon: Search,        label: 'Explore',  path: '/explore' },
  { icon: PlusSquare,    label: 'Post',     path: '/create' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: User,          label: 'Profile',  path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 24px)',
      maxWidth: 460,
      zIndex: 100,
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '7px 6px',          // ← reduced from 10px 8px
        borderRadius: 22,             // ← slightly tighter
        background: 'var(--nav-bg, rgba(255,255,255,0.92))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      }}>
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isPost   = label === 'Post';

          if (isPost) {
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                width: 44,            // ← down from 52
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(59,130,246,0.40)',
                transform: 'translateY(-3px)',  // ← down from -4px
                transition: 'all 0.2s cubic-bezier(0.34,1.3,0.64,1)',
                flexShrink: 0,
              }}>
                <Icon size={19} color="white" />  {/* ← down from 22 */}
              </button>
            );
          }

          return (
            <button key={path} onClick={() => navigate(path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2,                 // ← down from 3
              padding: '5px 12px',   // ← down from 6px 14px
              borderRadius: 14,
              border: 'none', cursor: 'pointer',
              background: isActive ? 'rgba(59,130,246,0.10)' : 'transparent',
              transition: 'all 0.15s ease', flexShrink: 0,
            }}>
              <Icon
                size={18}             /* ← down from 20 */
                color={isActive ? '#3b82f6' : 'var(--text-tertiary, #94a3b8)'}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span style={{
                fontSize: 9.5,        // ← down from 10
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#3b82f6' : 'var(--text-tertiary, #94a3b8)',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
