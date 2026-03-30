import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'out'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'out' ? 0 : 1,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 110, height: 110, borderRadius: '28px',
          overflow: 'hidden', boxShadow: '0 0 60px rgba(255,255,255,0.15)',
          transform: phase === 'logo' ? 'scale(0.7)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <img
          src="https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_1_numxrq.jpg"
          alt="VMS Logo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Brand text */}
      <div
        style={{
          marginTop: 24, textAlign: 'center',
          opacity: phase === 'logo' ? 0 : 1,
          transform: phase === 'logo' ? 'translateY(12px)' : 'translateY(0)',
          transition: 'all 0.5s ease',
        }}
      >
        <div style={{
          fontSize: 28, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.5px', lineHeight: 1,
        }}>VMS</div>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.45)',
          letterSpacing: '3px', textTransform: 'uppercase',
          marginTop: 6, fontWeight: 500,
        }}>by Mobtech</div>
      </div>

      {/* Subtle loader bar */}
      <div style={{
        position: 'absolute', bottom: 60,
        width: 40, height: 3, borderRadius: 2,
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'rgba(255,255,255,0.6)',
          animation: 'vms-bar 2s ease forwards',
        }} />
      </div>

      <style>{`
        @keyframes vms-bar {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
