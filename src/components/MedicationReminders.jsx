import { useState, useEffect, useMemo } from 'react'
import { Bell, Phone, Plus, Trash2, Check, X, Send, Wifi, WifiOff, Clock, Pill, Sparkles, ChevronDown } from 'lucide-react'
import { storage } from '../utils/storage'
import { getPatientById, allPatients } from '../data/patientData'

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'emergency', label: 'Emergency only' },
]

/** Map a medication frequency string from patient data to our frequency value */
function mapFrequency(freq = '') {
  const f = freq.toLowerCase()
  if (f.includes('twice')) return 'twice_daily'
  if (f.includes('three')) return 'three_times_daily'
  if (f.includes('four')) return 'four_times_daily'
  if (f.includes('once') && f.includes('week')) return 'weekly'
  if (f.includes('weekly')) return 'weekly'
  if (f.includes('needed') || f.includes('rescue') || f.includes('emergency')) return 'as_needed'
  if (f.includes('daily')) return 'once_daily'
  return 'once_daily'
}

/** Suggest reminder times based on frequency */
function suggestTimes(freq) {
  switch (freq) {
    case 'twice_daily': return ['08:00', '20:00']
    case 'three_times_daily': return ['08:00', '14:00', '20:00']
    case 'four_times_daily': return ['08:00', '12:00', '16:00', '20:00']
    case 'weekly': return ['09:00']
    case 'as_needed':
    case 'emergency': return []
    default: return ['08:00']
  }
}

export default function MedicationReminders({ patientName, diagnosis, userId }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [registered, setRegistered] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [medications, setMedications] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [pokeConfigured, setPokeConfigured] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)

  // Build suggested medications from the patient's actual medical record
  const suggestedMeds = useMemo(() => {
    // Try to find patient by userId (which matches patient id)
    const patient = getPatientById(userId) || allPatients.find(p => p.name === patientName) || allPatients[0]
    if (!patient?.medications) return []
    return patient.medications.map((med, i) => ({
      id: `suggested_${i}`,
      name: med.name,
      genericName: med.genericName || '',
      dosage: med.dose || '',
      frequency: mapFrequency(med.frequency),
      frequencyLabel: med.frequency || '',
      times: suggestTimes(mapFrequency(med.frequency)),
      instructions: med.instructions || '',
      purpose: med.purpose || '',
      route: med.route || '',
    }))
  }, [userId, patientName])

  // Load saved state on mount
  useEffect(() => {
    const saved = storage.get(`poke_registered_${userId}`)
    if (saved) {
      setRegistered(saved.registered || false)
      setPatientId(saved.patientId || null)
      setPhoneNumber(saved.phoneNumber || '')
    }

    const savedMeds = storage.get(`medications_${userId}`)
    if (savedMeds) {
      setMedications(savedMeds)
    }

    fetch('/api/health')
      .then(r => r.json())
      .then(data => setPokeConfigured(data.twilio === true))
      .catch(() => setPokeConfigured(false))
  }, [userId])

  const showStatus = (msg, type = 'success') => {
    setStatusMessage({ msg, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const saveMedications = (meds) => {
    setMedications(meds)
    storage.set(`medications_${userId}`, meds)
    if (patientId) {
      fetch('/api/poke/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, medications: meds }),
      }).catch(err => console.error('Failed to sync medications:', err))
    }
  }

  /** Add a suggested medication to the active reminders list */
  const handleAddSuggested = (suggested) => {
    // Check if already added
    if (medications.some(m => m.name === suggested.name)) {
      showStatus(`${suggested.name} is already in your reminders!`, 'error')
      return
    }
    const newMed = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: suggested.name,
      dosage: suggested.dosage,
      frequency: suggested.frequency,
      times: suggested.times,
      instructions: suggested.instructions,
      active: true,
    }
    saveMedications([...medications, newMed])
    showStatus(`${suggested.name} added to reminders!`)
  }

  /** Add ALL suggested medications at once */
  const handleAddAll = () => {
    const existingNames = new Set(medications.map(m => m.name))
    const newMeds = suggestedMeds
      .filter(s => !existingNames.has(s.name))
      .map((s, i) => ({
        id: `med_${Date.now()}_${i}`,
        name: s.name,
        dosage: s.dosage,
        frequency: s.frequency,
        times: s.times,
        instructions: s.instructions,
        active: true,
      }))
    if (newMeds.length === 0) {
      showStatus('All medications are already added!', 'error')
      return
    }
    saveMedications([...medications, ...newMeds])
    showStatus(`Added ${newMeds.length} medication${newMeds.length > 1 ? 's' : ''} to reminders!`)
  }

  const handleRegister = async () => {
    if (!phoneNumber.trim()) return
    setIsRegistering(true)
    try {
      const res = await fetch('/api/poke/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: patientName, phoneNumber: phoneNumber.trim(), userId, diagnosis }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setRegistered(true)
      setPatientId(data.patientId)
      storage.set(`poke_registered_${userId}`, {
        registered: true,
        patientId: data.patientId,
        phoneNumber: phoneNumber.trim(),
      })

      if (medications.length > 0) {
        await fetch('/api/poke/medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: data.patientId, medications }),
        })
      }

      showStatus('Connected to Poke! Check your phone for a welcome message.')
    } catch (e) {
      showStatus(e.message, 'error')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDisconnect = async () => {
    if (patientId) {
      try {
        await fetch(`/api/poke/unregister/${patientId}`, { method: 'DELETE' })
      } catch {}
    }
    setRegistered(false)
    setPatientId(null)
    setPhoneNumber('')
    storage.remove(`poke_registered_${userId}`)
    showStatus('Disconnected from reminders.')
  }

  const handleSendTest = async () => {
    if (!patientId) return
    setIsSendingTest(true)
    try {
      const res = await fetch('/api/poke/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showStatus('Test reminder sent! Check your phone.')
    } catch (e) {
      showStatus(e.message, 'error')
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleDeleteMedication = (id) => {
    saveMedications(medications.filter(m => m.id !== id))
  }

  // Check which suggested meds are already added
  const addedNames = new Set(medications.map(m => m.name))

  if (!pokeConfigured) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <WifiOff className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-800 mb-1">SMS Not Configured</h3>
          <p className="text-sm text-amber-600">
            Medication reminders require Twilio credentials. Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_ACCOUNT_SID</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_AUTH_TOKEN</code>, and <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_PHONE_NUMBER</code> to your server environment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Status toast */}
      {statusMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn ${
          statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {statusMessage.msg}
        </div>
      )}

      {/* ── Phone Connection Card ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-medflix-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Phone Connection</h3>
              <p className="text-xs text-gray-500">Receive medication reminders via SMS, iMessage, or WhatsApp</p>
            </div>
            {registered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                <Wifi className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          {registered ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Reminders active for <span className="font-medium text-gray-900">{phoneNumber}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
              />
              <button
                onClick={handleRegister}
                disabled={!phoneNumber.trim() || isRegistering}
                className="px-6 py-3 bg-medflix-accent text-gray-900 rounded-xl text-sm font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border-2 border-purple-700"
              >
                {isRegistering ? (
                  <div className="w-4 h-4 border-2 border-gray-700 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Connect to Poke
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Suggested Medications from Patient Record ─── */}
      {suggestedMeds.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Medications from Care Plan</h3>
                  <p className="text-xs text-gray-500">Pulled from {patientName}'s medical record — just click to add reminders</p>
                </div>
              </div>
              {suggestedMeds.some(s => !addedNames.has(s.name)) && (
                <button
                  onClick={handleAddAll}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {suggestedMeds.map((med) => {
              const isAdded = addedNames.has(med.name)
              return (
                <div key={med.id} className={`px-6 py-4 flex items-start gap-4 transition-colors ${isAdded ? 'bg-green-50/50' : 'hover:bg-purple-50/30'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isAdded ? 'bg-green-100' : 'bg-purple-100'}`}>
                    {isAdded ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Pill className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{med.name}</span>
                      {med.genericName && (
                        <span className="text-xs text-gray-400 italic">({med.genericName})</span>
                      )}
                      <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-medium">{med.dosage}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{med.purpose}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {med.frequencyLabel}
                      </span>
                      {med.route && (
                        <span className="text-xs text-gray-400">{med.route}</span>
                      )}
                      {med.times.length > 0 && (
                        <span className="text-xs text-purple-500 font-medium">
                          Suggested: {med.times.map(t => {
                            const [h, m] = t.split(':')
                            const hr = parseInt(h)
                            return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
                          }).join(', ')}
                        </span>
                      )}
                    </div>
                    {med.instructions && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{med.instructions}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddSuggested(med)}
                    disabled={isAdded}
                    className={`flex-shrink-0 mt-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                      isAdded
                        ? 'bg-green-100 text-green-700 border-2 border-green-300 cursor-default'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions Card ──────────────────────── */}
      {registered && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-medflix-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
                <p className="text-xs text-gray-500">Test your reminders</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-5 py-2.5 bg-medflix-accent text-gray-900 rounded-lg text-sm font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border-2 border-purple-700"
            >
              {isSendingTest ? (
                <div className="w-4 h-4 border-2 border-gray-700 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Test Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
