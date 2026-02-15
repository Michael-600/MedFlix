import { useState, useEffect, useMemo } from 'react'
import { Bell, Phone, Plus, Trash2, Edit3, Check, X, Send, Wifi, WifiOff, Clock, Pill, CheckCircle2, Circle } from 'lucide-react'
import { storage } from '../utils/storage'
import { defaultMedications } from '../data/mockData'

function formatTime12h(time24) {
  if (!time24 || typeof time24 !== 'string') return ''
  const [h, m] = time24.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time24
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

const TIME_COLORS = [
  'bg-red-100 text-red-700 border-red-300',
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-emerald-100 text-emerald-700 border-emerald-300',
  'bg-cyan-100 text-cyan-700 border-cyan-300',
]

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
]

export default function MedicationReminders({ patientName, diagnosis, userId }) {
  const [registered, setRegistered] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
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

  const todayKey = getTodayKey()
  const [adherence, setAdherence] = useState(() => {
    return storage.get(`adherence_${userId}_${getTodayKey()}`) || {}
  })

  const timelineSlots = useMemo(() => {
    const slotMap = {}
    medications.filter(m => m.active).forEach((med, medIdx) => {
      ;(med.times || []).forEach(t => {
        if (!t || typeof t !== 'string' || !t.includes(':')) return
        if (!slotMap[t]) slotMap[t] = { time: t, meds: [], colorIdx: Object.keys(slotMap).length }
        slotMap[t].meds.push({ ...med, _colorIdx: medIdx })
      })
    })
    return Object.values(slotMap).sort((a, b) => a.time.localeCompare(b.time))
  }, [medications])

  const adherenceStats = useMemo(() => {
    let total = 0, taken = 0
    timelineSlots.forEach(slot => {
      slot.meds.forEach(med => {
        total++
        if (adherence[`${med.id}_${slot.time}`]) taken++
      })
    })
    return { total, taken }
  }, [timelineSlots, adherence])

  const nextUpTime = useMemo(() => {
    const now = new Date()
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    for (const slot of timelineSlots) {
      const allTaken = slot.meds.every(med => adherence[`${med.id}_${slot.time}`])
      if (!allTaken && slot.time >= nowStr) return slot.time
    }
    return null
  }, [timelineSlots, adherence])

  const saveAdherence = (newAdherence) => {
    setAdherence(newAdherence)
    storage.set(`adherence_${userId}_${todayKey}`, newAdherence)
  }

  const handleToggleTaken = (med, time) => {
    const key = `${med.id}_${time}`
    const newAdherence = { ...adherence }
    if (newAdherence[key]) {
      delete newAdherence[key]
    } else {
      newAdherence[key] = new Date().toISOString()
    }
    saveAdherence(newAdherence)

    // Fire-and-forget sync to backend
    if (patientId && !adherence[key]) {
      fetch('/api/poke/log-adherence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, medicationName: med.name, time, takenAt: newAdherence[key] }),
      }).catch(() => {})
    }
  }

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

    // Check if Poke is configured
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setPokeConfigured(data.poke === true))
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
        body: JSON.stringify({ name: patientName, userId, diagnosis, phoneNumber: phoneNumber.trim() }),
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

      showStatus('Connected to Poke! You will receive personalized medication reminders.')
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
          <h3 className="text-lg font-semibold text-amber-800 mb-1">Poke Not Configured</h3>
          <p className="text-sm text-amber-600">
            Medication reminders require Poke API credentials. Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">POKE_API_KEY</code> to your server <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code> file to enable intelligent medication reminders.
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
              <h3 className="font-semibold text-gray-900 text-sm">Poke Connection</h3>
              <p className="text-xs text-gray-500">Receive intelligent, personalized medication reminders</p>
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
                Reminders active for <span className="font-medium text-gray-900">{patientName}</span>
                {phoneNumber && <span className="text-gray-400 ml-1">({phoneNumber})</span>}
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Connect to Poke to receive intelligent, personalized medication reminders via your preferred messaging app.
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
                />
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || !phoneNumber.trim()}
                  className="px-6 py-3 bg-medflix-accent text-gray-900 rounded-xl text-sm font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-purple-700"
                >
                  {isRegistering ? (
                    <div className="w-4 h-4 border-2 border-gray-700 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Today's Schedule Timeline ────────────────── */}
      {timelineSlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-medflix-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Today's Schedule</h3>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-medflix-accent/10 text-gray-900 text-xs font-bold rounded-full border border-medflix-accent/30">
                {adherenceStats.taken}/{adherenceStats.total} doses taken
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: adherenceStats.total > 0 ? `${(adherenceStats.taken / adherenceStats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {timelineSlots.map((slot, slotIdx) => {
                const allTaken = slot.meds.every(med => adherence[`${med.id}_${slot.time}`])
                const isNextUp = slot.time === nextUpTime
                return (
                  <div key={slot.time} className="flex gap-4 items-start">
                    {/* Time label + dot */}
                    <div className="flex flex-col items-center w-20 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-700">{formatTime12h(slot.time)}</span>
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${
                        allTaken
                          ? 'bg-green-500'
                          : isNextUp
                            ? 'bg-medflix-accent animate-pulse'
                            : 'bg-gray-300'
                      }`} />
                      {slotIdx < timelineSlots.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                      )}
                    </div>
                    {/* Medication chips */}
                    <div className="flex flex-wrap gap-2 flex-1 pt-0.5">
                      {slot.meds.map((med) => {
                        const key = `${med.id}_${slot.time}`
                        const taken = !!adherence[key]
                        const color = TIME_COLORS[med._colorIdx % TIME_COLORS.length]
                        return (
                          <button
                            key={key}
                            onClick={() => handleToggleTaken(med, slot.time)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              taken
                                ? 'bg-green-50 text-green-700 border-green-300 line-through opacity-75'
                                : `${color} border-2 hover:scale-105 active:scale-95`
                            }`}
                          >
                            {taken ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            {med.name} {med.dosage}
                          </button>
                        )
                      })}
                      {isNextUp && !allTaken && (
                        <span className="self-center text-[10px] font-bold text-medflix-accent bg-medflix-accent/10 px-2 py-0.5 rounded-full">
                          next up
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
              className="px-4 py-2 bg-medflix-accent text-gray-900 rounded-lg text-sm font-bold hover:bg-medflix-accentLight transition-colors flex items-center gap-1.5 border-2 border-purple-700"
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
                  className="px-4 py-2 text-sm font-bold text-gray-900 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  disabled={!formData.name.trim() || !formData.dosage.trim()}
                  className="px-4 py-2 bg-medflix-accent text-gray-900 rounded-lg text-sm font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 border-2 border-purple-700"
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
            className="px-5 py-2.5 bg-medflix-accent text-gray-900 rounded-lg text-sm font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border-2 border-purple-700"
          >
            {isSendingTest ? (
              <div className="w-4 h-4 border-2 border-gray-700 border-t-gray-900 rounded-full animate-spin" />
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
