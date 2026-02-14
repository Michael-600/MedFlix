import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Home, LogOut } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
            <h1 className="text-base font-semibold leading-tight">Patient Portal</h1>
            <p className="text-xs text-gray-400">Welcome, {user?.name || 'Patient'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/portal"
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
