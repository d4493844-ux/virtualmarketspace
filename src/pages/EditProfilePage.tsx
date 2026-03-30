import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Save, User, MapPin, FileText, Briefcase, Phone, Loader, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface InputRowProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

function InputRow({ label, icon, value, onChange, placeholder, multiline, maxLength }: InputRowProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[13px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--brand)' }}>{icon}</span>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={maxLength}
          placeholder={placeholder}
          className="input-field resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="input-field"
        />
      )}
      {maxLength && (
        <p className="text-right text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    business_type: user?.business_type || '',
    phone: user?.phone || '',
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreviewAvatar(reader.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `avatars/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filename, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filename);

      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      await refreshUser();
    } catch (err: any) {
      alert('Error uploading avatar: ' + err.message);
      setPreviewAvatar(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.display_name.trim()) {
      alert('Display name is required');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update(formData)
      .eq('id', user.id);

    setLoading(false);

    if (!error) {
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Error updating profile: ' + error.message);
    }
  };

  const avatarSrc = previewAvatar || user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[13px]"
          style={{ background: saved ? 'rgba(16,185,129,0.12)' : 'var(--brand)', color: saved ? '#059669' : 'white' }}
        >
          {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Avatar section */}
        <div className="flex flex-col items-center py-4 animate-scale-in">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden"
              style={{ border: '3px solid var(--border-strong)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              {avatarUploading ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--brand)' }} />
                </div>
              ) : (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=200';
                  }}
                />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="text-[12px] mt-3" style={{ color: 'var(--text-tertiary)' }}>
            Tap the camera to change your photo
          </p>
        </div>

        {/* Form */}
        <div className="card p-5 space-y-5 animate-slide-up">
          <InputRow
            label="Display Name"
            icon={<User className="w-4 h-4" />}
            value={formData.display_name}
            onChange={(v) => setFormData({ ...formData, display_name: v })}
            placeholder="Your name"
            maxLength={50}
          />
          <InputRow
            label="Bio"
            icon={<FileText className="w-4 h-4" />}
            value={formData.bio}
            onChange={(v) => setFormData({ ...formData, bio: v })}
            placeholder="Tell people about yourself..."
            multiline
            maxLength={200}
          />
          <InputRow
            label="Location"
            icon={<MapPin className="w-4 h-4" />}
            value={formData.location}
            onChange={(v) => setFormData({ ...formData, location: v })}
            placeholder="Lagos, Nigeria"
          />
          <InputRow
            label="Phone"
            icon={<Phone className="w-4 h-4" />}
            value={formData.phone}
            onChange={(v) => setFormData({ ...formData, phone: v })}
            placeholder="+234 XXX XXX XXXX"
          />
          {user?.is_seller && (
            <div>
              <label className="flex items-center gap-2 text-[13px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Briefcase className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                Business Type
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="input-field"
                style={{ appearance: 'none' }}
              >
                <option value="">Select business type</option>
                <option value="fashion">Fashion & Clothing</option>
                <option value="electronics">Electronics & Gadgets</option>
                <option value="food">Food & Beverages</option>
                <option value="beauty">Beauty & Cosmetics</option>
                <option value="home">Home & Living</option>
                <option value="health">Health & Wellness</option>
                <option value="books">Books & Education</option>
                <option value="sports">Sports & Fitness</option>
                <option value="auto">Auto & Vehicles</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full py-4 text-[15px] flex items-center justify-center gap-2 animate-slide-up"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
