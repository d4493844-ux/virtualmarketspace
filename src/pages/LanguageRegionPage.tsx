import { useState } from 'react';
import { ArrowLeft, Check, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LanguageRegionPage() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('en-NG');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');

  const languages = [
    { code: 'en-NG', name: 'English (Nigeria)', flag: '🇳🇬' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  ];

  const currencies = [
    { code: 'NGN', name: 'Nigerian Naira (₦)', symbol: '₦' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Language & Region</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>LANGUAGE</h2>
          </div>
          {languages.map((lang) => (
            <button key={lang.code} onClick={() => setSelectedLanguage(lang.code)} className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{lang.name}</p>
              </div>
              {selectedLanguage === lang.code && <Check className="w-5 h-5" style={{ color: '#3b82f6' }} />}
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>CURRENCY</h2>
          </div>
          {currencies.map((currency) => (
            <button key={currency.code} onClick={() => setSelectedCurrency(currency.code)} className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {currency.symbol}
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{currency.name}</p>
              </div>
              {selectedCurrency === currency.code && <Check className="w-5 h-5" style={{ color: '#3b82f6' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
