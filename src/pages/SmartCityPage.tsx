import { ArrowLeft, Rocket, Truck, Home as HomeIcon, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SmartCityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Smart City Vision
        </h1>
      </div>

      <div className="p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>
            <Rocket className="w-10 h-10" style={{ color: 'var(--bg-primary)' }} />
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            The Future of Commerce
          </h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Imagine a world where local markets meet cutting-edge technology
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Truck className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Drone Deliveries
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Order fresh peppers from Ada and have them delivered to your doorstep by drone within 30 minutes.
                  No traffic, no delays, just seamless delivery from local sellers directly to you.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <HomeIcon className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Smart Homes Integration
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Your smart home knows when you're running low on essentials. It automatically orders from your
                  favorite local sellers and schedules delivery when you're home. Mama Bisi's rice delivered before you even run out.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Zap className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Instant Commerce
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  See Zara's latest ankara dress in your feed? Try it on virtually using AR, customize the design,
                  and have it tailored and delivered the same day. The future of fashion is personal and instant.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Empowering Local Entrepreneurs
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            VMS bridges the gap between traditional Nigerian markets and tomorrow's technology. Every local pepper
            seller, shoemaker, and grocer gets access to tools that were once only available to big corporations.
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            From local stalls to global reach. From today's markets to tomorrow's smart cities.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            This vision is coming soon
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Built for Nigeria. Designed for the future.
          </p>
        </div>
      </div>
    </div>
  );
}
