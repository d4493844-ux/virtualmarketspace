import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    const checkPrompt = () => {
      const p = (window as any).__pwaInstallPrompt;
      if (p && !localStorage.getItem('vms-pwa-dismissed')) {
        setPrompt(p);
        setShow(true);
      }
    };
    // Check after 3 seconds
    const t = setTimeout(checkPrompt, 3000);
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      checkPrompt();
    });
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('vms-pwa-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 9000,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: 16, padding: '14px 16px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <img
        src="https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_1_numxrq.jpg"
        alt="VMS"
        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Install VMS App</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
          Get the full experience — faster, offline-ready
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#fff', color: '#0a0a0a',
          border: 'none', borderRadius: 10, padding: '8px 14px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}
      >
        <Download size={14} /> Install
      </button>
      <button
        onClick={handleDismiss}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
