import { useState, useEffect } from 'react'
import { Bell, Phone, Plus, Trash2, Edit3, Check, X, Send, Wifi, WifiOff, Clock, Pill } from 'lucide-react'
import { storage } from '../utils/storage'
import { defaultMedications } from '../data/mockData'

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
]

export default function MedicationReminders({ patientName, diagnosis, userId }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [registered, setRegistered] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [medications, setMedications] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [pokeConfigured, setPokeConfigured] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    times: ['08:00'],
    instructions: '',
  })

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
    } else if (diagnosis && defaultMedications[diagnosis]) {
      // Auto-populate from defaults on first visit
      const defaults = defaultMedications[diagnosis].map((med, i) => ({
        ...med,
        id: `med_${Date.now()}_${i}`,
        active: true,
      }))
      setMedications(defaults)
      storage.set(`medications_${userId}`, defaults)
    }

    // Check if Twilio (SMS delivery) is configured
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setPokeConfigured(data.twilio === true))
      .catch(() => setPokeConfigured(false))
  }, [userId, diagnosis])

  const showStatus = (msg, type = 'success') => {
    setStatusMessage({ msg, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const saveMedications = (meds) => {
    setMedications(meds)
    storage.set(`medications_${userId}`, meds)

    // Sync to backend if registered
    if (patientId) {
      fetch('/api/poke/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, medications: meds }),
      }).catch(err => console.error('Failed to sync medications:', err))
    }
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

      // Sync medications to backend
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

  const resetForm = () => {
    setFormData({ name: '', dosage: '', frequency: 'once_daily', times: ['08:00'], instructions: '' })
    setShowAddForm(false)
    setEditingId(null)
  }

  const handleAddMedication = () => {
    if (!formData.name.trim() || !formData.dosage.trim()) return

    if (editingId) {
      const updated = medications.map(m =>
        m.id === editingId ? { ...m, ...formData } : m
      )
      saveMedications(updated)
    } else {
      const newMed = {
        ...formData,
        id: `med_${Date.now()}`,
        active: true,
      }
      saveMedications([...medications, newMed])
    }
    resetForm()
  }

  const handleEditMedication = (med) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times || ['08:00'],
      instructions: med.instructions || '',
    })
    setEditingId(med.id)
    setShowAddForm(true)
  }

  const handleDeleteMedication = (id) => {
    saveMedications(medications.filter(m => m.id !== id))
  }

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.times]
    newTimes[index] = value
    setFormData({ ...formData, times: newTimes })
  }

  const addTimeSlot = () => {
    setFormData({ ...formData, times: [...formData.times, '12:00'] })
  }

  const removeTimeSlot = (index) => {
    if (formData.times.length <= 1) return
    setFormData({ ...formData, times: formData.times.filter((_, i) => i !== index) })
  }

  // Not configured banner
  if (!pokeConfigured) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <WifiOff className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-800 mb-1">SMS Not Configured</h3>
          <p className="text-sm text-amber-600">
            Medication reminders require Twilio credentials. Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_ACCOUNT_SID</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_AUTH_TOKEN</code>, and <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">TWILIO_PHONE_NUMBER</code> to your server environment to enable SMS reminders.
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

      {/* ── Phone Registration Card ─────────────────── */}
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
                className="px-6 py-3 bg-medflix-accent text-white rounded-xl text-sm font-medium hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRegistering ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Connect to Poke
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Medication Schedule Card ────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-medflix-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Medication Schedule</h3>
                <p className="text-xs text-gray-500">{medications.length} medication{medications.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddForm(true) }}
              className="px-4 py-2 bg-medflix-accent text-white rounded-lg text-sm font-medium hover:bg-medflix-accentLight transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {medications.length === 0 && !showAddForm && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No medications added yet. Click "Add" to get started.
            </div>
          )}

          {medications.map((med) => (
            <div key={med.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Pill className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{med.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{med.dosage}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {med.times?.join(', ') || 'Not set'}
                  </span>
                  {med.instructions && (
                    <span className="text-xs text-gray-400">{med.instructions}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditMedication(med)}
                  className="p-2 text-gray-400 hover:text-medflix-accent hover:bg-medflix-accent/5 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMedication(med.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add / Edit Form */}
          {showAddForm && (
            <div className="p-6 bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                {editingId ? 'Edit Medication' : 'Add New Medication'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Metformin"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g. 500mg"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Instructions</label>
                  <input
                    type="text"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="e.g. Take with food"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Time pickers */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Reminder Times</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {formData.times.map((time, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(i, e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                      />
                      {formData.times.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(i)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTimeSlot}
                    className="px-3 py-2 text-xs text-medflix-accent border border-medflix-accent/30 rounded-lg hover:bg-medflix-accent/5 transition-colors"
                  >
                    + Add time
                  </button>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  disabled={!formData.name.trim() || !formData.dosage.trim()}
                  className="px-4 py-2 bg-medflix-accent text-white rounded-lg text-sm font-medium hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Save Changes' : 'Add Medication'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions Card ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-medflix-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
              <p className="text-xs text-gray-500">Test your reminders and manage your connection</p>
            </div>
          </div>
        </div>
        <div className="p-6 flex flex-wrap gap-3">
          <button
            onClick={handleSendTest}
            disabled={!registered || isSendingTest}
            className="px-5 py-2.5 bg-medflix-accent text-white rounded-lg text-sm font-medium hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSendingTest ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Test Reminder
          </button>
          {!registered && (
            <p className="text-xs text-gray-400 self-center">Connect your phone above to send test reminders</p>
          )}
        </div>
      </div>
    </div>
  )
}
