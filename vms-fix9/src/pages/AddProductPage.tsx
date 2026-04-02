import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Upload, Loader, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  'Food & Groceries', 'Fashion & Accessories', 'Electronics',
  'Home & Garden', 'Health & Beauty', 'Services', 'Other',
];

const WEIGHT_CLASSES = [
  { value: 'small',  label: 'Small',  desc: 'Under 2kg — documents, small items' },
  { value: 'medium', label: 'Medium', desc: '2–10kg — clothing, small appliances' },
  { value: 'heavy',  label: 'Heavy',  desc: 'Over 10kg — furniture, bulky goods' },
];

export default function AddProductPage() {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [stock, setStock]           = useState('');
  const [sku, setSku]               = useState('');
  const [category, setCategory]     = useState('');
  const [weightClass, setWeightClass] = useState('small');
  const [pickupLocation, setPickupLocation] = useState('');

  // Image upload state — supports up to 5 images
  const [imageFiles, setImageFiles]     = useState<(File | null)[]>([null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImagePick = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }

    const newFiles    = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index]    = file;
    newPreviews[index] = URL.createObjectURL(file);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const addImageSlot = () => {
    if (imageFiles.length >= 5) return;
    setImageFiles([...imageFiles, null]);
    setImagePreviews([...imagePreviews, null]);
  };

  const removeImage = (index: number) => {
    const newFiles    = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles.length ? newFiles : [null]);
    setImagePreviews(newPreviews.length ? newPreviews : [null]);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user) return [];
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const urls: string[] = [];

    for (const file of imageFiles) {
      if (!file) continue;
      const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path     = `product-images/${fileName}`;

      const res = await fetch(`${supabaseUrl}/storage/v1/object/media/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (res.ok) {
        urls.push(`${supabaseUrl}/storage/v1/object/public/media/${path}`);
      } else {
        console.error('Image upload failed:', await res.text());
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    const hasImage = imageFiles.some(f => f !== null);
    if (!hasImage) { setError('Please add at least one product image'); return; }

    setLoading(true);
    setUploadingImages(true);

    const imageUrls = await uploadImages();
    setUploadingImages(false);

    if (imageUrls.length === 0) {
      setError('Failed to upload images. Please try again.');
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from('products').insert({
      seller_id:      user.id,
      title:          title.trim(),
      description:    description.trim(),
      price:          parseFloat(price),
      stock:          parseInt(stock),
      sku:            sku.trim() || null,
      category:       category || null,
      weight_class:   weightClass,
      pickup_location: pickupLocation.trim() || null,
      images:         imageUrls,
      // NOTE: no delivery_fee — delivery is handled dynamically by the delivery system
    });

    setLoading(false);

    if (!dbError) {
      navigate('/catalogue');
    } else {
      console.error('Product insert error:', dbError);
      setError('Error saving product: ' + dbError.message);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate('/catalogue')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Product</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">

        {/* Error banner */}
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* ── IMAGE UPLOAD ── */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Product Images * <span className="font-normal text-xs" style={{ color: 'var(--text-secondary)' }}>(up to 5)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1.5px dashed var(--border-color)' }}>
                {preview ? (
                  <>
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="w-7 h-7 mb-1" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Add photo</span>
                    <input
                      type="file" accept="image/*" className="hidden"
                      ref={el => { fileInputRefs.current[i] = el; }}
                      onChange={e => handleImagePick(i, e)}
                    />
                  </label>
                )}
              </div>
            ))}

            {/* Add more slot */}
            {imageFiles.length < 5 && (
              <button type="button" onClick={addImageSlot}
                className="aspect-square rounded-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1.5px dashed var(--border-color)' }}>
                <Plus className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>More</span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Product Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="e.g., Fresh Scotch Bonnet Peppers" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="Describe your product..." />
        </div>

        {/* Price + Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Price (₦) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01"
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              placeholder="1500" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Stock *</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} required min="0"
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              placeholder="50" />
          </div>
        </div>

        {/* Category + SKU */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>SKU <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>(optional)</span></label>
            <input type="text" value={sku} onChange={e => setSku(e.target.value)}
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              placeholder="SKU-001" />
          </div>
        </div>

        {/* Weight class */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Package Weight <span className="font-normal text-xs" style={{ color: 'var(--text-secondary)' }}>(helps calculate delivery price)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {WEIGHT_CLASSES.map(w => (
              <button key={w.value} type="button" onClick={() => setWeightClass(w.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: weightClass === w.value ? '#3b82f6' : 'var(--bg-secondary)',
                  color: weightClass === w.value ? 'white' : 'var(--text-primary)',
                  border: `1.5px solid ${weightClass === w.value ? '#3b82f6' : 'var(--border-color)'}`,
                }}>
                <p className="font-bold text-sm">{w.label}</p>
                <p className="text-xs mt-0.5 opacity-75">{w.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Pickup location */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Pickup Location <span className="font-normal text-xs" style={{ color: 'var(--text-secondary)' }}>(where rider collects from)</span>
          </label>
          <input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            placeholder="e.g., 12 Balogun St, Lagos Island" />
        </div>

        {/* Upload status */}
        {uploadingImages && (
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Loader className="w-5 h-5 animate-spin" style={{ color: '#3b82f6' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Uploading images…</p>
          </div>
        )}

        <button type="submit" disabled={loading || uploadingImages}
          className="w-full py-4 rounded-full font-bold text-lg"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)', opacity: loading ? 0.6 : 1 }}>
          {loading ? (uploadingImages ? 'Uploading Images…' : 'Saving Product…') : 'Add Product'}
        </button>

      </form>
    </div>
  );
}
