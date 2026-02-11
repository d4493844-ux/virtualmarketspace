import { useState } from 'react';
import { ArrowLeft, Save, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ContactInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', user.id);

    setLoading(false);

    if (!error) {
      alert('Phone number updated successfully!');
      navigate('/settings');
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Contact Information</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Email Address</h3>
          </div>
          <input type="email" value={email} disabled className="w-full px-4 py-3 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} />
          <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
            <Check className="w-4 h-4" />
            Verified
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Contact support to change your email address</p>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Phone Number</h3>
          </div>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="+234 XXX XXX XXXX" />
          <button onClick={handleSave} disabled={loading} className="w-full py-3 rounded-full font-medium flex items-center justify-center gap-2" style={{ backgroundColor: '#3b82f6', color: 'white', opacity: loading ? 0.6 : 1 }}>
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
