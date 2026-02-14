import { Link } from 'react-router-dom'
import { Play, Heart, Shield, Sparkles, ArrowRight, Film, BookOpen, Users } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-medflix-dark text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medflix-accent rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold">MedFlix</span>
          </div>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-medflix-accent text-white rounded-lg font-medium hover:bg-medflix-accentLight transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-medflix-accent/10 border border-medflix-accent/30 rounded-full text-medflix-accent text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          AI-Powered Patient Education
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Your Health Story,
          <br />
          <span className="text-medflix-accent">Episode by Episode</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Transform dense medical documents into engaging, bite-sized video episodes.
          Personalized recovery plans delivered daily, making healthcare education
          something patients actually want to watch.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-4 bg-medflix-accent text-white rounded-xl font-semibold text-lg hover:bg-medflix-accentLight transition-colors flex items-center gap-2"
          >
            Start Your Journey <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="px-8 py-4 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/5 transition-colors flex items-center gap-2">
            <Play className="w-5 h-5" /> Watch Demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Upload Medical Records"
            description="Drop in any medical PDF — discharge summaries, lab results, treatment plans. Our AI transforms them into clear, understandable content."
          />
          <FeatureCard
            icon={<Film className="w-6 h-6" />}
            title="Choose Your Style"
            description="Pick from visual styles like Pixar, Anime, or Documentary. Make medical education engaging with art styles patients love."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Personalized Episodes"
            description="Daily bite-sized episodes tailored to each patient's diagnosis. Progressive unlocking keeps patients engaged throughout recovery."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Upload', desc: 'Upload medical PDFs, charts, and treatment plans' },
            { step: '02', title: 'Customize', desc: 'Choose visual style, add characters, set preferences' },
            { step: '03', title: 'Generate', desc: 'AI creates engaging video episodes from your content' },
            { step: '04', title: 'Learn', desc: 'Patients watch daily episodes and track their progress' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-medflix-accent/10 border border-medflix-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-medflix-accent font-bold text-lg">{item.step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '95%', label: 'Video Retention Rate' },
            { value: '10x', label: 'Better Than Reading' },
            { value: '7 Days', label: 'Average Recovery Plan' },
            { value: '24/7', label: 'AI Assistant Access' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-medflix-accent mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-medflix-accent" fill="#00d4aa" />
            <span>MedFlix</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            HIPAA Compliant
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-medflix-accent/30 transition-colors">
      <div className="w-12 h-12 bg-medflix-accent/10 rounded-xl flex items-center justify-center text-medflix-accent mb-5">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
