import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { storage } from '../utils/storage'
import { Home, LogOut, RotateCcw } from 'lucide-react'
import Logo from './Logo'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isDoctor = user?.role === 'doctor'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b-5 border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="md" showText={true} />
          </Link>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm border-2 ${
              isDoctor 
                ? 'bg-blue-600 text-gray-900 border-blue-800' 
                : 'bg-yellow-400 text-gray-900 border-yellow-600'
            }`}>
              {isDoctor ? 'DOCTOR' : 'PATIENT'}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {user?.name || (isDoctor ? 'Doctor' : 'Patient')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={isDoctor ? '/doctor' : '/portal'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <button
            onClick={() => {
              if (confirm('Clear all your progress and start fresh?')) {
                storage.clear()
                fetch('/api/context/clear-cache', { method: 'POST' }).catch(() => {})
                window.location.reload()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-900 bg-medflix-yellow hover:bg-medflix-yellow-dark rounded-lg transition-all shadow-sm border-2 border-medflix-yellow-dark"
            title="Clear all demo data and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-900 bg-medflix-red hover:bg-medflix-red-dark rounded-lg transition-all shadow-sm border-2 border-red-700"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
