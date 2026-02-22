import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Calendar, DollarSign, CreditCard, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function CreateAdPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    description: '',
    budget: '',
    daily_budget: '',
    duration_days: '7',
    target_age: 'all',
    target_gender: 'all',
    target_location: 'nigeria',
  });

  useEffect(() => {
    loadProducts();
    
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, title, price, images')
      .eq('seller_id', user.id);
    
    if (data) setProducts(data as Product[]);
  };

  const calculateTotal = () => {
    const budget = parseFloat(formData.budget) || 0;
    return budget;
  };

  const handlePayment = async () => {
    if (!user?.email) {
      alert('Please add an email to your profile');
      return;
    }

    if (!formData.product_id || !formData.title || !formData.budget) {
      alert('Please fill all required fields');
      return;
    }

    setPaymentLoading(true);

    const totalAmount = calculateTotal();
    const reference = `AD-${user.id}-${Date.now()}`;

    // Create ad campaign
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(formData.duration_days));

    const { data: adCampaign, error: insertError } = await supabase
      .from('ads')
      .insert({
        seller_id: user.id,
        product_id: formData.product_id,
        title: formData.title,
        description: formData.description,
        budget: totalAmount,
        daily_budget: parseFloat(formData.daily_budget) || totalAmount / parseInt(formData.duration_days),
        target_audience: {
          age: formData.target_age,
          gender: formData.target_gender,
          location: formData.target_location,
        },
        status: 'pending_payment',
        payment_reference: reference,
        payment_status: 'pending',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      alert('Error creating ad campaign');
      setPaymentLoading(false);
      return;
    }

    // Initialize Paystack
    const handler = window.PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: totalAmount * 100, // Kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id
          },
          {
            display_name: "Ad Campaign",
            variable_name: "ad_id",
            value: adCampaign.id
          }
        ]
      },
      callback: async (response: any) => {
        await supabase
          .from('ads')
          .update({ 
            payment_status: 'paid',
            status: 'active'
          })
          .eq('id', adCampaign.id);

        alert('✅ Ad campaign created successfully!');
        navigate('/ads/dashboard');
      },
      onClose: () => {
        setPaymentLoading(false);
      }
    });

    handler?.openIframe();
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Ad Campaign</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Select Product *</label>
          <select
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            required
          >
            <option value="">Choose a product to promote</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.title} - ₦{product.price.toLocaleString()}</option>
            ))}
          </select>
          
          {selectedProduct && (
            <div className="mt-3 rounded-xl p-3 flex gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <img src={selectedProduct.images[0]} alt="" className="w-20 h-20 rounded-lg object-cover" />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProduct.title}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>₦{selectedProduct.price.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Details */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Campaign Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Fresh Peppers Summer Sale"
            className="w-full px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Describe your promotion..."
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        {/* Budget & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Total Budget (₦) *</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="10000"
              min="5000"
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Minimum: ₦5,000</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Duration (days) *</label>
            <select
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
              className="w-full px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
        </div>

        {/* Targeting */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: '#3b82f6' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Target Audience</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Age Range</label>
              <select
                value={formData.target_age}
                onChange={(e) => setFormData({ ...formData, target_age: e.target.value })}
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="all">All Ages</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45+">45+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Gender</label>
              <select
                value={formData.target_gender}
                onChange={(e) => setFormData({ ...formData, target_gender: e.target.value })}
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Location</label>
              <select
                value={formData.target_location}
                onChange={(e) => setFormData({ ...formData, target_location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="nigeria">All Nigeria</option>
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
                <option value="portharcourt">Port Harcourt</option>
                <option value="ibadan">Ibadan</option>
                <option value="kano">Kano</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Campaign Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Budget</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₦{calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.duration_days} days</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Daily Budget</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                ₦{(calculateTotal() / parseInt(formData.duration_days || '1')).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handlePayment}
          disabled={loading || paymentLoading || !formData.product_id || !formData.title || !formData.budget}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: '#3b82f6', color: 'white', opacity: (loading || paymentLoading) ? 0.6 : 1 }}
        >
          {paymentLoading ? (
            <><Loader className="w-5 h-5 animate-spin" /> Processing Payment...</>
          ) : (
            <><CreditCard className="w-5 h-5" /> Pay ₦{calculateTotal().toLocaleString()} & Launch Campaign</>
          )}
        </button>
      </div>
    </div>
  );
}