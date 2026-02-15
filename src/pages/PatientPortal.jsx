import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../utils/storage'
import Header from '../components/Header'
import RecoveryPlan from '../components/RecoveryPlan'
import AIAssistant from '../components/AIAssistant'
import LiveAvatar from '../components/LiveAvatar'
import CreateContent from '../components/CreateContent'
import { samplePatient, getPatientById } from '../data/patientData'
import MedicationReminders from '../components/MedicationReminders'
import { CalendarDays, MessageCircle, Plus, Film, Video, Clock, Bell } from 'lucide-react'

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
    { id: 'recovery', label: 'My Shows', icon: CalendarDays },
    { id: 'avatar', label: 'Talk to Doc', icon: Video },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'assistant', label: 'Ask Buddy', icon: MessageCircle },
  ]

  const tabColors = [
    { id: 'recovery', bg: 'bg-medflix-red', border: 'border-medflix-red', light: 'bg-red-50' },
    { id: 'avatar', bg: 'bg-medflix-blue', border: 'border-medflix-blue', light: 'bg-blue-50' },
    { id: 'reminders', bg: 'bg-medflix-purple', border: 'border-medflix-purple', light: 'bg-purple-50' },
    { id: 'assistant', bg: 'bg-medflix-yellow', border: 'border-medflix-yellow', light: 'bg-yellow-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-medflix-red to-pink-400 rounded-full opacity-35 blur-3xl animate-float-gentle"></div>
        <div className="absolute top-1/4 right-20 w-[450px] h-[450px] bg-gradient-to-br from-medflix-blue to-cyan-400 opacity-30 blur-3xl animate-float-gentle animation-delay-1000" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-32 left-32 w-80 h-80 bg-gradient-to-br from-medflix-yellow to-orange-300 rounded-full opacity-40 blur-3xl animate-float-gentle animation-delay-2000" style={{animationDuration: '10s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-gradient-to-br from-medflix-purple to-pink-400 rounded-full opacity-35 blur-3xl animate-float-gentle animation-delay-500" style={{animationDuration: '12s'}}></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-400 to-medflix-red rounded-full opacity-30 blur-3xl animate-float-gentle animation-delay-1500" style={{animationDuration: '9s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-300 to-medflix-blue rounded-full opacity-35 blur-3xl animate-float-gentle animation-delay-3000" style={{animationDuration: '11s'}}></div>
      </div>

      {/* Playful geometric shapes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[12%] left-[8%] w-28 h-28 bg-medflix-red/[0.03] blur-2xl rounded-full animate-float-gentle"></div>
        <div className="absolute top-[18%] right-[10%] w-28 h-28 bg-medflix-blue/[0.03] blur-2xl" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
        <div className="absolute top-[45%] left-[15%] w-28 h-28 bg-medflix-yellow/[0.03] blur-2xl rounded-lg rotate-45 animate-float-gentle animation-delay-1000"></div>
        <div className="absolute top-[50%] right-[12%] w-28 h-28 bg-medflix-purple/[0.03] blur-2xl rounded-full animate-float-gentle animation-delay-2000"></div>
        <div className="absolute bottom-[25%] left-[10%] w-28 h-28 bg-medflix-red/[0.02] blur-2xl rotate-45"></div>
        <div className="absolute bottom-[20%] right-[15%] w-28 h-28 bg-medflix-blue/[0.02] blur-2xl rounded-full animate-float-gentle animation-delay-500"></div>
        <div className="absolute bottom-[12%] left-[50%] w-28 h-28 bg-medflix-yellow/[0.02] blur-2xl rounded-full animate-float-gentle animation-delay-1800"></div>
      </div>

      <Header />

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-md border-b-4 border-gray-200 relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-2">
            {tabs.map((tab) => {
              const tabColor = tabColors.find(t => t.id === tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all border-2 ${
                    activeTab === tab.id
                      ? `${tabColor.border} ${tabColor.light} shadow-md scale-[1.02]`
                      : 'border-gray-300 text-gray-800 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 shadow-sm'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {activeTab === 'recovery' && (
          <>
            {hasCreatedContent && plan ? (
              <RecoveryPlan
                plan={plan}
                patientName={currentPatient.name}
                patientDiagnosis={plan?.diagnosis || currentPatient.diagnosis}
                onUpdate={updatePlan}
                onNavigateToAvatar={() => setActiveTab('avatar')}
                userId={user?.id}
              />
            ) : (
              <WaitingState patientName={currentPatient.name} />
            )}
          </>
        )}
        {activeTab === 'avatar' && (
          <LiveAvatar patient={currentPatient} />
        )}
        {activeTab === 'reminders' && (
          <MedicationReminders
            patientName={currentPatient.name}
            diagnosis={currentPatient.diagnosis}
            userId={user?.id}
          />
        )}
        {activeTab === 'assistant' && (
          <AIAssistant patientName={currentPatient.name} diagnosis={plan?.diagnosis || currentPatient.diagnosis} />
        )}
      </main>

      {/* Create Content Modal (patient can also generate if needed) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-5 border-gray-300 animate-scaleIn">
            <div className="flex items-center justify-between p-8 border-b-5 border-medflix-purple bg-purple-50">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Make New Lessons!</h2>
                <p className="text-lg text-gray-700 mt-1 font-bold">For {currentPatient.name}</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full transition-all hover:scale-110 flex items-center justify-center shadow-md"
              >
                <Plus className="w-7 h-7 rotate-45 text-gray-700" />
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
    <div className="flex items-center justify-center min-h-[500px] relative">
      {/* Playful shapes */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-medflix-red rounded-full opacity-15 animate-float-gentle"></div>
      <div className="absolute top-40 right-40 w-12 h-12 bg-medflix-blue rotate-45 opacity-15 animate-float-gentle animation-delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-14 h-14 bg-medflix-yellow rounded-full opacity-15 animate-float-gentle animation-delay-2000"></div>
      
      <div className="text-center max-w-lg relative z-10">
        <div className="flex justify-center gap-3 mb-6">
          <div className="w-20 h-20 bg-medflix-red rounded-2xl flex items-center justify-center shadow-xl rotate-6 border-4 border-red-700">
            <Clock className="w-10 h-10 text-gray-900" />
          </div>
          <div className="w-20 h-20 bg-medflix-blue rounded-full flex items-center justify-center shadow-xl border-4 border-blue-700">
            <Film className="w-10 h-10 text-gray-900" />
          </div>
          <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-xl -rotate-6">
            <Video className="w-10 h-10 text-gray-900" />
          </div>
        </div>
        <h3 className="text-4xl font-black text-gray-900 mb-4">
          Hey {patientName?.split(' ')[0]}!
        </h3>
        <p className="text-xl text-gray-700 mb-8 leading-relaxed font-bold">
          Your doctor is making awesome episodes just for you!
        </p>
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-blue-50 border-4 border-medflix-blue rounded-2xl text-gray-900 text-lg font-black shadow-xl">
          <Clock className="w-6 h-6 text-medflix-blue" />
          Getting Ready...
        </div>
        <p className="text-lg text-gray-700 mt-8 font-bold">
          Try <span className="text-medflix-blue">Video Chat</span> or <span className="text-medflix-yellow">Ask Questions</span> while you wait!
        </p>
      </div>
    </div>
  )
}
