import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { storage } from '../utils/storage'
import { Heart, Home, LogOut, Stethoscope, User, RotateCcw } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isDoctor = user?.role === 'doctor'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-medflix-dark text-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-medflix-accent rounded-lg flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-white" fill="white" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold leading-tight">
                {isDoctor ? 'Doctor Portal' : 'Patient Portal'}
              </h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                isDoctor ? 'bg-blue-500/20 text-blue-300' : 'bg-medflix-accent/20 text-medflix-accent'
              }`}>
                {isDoctor ? 'Doctor' : 'Patient'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {isDoctor ? (
                <>
                  <Stethoscope className="w-3 h-3 inline mr-1" />
                  {user?.name || 'Doctor'}
                </>
              ) : (
                <>
                  <User className="w-3 h-3 inline mr-1" />
                  {user?.name || 'Patient'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset demo data */}
          <button
            onClick={() => {
              if (confirm('Clear all generated content and start fresh?')) {
                storage.clear()
                fetch('/api/context/clear-cache', { method: 'POST' }).catch(() => {})
                window.location.reload()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-red-400/30"
            title="Clear all demo data and start fresh"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <Link
            to={isDoctor ? '/doctor' : '/portal'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
