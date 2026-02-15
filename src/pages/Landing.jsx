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
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full text-xs font-medium text-purple-700 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Transform Medical Info into Fun Videos
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
            Your Health Story,
            <br />
            <span className="text-medflix-blue">Episode by Episode!</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            MedFlix turns complex medical documents into personalized animated videos 
            that kids actually understand and enjoy watching. Learning about your health 
            has never been this fun!
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mb-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-medflix-red mb-1">7 Days</div>
              <div className="text-sm text-gray-600">of fun lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-medflix-blue mb-1">24/7</div>
              <div className="text-sm text-gray-600">AI support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-medflix-purple mb-1">100%</div>
              <div className="text-sm text-gray-600">personalized</div>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-medflix-purple text-gray-900 rounded-xl font-bold text-lg hover:bg-medflix-purple-dark transition-all shadow-lg hover:scale-105 border-4 border-purple-700"
          >
            Start Learning Now! →
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

        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="bg-red-50 rounded-3xl p-8 h-80 flex items-center justify-center border-4 border-red-200">
            <div className="text-center">
              <div className="w-32 h-32 bg-medflix-red rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-red-700">
                <Film className="w-16 h-16 text-gray-900" />
              </div>
              <p className="text-sm text-gray-700 font-bold">Daily Video Episodes</p>
            </div>
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

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎨 Choose Your Favorite Style!
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              Love cartoons? Prefer anime? Want it realistic? You pick! Choose from 30+ 
              different visual styles and create your own avatar. Your videos are 
              personalized to your age, interests, and learning style. It's like Netflix, 
              but for your health!
            </p>
          </div>
          <div className="bg-blue-50 rounded-3xl p-8 h-80 flex items-center justify-center order-1 md:order-2 border-4 border-blue-200">
            <div className="text-center">
              <div className="w-32 h-32 bg-medflix-blue rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-blue-700">
                <Users className="w-16 h-16 text-gray-900" />
              </div>
              <p className="text-sm text-gray-700 font-bold">Your Style, Your Way</p>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-purple-50 rounded-3xl p-8 h-80 flex items-center justify-center border-4 border-purple-200">
            <div className="text-center">
              <div className="w-32 h-32 bg-medflix-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-purple-700">
                <BookOpen className="w-16 h-16 text-gray-900" />
              </div>
              <p className="text-sm text-gray-700 font-bold">24/7 AI Assistant</p>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              💬 Ask Questions Anytime
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              Got questions? Our friendly AI assistant is always here to help! Chat with it 
              anytime, ask about your medications, or get reminders. Plus, have live video 
              chats with an AI doctor that knows all about your health. Never feel confused 
              or alone on your health journey!
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
