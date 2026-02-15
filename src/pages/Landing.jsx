import { Link } from 'react-router-dom'
import { Play, Shield, Sparkles, ArrowRight, Film, BookOpen, Users } from 'lucide-react'
import Logo from '../components/Logo'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 relative overflow-hidden">
      {/* Animated gradient orbs - Background layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-medflix-red to-pink-400 rounded-full opacity-30 blur-3xl animate-float-gentle"></div>
        <div className="absolute top-40 right-32 w-[500px] h-[500px] bg-gradient-to-br from-medflix-blue to-cyan-400 opacity-25 blur-3xl animate-float-gentle animation-delay-1000" style={{animationDuration: '8s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gradient-to-br from-medflix-yellow to-orange-300 rounded-full opacity-35 blur-3xl animate-float-gentle animation-delay-2000" style={{animationDuration: '10s'}}></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-gradient-to-br from-medflix-purple to-pink-400 rounded-full opacity-30 blur-3xl animate-float-gentle animation-delay-500" style={{animationDuration: '12s'}}></div>
        <div className="absolute bottom-20 left-32 w-72 h-72 bg-gradient-to-br from-cyan-400 to-medflix-blue rounded-full opacity-25 blur-3xl animate-float-gentle animation-delay-1500" style={{animationDuration: '9s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-orange-300 to-medflix-yellow rounded-full opacity-30 blur-3xl animate-float-gentle animation-delay-3000" style={{animationDuration: '11s'}}></div>
      </div>

      {/* Playful geometric shapes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-28 h-28 bg-medflix-red/[0.03] blur-2xl rounded-full animate-float-gentle"></div>
        <div className="absolute top-[20%] right-[15%] w-28 h-28 bg-medflix-blue/[0.03] blur-2xl" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
        <div className="absolute top-[50%] left-[20%] w-28 h-28 bg-medflix-yellow/[0.03] blur-2xl rounded-lg rotate-45 animate-float-gentle animation-delay-1000"></div>
        <div className="absolute top-[50%] right-[10%] w-28 h-28 bg-medflix-purple/[0.03] blur-2xl rounded-full animate-float-gentle animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[15%] w-28 h-28 bg-medflix-red/[0.02] blur-2xl rotate-45"></div>
        <div className="absolute bottom-[15%] right-[20%] w-28 h-28 bg-medflix-blue/[0.02] blur-2xl rounded-full animate-float-gentle animation-delay-500"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 relative z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" showText={true} />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/login"
              className="px-5 py-2 bg-gray-900 text-gray-100 rounded-lg text-sm font-medium hover:bg-black transition-all shadow-md border-2 border-gray-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with Background */}
      <section className="relative overflow-hidden z-10">
        {/* Hospital Background - Only in Hero */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url(/hospital-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6 animate-slideUp whitespace-nowrap">
            <span className="bg-gradient-to-r from-medflix-purple via-medflix-blue to-medflix-red bg-clip-text text-transparent">
              The Netflix for Healthcare
            </span>
          </h1>
          
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-12 leading-relaxed font-medium animate-slideUp animation-delay-200">
            Transform complex medical information into engaging, personalized video episodes that make learning about health intuitive and enjoyable.
          </p>

          {/* Professional Stats */}
          <div className="flex items-center justify-center gap-16 mb-12 animate-fadeIn animation-delay-500">
            <div className="text-center group">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-medflix-blue group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Clinically Reviewed</div>
              <div className="text-xs text-gray-500">Evidence-based content</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-2">
                <Film className="w-8 h-8 text-medflix-purple group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Visual Learning</div>
              <div className="text-xs text-gray-500">Animated episodes</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-medflix-red group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Patient-Centered</div>
              <div className="text-xs text-gray-500">Personalized content</div>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-medflix-purple to-medflix-blue text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 group animate-fadeIn animation-delay-700"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* How MedFlix Works */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How MedFlix Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From uploading medical records to daily personalized video lessons, 
            MedFlix makes learning about your health fun and easy!
          </p>
        </div>

        {/* Feature 1 - Video Player */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-4 overflow-hidden border-4 border-purple-200 shadow-xl">
            <img 
              src="/images/feature-video-player.png" 
              alt="Watch your personalized videos"
              className="w-full h-auto rounded-2xl"
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📺 Bite-Sized Daily Episodes
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              Your doctor uploads your medical information, and MedFlix creates a 7-day series 
              of fun animated videos just for you! Each episode is short, easy to understand, 
              and teaches you about your diagnosis, medications, and recovery plan in a way 
              that actually makes sense.
            </p>
          </div>
        </div>

        {/* Feature 2 - Visual Styles */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎨 Choose Your Favorite Style!
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              Love Friends? Prefer anime? Want Spider-Verse or Pixar style? You pick! Choose 
              from different visual styles like Zootopia, The Office, or South Park. Your videos 
              are personalized to your interests and learning style. It's like Netflix, 
              but for your health!
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-purple-50 rounded-3xl p-4 overflow-hidden order-1 md:order-2 border-4 border-red-200 shadow-xl">
            <img 
              src="/images/feature-visual-styles.png" 
              alt="Choose your visual style"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>

        {/* Feature 3 - Avatars */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-3xl p-4 overflow-hidden border-4 border-blue-200 shadow-xl">
            <img 
              src="/images/feature-avatars.png" 
              alt="Choose your characters"
              className="w-full h-auto rounded-2xl"
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎭 Pick Your Characters!
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              Choose fun characters to be in your videos! From friendly doctors to Santa, 
              SpongeBob, or Mickey Mouse - you decide who teaches you about your health. 
              Each character makes learning fun and helps you understand your treatment 
              in a way that feels exciting and personal!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200 py-8 mt-32 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
          <Logo size="sm" showText={true} />
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Safe & Secure • HIPAA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
