import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader, BadgeCheck, Shield, AlertCircle, User, Phone, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Step = 'info' | 'selfie' | 'review' | 'submitted';

export default function RiderApplyPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [ninVerifying, setNinVerifying] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [ninError, setNinError] = useState('');

  const [form, setForm] = useState({
    full_name: user?.display_name || '',
    nin: '',
    phone: '',
    address: '',
    vehicle_type: 'bike',
  });

  // Selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  // ── NIN verification (simulated — in production connect to NIMC API) ──────
  // Real integration: POST to https://api.verified.africa/sfx-verify/v3/id-service/
  // with nin, firstname, lastname and your API key
  const verifyNIN = async () => {
    if (form.nin.length !== 11) { setNinError('NIN must be exactly 11 digits'); return; }
    if (!form.full_name.trim()) { setNinError('Enter your full name first'); return; }
    setNinVerifying(true);
    setNinError('');

    // Simulate verification delay (replace with real NIMC/Verified Africa API call)
    await new Promise(r => setTimeout(r, 2000));

    // Mock: in production this would be the actual API response
    // Real response would confirm if name matches NIN records
    const mockSuccess = form.nin.startsWith('1') || form.nin.startsWith('2') || form.nin.startsWith('3');

    if (mockSuccess) {
      setNinVerified(true);
    } else {
      setNinError('NIN could not be verified. Check your details and try again.');
    }
    setNinVerifying(false);
  };

  // ── SUBMIT APPLICATION ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    let selfieUrl: string | null = null;

    // Upload selfie
    if (selfieFile) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const ext  = selfieFile.name.split('.').pop() || 'jpg';
      const path = `rider-selfies/${user.id}-${Date.now()}.${ext}`;

      const res = await fetch(`${supabaseUrl}/storage/v1/object/media/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': selfieFile.type,
        },
        body: selfieFile,
      });
      if (res.ok) selfieUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;
    }

    const { error } = await supabase.from('rider_applications').upsert({
      user_id:      user.id,
      full_name:    form.full_name,
      nin:          form.nin,
      phone:        form.phone,
      address:      form.address,
      vehicle_type: form.vehicle_type,
      selfie_url:   selfieUrl,
      nin_verified: ninVerified,
      status:       'pending',
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    setLoading(false);

    if (!error) {
      setStep('submitted');
    } else {
      alert('Error submitting application: ' + error.message);
    }
  };

  // ── SUBMITTED SCREEN ─────────────────────────────────────────────────────
  if (step === 'submitted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#dcfce7' }}>
          <BadgeCheck className="w-10 h-10" style={{ color: '#16a34a' }} />
        </div>
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>Application Submitted!</h2>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          Your rider application is under review. Our team will verify your NIN and selfie within 24–48 hours.
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          You'll receive a notification once approved.
        </p>
        <button onClick={() => navigate(-1)}
          className="w-full py-4 rounded-full font-bold"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => step === 'info' ? navigate(-1) : setStep('info')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Rider Application</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Step {step === 'info' ? 1 : step === 'selfie' ? 2 : 3} of 3
          </p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {['info', 'selfie', 'review'].map((s, i) => (
          <div key={s} className="flex-1 h-1.5 rounded-full"
            style={{ backgroundColor: ['info','selfie','review'].indexOf(step) >= i ? '#3b82f6' : 'var(--border-color)' }} />
        ))}
      </div>

      <div className="p-4 space-y-5">

        {/* ── STEP 1: Personal Info + NIN ── */}
        {step === 'info' && (
          <>
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Your NIN and personal details are encrypted and used only for identity verification. They are never shared with third parties.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                <User className="w-4 h-4 inline mr-1" />Full Legal Name *
              </label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                placeholder="As it appears on your NIN slip" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard className="w-4 h-4 inline mr-1" />NIN (National Identification Number) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text" value={form.nin} maxLength={11}
                  onChange={e => { setForm({...form, nin: e.target.value.replace(/\D/g,'')}); setNinVerified(false); setNinError(''); }}
                  className="flex-1 px-4 py-3 rounded-xl font-mono text-lg tracking-widest"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: `1px solid ${ninVerified ? '#22c55e' : ninError ? '#ef4444' : 'var(--border-color)'}` }}
                  placeholder="00000000000" />
                <button type="button" onClick={verifyNIN} disabled={ninVerifying || ninVerified || form.nin.length !== 11}
                  className="px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: ninVerified ? '#22c55e' : '#3b82f6', color: 'white',
                    opacity: (ninVerifying || form.nin.length !== 11) && !ninVerified ? 0.6 : 1,
                  }}>
                  {ninVerifying ? <Loader className="w-4 h-4 animate-spin" /> : ninVerified ? <BadgeCheck className="w-4 h-4" /> : 'Verify'}
                </button>
              </div>
              {ninError && <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>{ninError}</p>}
              {ninVerified && <p className="text-xs mt-1.5 font-semibold" style={{ color: '#22c55e' }}>✓ NIN verified successfully</p>}
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Enter your 11-digit NIN then tap Verify</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                <Phone className="w-4 h-4 inline mr-1" />Phone Number *
              </label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required
                className="w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                placeholder="080XXXXXXXX" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                <MapPin className="w-4 h-4 inline mr-1" />Home Address *
              </label>
              <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} required rows={2}
                className="w-full px-4 py-3 rounded-xl resize-none"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                placeholder="Full address including street, area, city" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Vehicle Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {[{v:'bike',l:'🛵 Bike'},{v:'car',l:'🚗 Car'},{v:'drone',l:'🚁 Drone'}].map(({v,l}) => (
                  <button key={v} type="button" onClick={() => setForm({...form, vehicle_type: v})}
                    className="py-3 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: form.vehicle_type === v ? '#3b82f6' : 'var(--bg-secondary)', color: form.vehicle_type === v ? 'white' : 'var(--text-primary)', border: `1px solid ${form.vehicle_type === v ? '#3b82f6' : 'var(--border-color)'}` }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.full_name || !form.nin || !form.phone || !form.address) { alert('Fill all required fields'); return; }
                if (!ninVerified) { alert('Please verify your NIN first'); return; }
                setStep('selfie');
              }}
              className="w-full py-4 rounded-full font-bold"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              Continue →
            </button>
          </>
        )}

        {/* ── STEP 2: Selfie / Face Verification ── */}
        {step === 'selfie' && (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <Camera className="w-8 h-8" style={{ color: '#3b82f6' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Take a Selfie</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We need a clear photo of your face to verify your identity matches your NIN. Make sure your face is well-lit and clearly visible.
              </p>
            </div>

            {selfiePreview ? (
              <div className="relative rounded-2xl overflow-hidden aspect-square mx-auto max-w-xs">
                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="block w-full aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Camera className="w-12 h-12 mb-3" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tap to take photo</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>or upload from gallery</p>
                <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfie} />
              </label>
            )}

            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {['Face clearly visible and well-lit','No hats, glasses or face coverings','Plain background preferred','Match the face on your NIN document'].map(tip => (
                <div key={tip} className="flex items-center gap-2 py-1">
                  <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
                </div>
              ))}
            </div>

            <button onClick={() => { if (!selfieFile) { alert('Please take a selfie first'); return; } setStep('review'); }}
              className="w-full py-4 rounded-full font-bold"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              Continue →
            </button>
          </>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 'review' && (
          <>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Review Application</h3>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {[
                { label: 'Full Name',      value: form.full_name },
                { label: 'NIN',            value: `${form.nin.slice(0,3)}****${form.nin.slice(-4)}` },
                { label: 'NIN Status',     value: ninVerified ? '✅ Verified' : '⚠️ Not verified' },
                { label: 'Phone',          value: form.phone },
                { label: 'Address',        value: form.address },
                { label: 'Vehicle',        value: form.vehicle_type },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <p className="text-sm w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>

            {selfiePreview && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Selfie</p>
                <img src={selfiePreview} alt="Selfie preview" className="w-24 h-24 rounded-2xl object-cover" />
              </div>
            )}

            <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ca8a04' }} />
              <p className="text-xs" style={{ color: '#92400e' }}>
                By submitting, you confirm all information is accurate and truthful. False information will result in permanent ban from the VMS rider programme.
              </p>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-4 rounded-full font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)', opacity: loading ? 0.6 : 1 }}>
              {loading ? <><Loader className="w-5 h-5 animate-spin" />Submitting…</> : 'Submit Application'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
