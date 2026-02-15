import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import CreateContent from '../components/CreateContent'
import { allPatients, samplePatient } from '../data/patientData'
import { storage } from '../utils/storage'
import {
  Users, Film, Send, CheckCircle, Clock,
  Plus, ChevronRight, FileText, Activity,
} from 'lucide-react'

export default function DoctorPortal() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('patients')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(allPatients[0])
  const [sentPlans, setSentPlans] = useState(() => {
    const saved = storage.get('doctor_sent_plans')
    return saved || []
  })

  const handleContentCreated = (newPlan) => {
    const planRecord = {
      id: `plan-${Date.now()}`,
      patient: selectedPatient,
      plan: newPlan,
      sentAt: new Date().toISOString(),
      status: 'sent',
    }
    const updated = [planRecord, ...sentPlans]
    setSentPlans(updated)
    storage.set('doctor_sent_plans', updated)

    // Save as this patient's plan so the patient portal picks it up
    storage.set(`plan_patient_${selectedPatient.id}`, newPlan)
    storage.set(`content_created_patient_${selectedPatient.id}`, true)

    setShowCreateModal(false)
  }

  const tabs = [
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'content', label: 'Sent Content', icon: Film },
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'patients' && (
          <PatientsTab
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            onCreateContent={() => setShowCreateModal(true)}
            sentPlans={sentPlans}
          />
        )}
        {activeTab === 'content' && (
          <SentContentTab sentPlans={sentPlans} />
        )}
      </main>

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Education Content</h2>
                <p className="text-sm text-gray-500 mt-1">
                  For: {selectedPatient.name} — {selectedPatient.diagnosis}
                </p>
              </div>
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
                defaultPatientName={selectedPatient.name}
                defaultDiagnosis={selectedPatient.diagnosis}
                patient={selectedPatient}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Patients Tab ──────────────────────────────────────────────

function PatientsTab({ selectedPatient, onSelectPatient, onCreateContent, sentPlans }) {
  const getPatientPlanCount = (ptId) => sentPlans.filter((p) => p.patient.id === ptId).length

  // Color palette for patient avatars
  const avatarColors = ['bg-medflix-accent', 'bg-blue-500', 'bg-purple-500']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
          <p className="text-sm text-gray-500 mt-1">{allPatients.length} patients in your care</p>
        </div>
      </div>

      <div className="grid gap-4">
        {allPatients.map((pt, idx) => {
          const isSelected = selectedPatient?.id === pt.id
          const planCount = getPatientPlanCount(pt.id)
          const hasPlan = storage.get(`content_created_patient_${pt.id}`)

          return (
            <div
              key={pt.id}
              className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                isSelected
                  ? 'border-medflix-accent shadow-lg shadow-medflix-accent/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${avatarColors[idx] || 'bg-medflix-accent'}`}>
                    {pt.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{pt.name}</h3>
                      {hasPlan ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Content Sent</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Needs Content</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {pt.age}yo {pt.sex} — {pt.diagnosis}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Activity className="w-3 h-3" />
                        {pt.conditions?.slice(0, 2).join(', ')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        {pt.medications?.length || 0} medications
                      </span>
                      {planCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-medflix-accent">
                          <Film className="w-3 h-3" />
                          {planCount} plan{planCount !== 1 ? 's' : ''} sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <button
                      onClick={() => onSelectPatient(pt)}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Select
                    </button>
                  )}
                  {isSelected && (
                    <button
                      onClick={onCreateContent}
                      className="px-5 py-2.5 bg-medflix-accent text-white text-sm font-medium rounded-xl hover:bg-medflix-accentLight transition-colors flex items-center gap-2 shadow-lg shadow-medflix-accent/20"
                    >
                      <Send className="w-4 h-4" />
                      Create & Send Education Content
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded patient info when selected */}
              {isSelected && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Medications</h4>
                    <div className="space-y-1.5">
                      {pt.medications?.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 rounded-full bg-medflix-accent" />
                          <span className="text-gray-700">{m.name} {m.dose}</span>
                          <span className="text-gray-400 text-xs">({m.frequency})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Care Team</h4>
                    <div className="space-y-1.5">
                      {pt.careTeam?.map((c, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-gray-700 font-medium">{c.name}</span>
                          <span className="text-gray-400 ml-1 text-xs">({c.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Health Goals</h4>
                    <div className="space-y-1.5">
                      {pt.goals?.slice(0, 3).map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="w-3.5 h-3.5 text-medflix-accent mt-0.5 flex-shrink-0" />
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sent Content Tab ──────────────────────────────────────────

function SentContentTab({ sentPlans }) {
  if (sentPlans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No content sent yet</h3>
          <p className="text-gray-500">
            Select a patient and create education content to send to them.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Sent Education Content</h2>
      <p className="text-sm text-gray-500 mb-6">{sentPlans.length} content package{sentPlans.length !== 1 ? 's' : ''} delivered</p>

      <div className="space-y-4">
        {sentPlans.map((record) => (
          <div key={record.id} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Education Series for {record.patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {record.patient.diagnosis} — {record.plan?.days?.length || 7} episodes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <Send className="w-3 h-3" /> Sent to patient
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(record.sentAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Episode previews */}
            <div className="mt-4 grid grid-cols-7 gap-2">
              {(record.plan?.days || []).slice(0, 7).map((day, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg mb-1">{['🎬', '📚', '💊', '📋', '🏠', '⚠️', '🎯'][i]}</div>
                  <p className="text-[10px] text-gray-600 leading-tight font-medium">{day.title}</p>
                  <div className="mt-1">
                    {day.videoId ? (
                      <span className="text-[9px] text-green-600 flex items-center justify-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Ready
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-500 flex items-center justify-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Processing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
