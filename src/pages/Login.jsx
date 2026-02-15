import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { allPatients } from '../data/patientData'
import { ArrowRight, Stethoscope, User, Activity, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function Login() {
  const [name, setName] = useState('')
  const [role, setRole] = useState(null) // 'doctor' or 'patient'
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSelectRole = (newRole) => {
    setRole(newRole)
    if (newRole === 'doctor') {
      setName('Dr. Sarah Chen')
      setSelectedPatientId(null)
    } else {
      setName('')
      setSelectedPatientId(null)
    }
  }

  const handleSelectPatient = (pt) => {
    setSelectedPatientId(pt.id)
    setName(pt.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !role) return

    const userData = {
      name: name.trim(),
      role,
    }

    // If logging in as a patient, attach the patient ID so the portal knows which patient
    if (role === 'patient' && selectedPatientId) {
      userData.patientId = selectedPatientId
    }

    login(userData)
    navigate(role === 'doctor' ? '/doctor' : '/portal')
  }

  const canSubmit = role === 'doctor' ? !!name.trim() : (!!name.trim() && !!selectedPatientId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-medflix-red to-pink-400 rounded-full opacity-20 blur-3xl animate-float-gentle"></div>
      <div className="absolute top-32 right-20 w-96 h-96 bg-gradient-to-br from-medflix-blue to-cyan-400 opacity-15 blur-3xl animate-float-gentle animation-delay-1000" style={{animationDuration: '8s'}}></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-medflix-yellow to-orange-300 rounded-full opacity-20 blur-3xl animate-float-gentle animation-delay-2000" style={{animationDuration: '10s'}}></div>
      <div className="absolute bottom-32 right-32 w-64 h-64 bg-gradient-to-br from-medflix-purple to-pink-400 rounded-full opacity-15 blur-3xl animate-float-gentle animation-delay-500" style={{animationDuration: '12s'}}></div>
      
      {/* Playful geometric shapes */}
      <div className="absolute top-[12%] left-[12%] w-28 h-28 bg-medflix-red/[0.02] blur-2xl rounded-full animate-float-gentle"></div>
      <div className="absolute top-[18%] right-[15%] w-28 h-28 bg-medflix-blue/[0.02] blur-2xl" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
      <div className="absolute bottom-[18%] left-[18%] w-28 h-28 bg-medflix-yellow/[0.02] blur-2xl rounded-lg rotate-45 animate-float-gentle animation-delay-1000"></div>
      <div className="absolute bottom-[15%] right-[12%] w-28 h-28 bg-medflix-purple/[0.02] blur-2xl rounded-full animate-float-gentle animation-delay-2000"></div>

      {/* Back to Home button */}
      <Link 
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 border-3 border-gray-200 hover:border-medflix-purple"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex justify-center mb-4">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-2">MedFlix</h1>
          <p className="text-xl text-gray-700 font-semibold">Learn & Grow with Fun!</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-5 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Who Are You?</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectRole('doctor')}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all hover:scale-105 ${
                    role === 'doctor'
                      ? 'border-medflix-blue bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl shadow-blue-200/50 scale-105'
                      : 'border-gray-300 hover:border-medflix-blue bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-transparent'
                  }`}
                >
                  {role === 'doctor' && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-medflix-blue rounded-full flex items-center justify-center shadow-lg border-2 border-blue-700">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                    role === 'doctor' ? 'bg-medflix-blue text-gray-900 shadow-lg border-4 border-blue-700' : 'bg-blue-100 text-medflix-blue'
                  }`}>
                    <Stethoscope className="w-10 h-10" />
                  </div>
                  <span className={`font-black text-xl ${role === 'doctor' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Doctor
                  </span>
                  <span className="text-base text-gray-600 text-center font-semibold">I help patients!</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('patient')}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all hover:scale-105 ${
                    role === 'patient'
                      ? 'border-medflix-red bg-gradient-to-br from-red-50 to-pink-50 shadow-xl shadow-red-200/50 scale-105'
                      : 'border-gray-300 hover:border-medflix-red bg-white hover:bg-gradient-to-br hover:from-red-50/50 hover:to-transparent'
                  }`}
                >
                  {role === 'patient' && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-medflix-red rounded-full flex items-center justify-center shadow-lg border-2 border-red-700">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                    role === 'patient' ? 'bg-medflix-red text-gray-900 shadow-lg border-4 border-red-700' : 'bg-red-100 text-medflix-red'
                  }`}>
                    <User className="w-10 h-10" />
                  </div>
                  <span className={`font-black text-xl ${role === 'patient' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Patient
                  </span>
                  <span className="text-base text-gray-600 text-center font-semibold">I want to learn!</span>
                </button>
              </div>
            </div>

            {/* Patient picker — only when role is patient */}
            {role === 'patient' && (
              <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                Choose your avatar!
              </label>
                <div className="space-y-2">
                  {allPatients.map((pt) => {
                    const isSelected = selectedPatientId === pt.id
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => handleSelectPatient(pt)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-4 text-left transition-all hover:scale-[1.02] ${
                          isSelected
                            ? 'border-medflix-yellow bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg shadow-yellow-200/50'
                            : 'border-gray-300 hover:border-medflix-yellow bg-white hover:bg-gradient-to-r hover:from-yellow-50/30 hover:to-transparent'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md ${
                          isSelected ? 'ring-4 ring-medflix-yellow' : 'ring-2 ring-gray-300'
                        }`}>
                          <img 
                            src={pt.avatar}
                            alt={pt.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                            {pt.name}
                          </p>
                          <p className="text-sm text-gray-700 truncate leading-relaxed font-medium">
                            {pt.age}yo {pt.sex} • {pt.diagnosis}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-700 flex-shrink-0 font-bold">
                          <Activity className="w-4 h-4" />
                          {pt.medications?.length} meds
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Name Input — visible for doctor, hidden for patient (auto-filled) */}
            {role === 'doctor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Sarah Chen"
                  className="w-full px-4 py-4 rounded-2xl border-4 border-gray-300 bg-white focus:border-medflix-blue focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg font-semibold"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-5 bg-gradient-to-r from-medflix-purple to-pink-500 text-gray-900 rounded-2xl font-black text-xl hover:from-medflix-purple-dark hover:to-pink-600 transition-all flex items-center justify-center gap-3 mt-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-purple-300/50 hover:shadow-2xl hover:scale-105 border-4 border-purple-700"
            >
              {role === 'doctor'
                ? 'Enter Doctor Portal'
                : role === 'patient'
                  ? `Let's Go!`
                  : 'Select a role above'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6 font-semibold">
            Demo mode • No authentication required
          </p>
        </div>
      </div>
    </div>
  )
}
