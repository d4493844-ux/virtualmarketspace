import { ArrowLeft, FileText, Shield, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LegalPoliciesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Legal & Policies</h1>
      </div>

      <div className="p-4 space-y-3">
        <button className="w-full rounded-2xl p-5 flex items-center gap-4 hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Terms of Service</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>User agreement and platform rules</p>
          </div>
        </button>

        <button className="w-full rounded-2xl p-5 flex items-center gap-4 hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Privacy Policy</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How we handle your data</p>
          </div>
        </button>

        <button className="w-full rounded-2xl p-5 flex items-center gap-4 hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Eye className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Cookie Policy</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How we use cookies</p>
          </div>
        </button>

        <button className="w-full rounded-2xl p-5 flex items-center gap-4 hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <AlertCircle className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Community Guidelines</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rules for using VMS</p>
          </div>
        </button>

        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Last updated: February 10, 2026</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>© 2026 VMS - Virtual Market Space. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
