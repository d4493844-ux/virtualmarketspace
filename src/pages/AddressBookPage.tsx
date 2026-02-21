import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Home, Briefcase, Edit2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Address {
  id: string;
  user_id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at?: string;
}

export default function AddressBookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    type: 'home' as 'home' | 'work' | 'other',
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAddresses(data as Address[]);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    setSaving(true);

    const newAddress = {
      user_id: user.id,
      ...formData,
      is_default: addresses.length === 0,
    };

    const { data, error } = await supabase
      .from('addresses')
      .insert([newAddress])
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      setAddresses([data as Address, ...addresses]);
      resetForm();
      alert('Address added successfully!');
    } else {
      alert('Error adding address');
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label,
      type: addr.type,
      full_name: addr.full_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
    });
    setShowAddForm(true);
  };

  const handleUpdateAddress = async () => {
    if (!editingId) return;
    setSaving(true);

    const { error } = await supabase
      .from('addresses')
      .update(formData)
      .eq('id', editingId);

    setSaving(false);

    if (!error) {
      setAddresses(addresses.map(addr => 
        addr.id === editingId ? { ...addr, ...formData } : addr
      ));
      resetForm();
      alert('Address updated successfully!');
    } else {
      alert('Error updating address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      setAddresses(addresses.filter(addr => addr.id !== id));
      alert('Address deleted!');
    } else {
      alert('Error deleting address');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      label: '',
      type: 'home',
      full_name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Address Book</h1>
        </div>
        <button onClick={() => setShowAddForm(true)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No Saved Addresses</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Add a delivery address to get started</p>
            <button onClick={() => setShowAddForm(true)} className="px-6 py-2 rounded-full font-medium" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: addr.is_default ? '2px solid #3b82f6' : 'none' }}>
              {addr.is_default && (
                <div className="inline-block px-2 py-1 rounded-full text-xs font-medium mb-2" style={{ backgroundColor: '#3b82f6', color: 'white' }}>DEFAULT</div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {getIcon(addr.type)}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{addr.label}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{addr.full_name}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{addr.phone}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{addr.address}, {addr.city}, {addr.state}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditAddress(addr)} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <Edit2 className="w-4 h-4" />Edit
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleDeleteAddress(addr.id)} className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: '#ef4444' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal - FIXED STYLING */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={resetForm} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Label</label>
                <input 
                  type="text" 
                  value={formData.label} 
                  onChange={(e) => setFormData({...formData, label: e.target.value})} 
                  placeholder="e.g., Home, Office" 
                  className="w-full px-4 py-3 rounded-xl text-base" 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Type</label>
                <div className="flex gap-2">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, type})}
                      className="flex-1 py-2 rounded-lg text-sm font-medium capitalize"
                      style={{
                        backgroundColor: formData.type === type ? '#3b82f6' : 'var(--bg-secondary)',
                        color: formData.type === type ? 'white' : 'var(--text-primary)',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="John Doe" 
                  className="w-full px-4 py-3 rounded-xl text-base" 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+234 XXX XXX XXXX" 
                  className="w-full px-4 py-3 rounded-xl text-base" 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Street Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="15 Admiralty Way" 
                  className="w-full px-4 py-3 rounded-xl text-base" 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)' 
                  }} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>City</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                    placeholder="Lagos" 
                    className="w-full px-4 py-3 rounded-xl text-base" 
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)' 
                    }} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>State</label>
                  <input 
                    type="text" 
                    value={formData.state} 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                    placeholder="Lagos" 
                    className="w-full px-4 py-3 rounded-xl text-base" 
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)' 
                    }} 
                  />
                </div>
              </div>

              <button 
                onClick={editingId ? handleUpdateAddress : handleAddAddress} 
                disabled={saving}
                className="w-full py-4 rounded-xl font-medium text-base"
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : (editingId ? 'Update Address' : 'Add Address')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}