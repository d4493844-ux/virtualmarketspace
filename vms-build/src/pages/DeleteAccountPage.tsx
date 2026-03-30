import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!confirm('Are you ABSOLUTELY sure? This action cannot be undone!')) {
      return;
    }

    setLoading(true);

    // Delete user data from database
    if (user) {
      await supabase.from('users').delete().eq('id', user.id);
    }

    // Sign out
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Delete Account</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-600">Warning: Permanent Action</h2>
          <p className="text-sm text-red-700">Deleting your account will permanently remove all your data and cannot be undone.</p>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>What will be deleted:</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Your profile and all personal information</li>
            <li>• All your posts, comments, and likes</li>
            <li>• Your products and sales history</li>
            <li>• All messages and conversations</li>
            <li>• Your followers and following lists</li>
            <li>• Verification status and subscriptions</li>
          </ul>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Type <span className="font-bold text-red-500">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="Type DELETE here"
          />

          <button
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || loading}
            className="w-full py-3 rounded-full font-bold flex items-center justify-center gap-2"
            style={{
              backgroundColor: confirmText === 'DELETE' ? '#ef4444' : '#9ca3af',
              color: 'white',
              opacity: loading ? 0.6 : 1,
              cursor: confirmText === 'DELETE' && !loading ? 'pointer' : 'not-allowed'
            }}
          >
            <Trash2 className="w-5 h-5" />
            {loading ? 'Deleting Account...' : 'Delete My Account Forever'}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/settings')}
            className="text-sm font-medium"
            style={{ color: '#3b82f6' }}
          >
            Cancel - Go Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
