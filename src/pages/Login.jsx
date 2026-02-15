import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { allPatients } from '../data/patientData'
import { Heart, ArrowRight, Stethoscope, User, Activity } from 'lucide-react'

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
    <div className="min-h-screen bg-medflix-dark flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-medflix-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MedFlix</h1>
          <p className="text-gray-400 mt-2">AI-Powered Patient Education</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectRole('doctor')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                    role === 'doctor'
                      ? 'border-medflix-accent bg-medflix-accent/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {role === 'doctor' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-medflix-accent rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    role === 'doctor' ? 'bg-medflix-accent text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className={`font-semibold text-sm ${role === 'doctor' ? 'text-medflix-accent' : 'text-gray-700'}`}>
                    Doctor
                  </span>
                  <span className="text-xs text-gray-500">Create & send content</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('patient')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                    role === 'patient'
                      ? 'border-medflix-accent bg-medflix-accent/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {role === 'patient' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-medflix-accent rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    role === 'patient' ? 'bg-medflix-accent text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <span className={`font-semibold text-sm ${role === 'patient' ? 'text-medflix-accent' : 'text-gray-700'}`}>
                    Patient
                  </span>
                  <span className="text-xs text-gray-500">View education content</span>
                </button>
              </div>
            </div>

            {/* Patient picker — only when role is patient */}
            {role === 'patient' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your profile
                </label>
                <div className="space-y-2">
                  {allPatients.map((pt) => {
                    const isSelected = selectedPatientId === pt.id
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => handleSelectPatient(pt)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-medflix-accent bg-medflix-accent/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          isSelected ? 'bg-medflix-accent' : 'bg-gray-400'
                        }`}>
                          {pt.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-medflix-accent' : 'text-gray-900'}`}>
                            {pt.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {pt.age}yo {pt.sex} — {pt.diagnosis}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                          <Activity className="w-3 h-3" />
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all text-sm"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 bg-medflix-dark text-white rounded-xl font-medium hover:bg-medflix-darker transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {role === 'doctor'
                ? 'Enter Doctor Portal'
                : role === 'patient'
                  ? `Enter as ${name || 'Patient'}`
                  : 'Select a role above'}
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
