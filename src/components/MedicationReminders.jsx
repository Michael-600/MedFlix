import { useState, useEffect, useMemo } from 'react'
import { Bell, Plus, Trash2, Edit3, Check, X, Send, Wifi, WifiOff, Clock, Pill, CheckCircle2, Circle } from 'lucide-react'
import { storage } from '../utils/storage'
import { defaultMedications } from '../data/mockData'

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
]

const TIME_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
]

function formatTime12h(time24) {
  if (!time24 || !time24.includes(':')) return time24 || '--:--'
  const [h, m] = time24.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time24
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

export default function MedicationReminders({ patientName, diagnosis, userId }) {
  const [registered, setRegistered] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [medications, setMedications] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [pokeConfigured, setPokeConfigured] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)
  const [adherence, setAdherence] = useState({}) // { "medId_time": timestamp }

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
    }

    const savedMeds = storage.get(`medications_${userId}`)
    if (savedMeds) {
      setMedications(savedMeds)
    } else if (diagnosis && defaultMedications[diagnosis]) {
      const defaults = defaultMedications[diagnosis].map((med, i) => ({
        ...med,
        id: `med_${Date.now()}_${i}`,
        active: true,
      }))
      setMedications(defaults)
      storage.set(`medications_${userId}`, defaults)
    }

    // Load today's adherence
    const todayAdherence = storage.get(`adherence_${userId}_${getTodayKey()}`)
    if (todayAdherence) setAdherence(todayAdherence)

    fetch('/api/health')
      .then(r => r.json())
      .then(data => setPokeConfigured(data.poke === true))
      .catch(() => setPokeConfigured(false))
  }, [userId, diagnosis])

  // Build timeline data: group medications by time slot
  const timelineSlots = useMemo(() => {
    const slots = new Map() // time → [{ med, colorIdx }]
    let colorIdx = 0
    const colorMap = new Map() // medId → colorIdx

    medications.filter(m => m.active).forEach(med => {
      if (!colorMap.has(med.id)) {
        colorMap.set(med.id, colorIdx % TIME_COLORS.length)
        colorIdx++
      }
      const times = (med.times || ['08:00']).filter(t => t && t.includes(':'))
      times.forEach(time => {
        if (!slots.has(time)) slots.set(time, [])
        slots.get(time).push({ med, colorIdx: colorMap.get(med.id) })
      })
    })

    return Array.from(slots.entries())
      .sort(([a], [b]) => a.localeCompare(b))
  }, [medications])

  // Adherence stats
  const adherenceStats = useMemo(() => {
    let total = 0
    let taken = 0
    medications.filter(m => m.active).forEach(med => {
      const times = med.times || ['08:00']
      times.forEach(time => {
        total++
        if (adherence[`${med.id}_${time}`]) taken++
      })
    })
    return { total, taken }
  }, [medications, adherence])

  // Find next upcoming medication
  const nextUpTime = useMemo(() => {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    let closest = null
    let closestDiff = Infinity

    for (const [time] of timelineSlots) {
      const [h, m] = time.split(':').map(Number)
      const timeMinutes = h * 60 + m
      const diff = timeMinutes - nowMinutes
      if (diff > 0 && diff < closestDiff) {
        // Only "next up" if not all meds at this time are taken
        const slot = timelineSlots.find(([t]) => t === time)
        const allTaken = slot?.[1].every(({ med }) => adherence[`${med.id}_${time}`])
        if (!allTaken) {
          closest = time
          closestDiff = diff
        }
      }
    }
    return closest
  }, [timelineSlots, adherence])

  const showStatus = (msg, type = 'success') => {
    setStatusMessage({ msg, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const saveAdherence = (newAdherence) => {
    setAdherence(newAdherence)
    storage.set(`adherence_${userId}_${getTodayKey()}`, newAdherence)
  }

  const handleToggleTaken = (med, time) => {
    const key = `${med.id}_${time}`
    const newAdherence = { ...adherence }

    if (newAdherence[key]) {
      delete newAdherence[key]
    } else {
      const now = new Date().toISOString()
      newAdherence[key] = now

      // Sync to backend if registered
      if (patientId) {
        fetch('/api/poke/log-adherence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            medicationName: med.name,
            time,
            takenAt: now,
          }),
        }).catch(err => console.error('Failed to log adherence:', err))
      }
    }

    saveAdherence(newAdherence)
  }

  const saveMedications = (meds) => {
    setMedications(meds)
    storage.set(`medications_${userId}`, meds)

    if (patientId) {
      fetch('/api/poke/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, medications: meds }),
      })
        .then(() => showStatus('Medications synced to Poke'))
        .catch(err => {
          console.error('Failed to sync medications:', err)
          showStatus('Failed to sync medications to Poke', 'error')
        })
    }
  }

  const handleRegister = async () => {
    setIsRegistering(true)
    try {
      const res = await fetch('/api/poke/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: patientName, userId, diagnosis }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setRegistered(true)
      setPatientId(data.patientId)
      storage.set(`poke_registered_${userId}`, {
        registered: true,
        patientId: data.patientId,
      })

      if (medications.length > 0) {
        await fetch('/api/poke/medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: data.patientId, medications }),
        })
      }

      const savedPlan = storage.get(`plan_${userId}`)
      if (savedPlan) {
        await fetch('/api/poke/recovery-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: data.patientId, recoveryPlan: savedPlan }),
        }).catch(err => console.error('Failed to sync recovery plan:', err))
      }

      showStatus('Connected to Poke! You\'ll receive messages in your connected app.')
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
      showStatus('Test reminder sent! Check your Poke-connected app.')
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
            Medication reminders require a Poke API key. Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">POKE_API_KEY</code> to your server environment and connect via <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">npx poke tunnel</code> to enable messaging.
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

      {/* ── Poke Connection Card ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-medflix-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Poke Connection</h3>
              <p className="text-xs text-gray-500">Receive medication reminders via iMessage, Telegram, or SMS through Poke</p>
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
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Connect to receive personalized medication reminders through your Poke-linked messaging app.
              </p>
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="px-6 py-3 bg-medflix-accent text-white rounded-xl text-sm font-medium hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 ml-4"
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

      {/* ── Today's Schedule Timeline ─────────────── */}
      {timelineSlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-emerald-50/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Today's Schedule</h3>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${adherenceStats.taken === adherenceStats.total && adherenceStats.total > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {adherenceStats.taken}/{adherenceStats.total}
                </span>
                <p className="text-xs text-gray-500">doses taken</p>
              </div>
            </div>
            {/* Progress bar */}
            {adherenceStats.total > 0 && (
              <div className="mt-3 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${adherenceStats.taken === adherenceStats.total ? 'bg-emerald-500' : 'bg-medflix-accent'}`}
                  style={{ width: `${(adherenceStats.taken / adherenceStats.total) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[43px] top-2 bottom-2 w-px bg-gray-200" />

              <div className="space-y-5">
                {timelineSlots.map(([time, meds]) => {
                  const isNextUp = time === nextUpTime
                  const allTaken = meds.every(({ med }) => adherence[`${med.id}_${time}`])

                  return (
                    <div key={time} className="flex items-start gap-4 relative">
                      {/* Time label */}
                      <div className="w-[52px] flex-shrink-0 text-right pt-0.5">
                        <span className={`text-xs font-mono font-medium ${isNextUp ? 'text-medflix-accent' : allTaken ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatTime12h(time)}
                        </span>
                      </div>

                      {/* Timeline dot */}
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 relative z-10 ${
                        allTaken
                          ? 'bg-emerald-500 border-emerald-500'
                          : isNextUp
                            ? 'bg-medflix-accent border-medflix-accent animate-pulse'
                            : 'bg-white border-gray-300'
                      }`} />

                      {/* Medication chips */}
                      <div className="flex-1 flex flex-wrap gap-2">
                        {meds.map(({ med, colorIdx }) => {
                          const takenKey = `${med.id}_${time}`
                          const isTaken = !!adherence[takenKey]

                          return (
                            <button
                              key={takenKey}
                              onClick={() => handleToggleTaken(med, time)}
                              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                isTaken
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through decoration-emerald-400'
                                  : `${TIME_COLORS[colorIdx]} hover:shadow-sm`
                              }`}
                            >
                              {isTaken ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                              )}
                              {med.name} {med.dosage}
                            </button>
                          )
                        })}
                        {isNextUp && !allTaken && (
                          <span className="self-center text-[10px] font-semibold text-medflix-accent uppercase tracking-wider">
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
            <p className="text-xs text-gray-400 self-center">Connect to Poke above to send test reminders</p>
          )}
        </div>
      </div>
    </div>
  )
}
