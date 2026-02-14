import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, User, ArrowRight } from 'lucide-react'

export default function Login() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    login({
      name: name.trim(),
      role: 'patient',
      diagnosis: '',
    })

    navigate('/portal')
  }

  return (
    <div className="min-h-screen bg-medflix-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-medflix-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MedFlix</h1>
          <p className="text-gray-400 mt-2">Patient Education Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-medflix-dark text-white rounded-xl font-medium hover:bg-medflix-darker transition-colors flex items-center justify-center gap-2 mt-6"
            >
              Enter Patient Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Demo mode — no real authentication required
          </p>
        </div>
      </div>
    </div>
  )
}
