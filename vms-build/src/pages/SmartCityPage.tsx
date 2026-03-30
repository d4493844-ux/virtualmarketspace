import { ArrowLeft, Rocket, Truck, Home as HomeIcon, Zap, Smartphone, Shield, TrendingUp, Users, Cpu, Wifi, Package, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SmartCityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
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

      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            The Future of Commerce
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            VMS is pioneering the next generation of marketplace technology, bringing smart city infrastructure to Nigerian entrepreneurs
          </p>
        </div>

        {/* Vision Statement */}
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
          <h3 className="text-xl font-bold mb-3 text-white">
            Our Vision
          </h3>
          <p className="text-sm leading-relaxed text-white opacity-90">
            To transform Nigeria's vibrant local markets into connected, intelligent commerce ecosystems where every entrepreneur—from Ada selling peppers in Lagos to Chidi crafting shoes in Aba—has access to world-class technology that was once reserved for global corporations.
          </p>
        </div>

        {/* Core Technologies */}
        <div>
          <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Smart City Technologies
          </h3>
          
          <div className="space-y-4">
            {/* Drone Delivery */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Autonomous Drone Delivery
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#3b82f6' }}>LAUNCHING 2027</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                Order fresh peppers from Ada at 2 PM, receive them by drone at 2:30 PM. Zero traffic delays, completely automated from warehouse to doorstep. Our AI-powered fleet navigates Lagos traffic from above.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  ⚡ 30-min delivery
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🎯 GPS precision
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🔋 Eco-friendly
                </div>
              </div>
            </div>

            {/* Smart Home Integration */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }}>
                  <HomeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Smart Home Commerce Hub
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#8b5cf6' }}>LAUNCHING 2026</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                Your refrigerator detects you're low on Mama Bisi's rice. It automatically adds it to your VMS cart. Your home AI knows your schedule and arranges delivery when you're home. Never run out of essentials again.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🏠 IoT Integration
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🤖 AI Shopping
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  📱 Voice Control
                </div>
              </div>
            </div>

            {/* AR Try-On */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ec4899' }}>
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    AR Virtual Try-On & Customization
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#ec4899' }}>BETA AVAILABLE NOW</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                See Zara's latest ankara design? Point your camera, try it on virtually, adjust the fit, change colors, add custom embroidery. Order with one tap. Same-day tailoring and delivery. Fashion, personalized.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  👗 Virtual fitting
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🎨 Live customization
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  ✂️ Same-day tailoring
                </div>
              </div>
            </div>

            {/* AI Shopping Assistant */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#10b981' }}>
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    AI-Powered Shopping Assistant
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#10b981' }}>ACTIVE NOW</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                "Find me the best deal on local rice within 5km" - Our AI instantly compares prices, quality ratings, delivery times, and seller reliability across thousands of sellers. Get personalized recommendations based on your buying history.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  💬 Chat support
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  💰 Price comparison
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  ⭐ Quality scores
                </div>
              </div>
            </div>

            {/* Blockchain Payments */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Blockchain-Secured Payments
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#f59e0b' }}>LAUNCHING Q4 2026</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                Instant, secure transactions with zero fraud. Smart contracts automatically release payment to sellers when delivery is confirmed. Support for cryptocurrency and mobile money integration.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🔐 Secure escrow
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  ⚡ Instant settlement
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🌍 Cross-border
                </div>
              </div>
            </div>

            {/* Smart Inventory */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6366f1' }}>
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Smart Inventory Management
                  </h4>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#6366f1' }}>FOR SELLERS • ACTIVE NOW</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                AI predicts demand for Ada's peppers based on weather, events, and buying patterns. Auto-restock alerts, waste reduction analytics, and optimal pricing suggestions help sellers maximize profits.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  📊 Demand forecast
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  🔔 Auto-restock
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  💡 Price optimization
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
            Projected Impact by 2028
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#3b82f6' }} />
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>1M+</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sellers Empowered</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} />
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>₦50B+</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Transaction Volume</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>15 min</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Delivery Time</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Star className="w-8 h-8 mx-auto mb-2" style={{ color: '#ec4899' }} />
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>20+</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cities Connected</p>
            </div>
          </div>
        </div>

        {/* Empowerment Message */}
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Empowering Every Nigerian Entrepreneur
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            VMS doesn't just connect buyers and sellers—we're building the infrastructure for Nigeria's digital economy. Every local pepper seller, shoemaker, and grocer gets access to enterprise-grade tools that level the playing field.
          </p>
          <div className="space-y-2 text-left mb-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#10b981' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <strong>From Local to Global:</strong> Sell to customers anywhere in Nigeria, soon across Africa
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#3b82f6' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <strong>Zero Barriers:</strong> No technical skills needed, we handle the complexity
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#f59e0b' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <strong>Fair Pricing:</strong> Low fees, instant payouts, transparent costs
              </p>
            </div>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            From market stalls to smart cities. From today's hustle to tomorrow's empire. 🇳🇬
          </p>
        </div>

        {/* Roadmap */}
        <div>
          <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Technology Roadmap
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                <div className="w-0.5 flex-1" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>2026 Q1-Q2</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#10b981', color: 'white' }}>ACTIVE</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI shopping assistant, smart inventory, advanced analytics</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <div className="w-0.5 flex-1" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>2026 Q3-Q4</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#3b82f6', color: 'white' }}>IN PROGRESS</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Smart home integration, blockchain payments, AR try-on v2</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                <div className="w-0.5 flex-1" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>2027 Q1-Q2</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>PLANNED</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drone delivery pilot (Lagos, Abuja), autonomous logistics hubs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>2027-2028</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>FUTURE</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nationwide drone network, pan-African expansion, Web3 integration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Join us in building the future of Nigerian commerce
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            🚀 Built in Nigeria. Designed for the future. Empowering millions.
          </p>
        </div>
      </div>
    </div>
  );
}