import { useState } from 'react';
import { ArrowLeft, Plus, MapPin, Home, Briefcase, Edit2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Address {
  id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function AddressBookPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      type: 'home',
      fullName: 'John Doe',
      phone: '+234 801 234 5678',
      address: '15 Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      isDefault: true,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    type: 'home' as 'home' | 'work' | 'other',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: Date.now().toString(),
      ...formData,
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddress]);
    resetForm();
  };

  const handleEditAddress = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label,
      type: addr.type,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
    });
    setShowAddForm(true);
  };

  const handleUpdateAddress = () => {
    setAddresses(addresses.map(addr => 
      addr.id === editingId 
        ? { ...addr, ...formData }
        : addr
    ));
    resetForm();
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('Delete this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      label: '',
      type: 'home',
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
    });
  };

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
            <div key={addr.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: addr.isDefault ? '2px solid #3b82f6' : 'none' }}>
              {addr.isDefault && (
                <div className="inline-block px-2 py-1 rounded-full text-xs font-medium mb-2" style={{ backgroundColor: '#3b82f6', color: 'white' }}>DEFAULT</div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {getIcon(addr.type)}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{addr.label}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{addr.fullName}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{addr.phone}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{addr.address}, {addr.city}, {addr.state}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditAddress(addr)} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <Edit2 className="w-4 h-4" />Edit
                </button>
                {!addr.isDefault && (
                  <button onClick={() => handleDeleteAddress(addr.id)} className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: '#ef4444' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <input type="text" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="Label (e.g., Home)" className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Full Name" className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Street Address" className="w-full px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              
              <div className="flex gap-2">
                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" className="flex-1 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                
                <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="State" className="flex-1 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              </div>

              <button onClick={editingId ? handleUpdateAddress : handleAddAddress} className="w-full py-3 rounded-full font-medium" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                {editingId ? 'Update Address' : 'Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
