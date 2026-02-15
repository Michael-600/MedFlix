import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../utils/storage'
import Header from '../components/Header'
import RecoveryPlan from '../components/RecoveryPlan'
import AIAssistant from '../components/AIAssistant'
import LiveAvatar from '../components/LiveAvatar'
import CreateContent from '../components/CreateContent'
import { samplePatient, getPatientById } from '../data/patientData'
import { CalendarDays, MessageCircle, Plus, Film, Video, Clock } from 'lucide-react'

export default function PatientPortal() {
  const { user } = useAuth()

  // Resolve which patient this user is
  const currentPatient = (user?.patientId && getPatientById(user.patientId)) || samplePatient

  const [activeTab, setActiveTab] = useState('recovery')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [plan, setPlan] = useState(null)
  const [hasCreatedContent, setHasCreatedContent] = useState(false)

  useEffect(() => {
    // Check for content sent by the doctor for this specific patient
    const doctorCreated = storage.get(`content_created_patient_${currentPatient.id}`)
    const userCreated = storage.get(`content_created_${user?.id}`)
    const hasContent = !!doctorCreated || !!userCreated
    setHasCreatedContent(hasContent)

    if (hasContent) {
      // Prefer doctor-sent plan, fall back to user-created plan
      const doctorPlan = storage.get(`plan_patient_${currentPatient.id}`)
      const userPlan = storage.get(`plan_${user?.id}`)
      setPlan(doctorPlan || userPlan)
    }
  }, [user, currentPatient])

  const updatePlan = (updatedPlan) => {
    setPlan(updatedPlan)
    storage.set(`plan_${user?.id}`, updatedPlan)
    storage.set(`plan_patient_${currentPatient.id}`, updatedPlan)
  }

  const handleContentCreated = (newPlan) => {
    setPlan(newPlan)
    storage.set(`plan_${user?.id}`, newPlan)
    storage.set(`plan_patient_${currentPatient.id}`, newPlan)
    storage.set(`content_created_${user?.id}`, true)
    storage.set(`content_created_patient_${currentPatient.id}`, true)
    setHasCreatedContent(true)
    setShowCreateModal(false)
    setActiveTab('recovery')
  }

  const tabs = [
    { id: 'recovery', label: 'My Care Plan', icon: CalendarDays },
    { id: 'avatar', label: 'Live Health Guide', icon: Video },
    { id: 'assistant', label: 'AI Assistant', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-medflix-bg">
      <Header />

      {/* Patient info bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-medflix-dark text-medflix-dark'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Patient badge */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{currentPatient.name}</span>
              <span className="text-gray-300">|</span>
              <span>{currentPatient.diagnosis}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'recovery' && (
          <>
            {hasCreatedContent && plan ? (
              <RecoveryPlan
                plan={plan}
                patientName={currentPatient.name}
                patientDiagnosis={plan?.diagnosis || currentPatient.diagnosis}
                onUpdate={updatePlan}
                onNavigateToAvatar={() => setActiveTab('avatar')}
              />
            ) : (
              <WaitingState patientName={currentPatient.name} />
            )}
          </>
        )}
        {activeTab === 'avatar' && (
          <LiveAvatar patient={currentPatient} />
        )}
        {activeTab === 'assistant' && (
          <AIAssistant patientName={currentPatient.name} diagnosis={plan?.diagnosis || currentPatient.diagnosis} />
        )}
      </main>

      {/* Create Content Modal (patient can also generate if needed) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create Patient Education Content</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CreateContent
                onComplete={handleContentCreated}
                defaultPatientName={currentPatient.name}
                defaultDiagnosis={currentPatient.diagnosis}
                patient={currentPatient}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Waiting state when doctor hasn't sent content yet ─────────

function WaitingState({ patientName }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-amber-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Hi {patientName?.split(' ')[0]}!
        </h3>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Your doctor is preparing personalized education content for you. Once it's ready, your care plan episodes will appear here.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm">
          <Clock className="w-4 h-4" />
          Waiting for your doctor to send content...
        </div>
        <p className="text-xs text-gray-400 mt-6">
          In the meantime, you can use the <strong>Live Health Guide</strong> or <strong>AI Assistant</strong> tabs above.
        </p>
      </div>
    </div>
  )
}
