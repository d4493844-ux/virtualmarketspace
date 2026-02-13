import { useState } from 'react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth(); // Need refreshUser function
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    business_type: user?.business_type || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update(formData)
      .eq('id', user.id);

    setLoading(false);

    if (!error) {
      // REFRESH USER DATA
      if (refreshUser) await refreshUser();
      alert('Profile updated successfully!');
      navigate('/profile');
    } else {
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h1>
        <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-full font-medium flex items-center gap-2" style={{ backgroundColor: '#3b82f6', color: 'white', opacity: loading ? 0.6 : 1 }}>
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <img src={user?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200'} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Tap to change photo</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Display Name</label>
          <input type="text" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Bio</label>
          <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl resize-none" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="Tell people about yourself..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Location</label>
          <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="Lagos, Nigeria" />
        </div>

        {user?.is_seller && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Business Type</label>
            <input type="text" value={formData.business_type} onChange={(e) => setFormData({ ...formData, business_type: e.target.value })} className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="e.g., Fashion & Accessories" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
          <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="+234 XXX XXX XXXX" />
        </div>
      </div>
    </div>
  );
}