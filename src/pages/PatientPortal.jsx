import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../utils/storage'
import Header from '../components/Header'
import RecoveryPlan from '../components/RecoveryPlan'
import AIAssistant from '../components/AIAssistant'
import LiveAvatar from '../components/LiveAvatar'
import CreateContent from '../components/CreateContent'
import MedicationReminders from '../components/MedicationReminders'
import { CalendarDays, MessageCircle, Plus, Film, Video, Bell } from 'lucide-react'

export default function PatientPortal() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('recovery')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [plan, setPlan] = useState(null)
  const [hasCreatedContent, setHasCreatedContent] = useState(false)

  useEffect(() => {
    // Check if user has created content
    const contentCreated = storage.get(`content_created_${user?.id}`)
    setHasCreatedContent(!!contentCreated)

    // Only load plan if content has been created
    if (contentCreated) {
      const savedPlan = storage.get(`plan_${user?.id}`)
      setPlan(savedPlan)
    }
  }, [user])

  const updatePlan = (updatedPlan) => {
    setPlan(updatedPlan)
    storage.set(`plan_${user?.id}`, updatedPlan)
  }

  const handleContentCreated = (newPlan) => {
    setPlan(newPlan)
    storage.set(`plan_${user?.id}`, newPlan)
    storage.set(`content_created_${user?.id}`, true)
    setHasCreatedContent(true)
    setShowCreateModal(false)
    setActiveTab('recovery')
  }

  const tabs = [
    { id: 'recovery', label: 'Recovery Plan', icon: CalendarDays },
    { id: 'avatar', label: 'Live Avatar', icon: Video },
    { id: 'assistant', label: 'AI Assistant', icon: MessageCircle },
    { id: 'reminders', label: 'Medication Reminders', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-medflix-bg">
      <Header />

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
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
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'recovery' && (
          <>
            {hasCreatedContent && plan ? (
              <RecoveryPlan
                plan={plan}
                patientName={user?.name}
                patientDiagnosis={plan?.diagnosis || user?.diagnosis}
                onUpdate={updatePlan}
                onNavigateToAvatar={() => setActiveTab('avatar')}
                userId={user?.id}
              />
            ) : (
              <EmptyState onCreateClick={() => setShowCreateModal(true)} />
            )}
          </>
        )}
        {activeTab === 'avatar' && (
          <LiveAvatar />
        )}
        {activeTab === 'assistant' && (
          <AIAssistant patientName={user?.name} diagnosis={plan?.diagnosis} />
        )}
        {activeTab === 'reminders' && (
          <MedicationReminders patientName={user?.name} diagnosis={plan?.diagnosis || user?.diagnosis} userId={user?.id} />
        )}
      </main>

      {/* Floating Action Button */}
      {hasCreatedContent && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-medflix-accent text-white rounded-full shadow-lg hover:bg-medflix-accentLight transition-all hover:scale-110 flex items-center justify-center z-50"
          title="Create New Content"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Create Content Modal */}
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
                defaultPatientName={user?.name || ''}
                defaultDiagnosis={plan?.diagnosis || user?.diagnosis || ''}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Empty state when no content created
function EmptyState({ onCreateClick }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-medflix-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Film className="w-12 h-12 text-medflix-accent" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MedFlix</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Create your first personalized patient education series by uploading medical documents and choosing your visual style.
        </p>
        <button
          onClick={onCreateClick}
          className="px-8 py-4 bg-medflix-accent text-white rounded-xl font-semibold hover:bg-medflix-accentLight transition-colors inline-flex items-center gap-2 shadow-lg shadow-medflix-accent/25"
        >
          <Plus className="w-5 h-5" />
          Create Your First Series
        </button>
      </div>
    </div>
  )
}
