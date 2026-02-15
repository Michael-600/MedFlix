import { useState, useEffect, useRef } from 'react'
import { storage } from '../utils/storage'
import DayCard from './DayCard'
import VideoPlayer from './VideoPlayer'
import { samplePatient } from '../data/patientData'

export default function RecoveryPlan({
  plan,
  patientName,
  patientDiagnosis,
  onUpdate,
  onNavigateToAvatar,
  userId,
}) {
  const [showVideo, setShowVideo] = useState(null)
  const refreshedRef = useRef(false)

  const completedCount = plan.days.filter(d => d.completed).length

  // On mount, auto-refresh video URLs for any day that has videoId but no videoUrl
  useEffect(() => {
    if (refreshedRef.current) return
    refreshedRef.current = true

    const daysNeedingUrl = plan.days.filter((d) => d.videoId && !d.videoUrl)
    if (daysNeedingUrl.length === 0) return

    console.log(`[RecoveryPlan] ${daysNeedingUrl.length} videos need URL refresh`)

    const refreshUrls = async () => {
      let changed = false
      const updatedDays = [...plan.days]

      for (let i = 0; i < updatedDays.length; i++) {
        const day = updatedDays[i]
        if (day.videoId && !day.videoUrl) {
          try {
            const res = await fetch(`/api/heygen/video-status/${day.videoId}`)
            const data = await res.json()
            if (data?.data?.status === 'completed' && data?.data?.video_url) {
              updatedDays[i] = { ...day, videoUrl: data.data.video_url }
              changed = true
              console.log(`[RecoveryPlan] Day ${day.day} URL resolved`)
            }
          } catch (e) {
            console.warn(`[RecoveryPlan] Failed to fetch video URL for day ${day.day}:`, e)
          }
        }
      }

      if (changed) {
        const updatedPlan = { ...plan, days: updatedDays }
        onUpdate(updatedPlan)
      }
    }

    refreshUrls()
  }, [plan.days])

  const handleCompleteDay = (dayIndex) => {
    const updated = { ...plan, days: [...plan.days] }
    updated.days[dayIndex] = { ...updated.days[dayIndex], completed: true }

    // Unlock next day
    if (dayIndex + 1 < updated.days.length) {
      updated.days[dayIndex + 1] = { ...updated.days[dayIndex + 1], unlocked: true }
    }

    onUpdate(updated)

    // Notify Poke about recovery milestone if registered
    if (userId) {
      const pokeReg = storage.get(`poke_registered_${userId}`)
      if (pokeReg?.registered && pokeReg?.patientId) {
        const day = updated.days[dayIndex]
        const nextDay = dayIndex + 1 < updated.days.length ? updated.days[dayIndex + 1] : null
        fetch('/api/poke/recovery-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: pokeReg.patientId,
            dayNumber: day.day,
            dayTitle: day.title,
            nextDayTitle: nextDay?.title || null,
          }),
        }).catch(() => {})
      }
    }
  }

  const handleWatchVideo = (dayIndex) => {
    setShowVideo(dayIndex)
  }

  // When VideoPlayer resolves a video URL, persist it to the plan
  const handleVideoUrlResolved = (dayNumber, url) => {
    const updated = { ...plan, days: [...plan.days] }
    const idx = updated.days.findIndex((d) => d.day === dayNumber)
    if (idx !== -1) {
      updated.days[idx] = { ...updated.days[idx], videoUrl: url }
      onUpdate(updated)
      console.log(`[RecoveryPlan] Persisted video URL for day ${dayNumber}`)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div>
      {/* Plan Header */}
      <div className="mb-10 relative">
        {/* Decorative geometric shapes */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-medflix-yellow opacity-15 rounded-full"></div>
        <div className="absolute -top-8 -left-8 w-16 h-16 bg-medflix-blue opacity-15 rotate-45"></div>
        
        <div className="relative bg-white rounded-3xl border-5 border-gray-200 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">My Learning Path!</h2>
              <p className="text-xl text-gray-700 font-bold">
                {plan.totalDays} Awesome Lessons
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[...Array(plan.totalDays)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 shape-star flex items-center justify-center ${
                      i < completedCount ? 'bg-yellow-400 border-2 border-yellow-600' : 'bg-gray-200 border-2 border-gray-400'
                    }`}
                  >
                    <span className="text-gray-900 font-bold text-sm">★</span>
                  </div>
                ))}
              </div>
              <span className="text-base font-black text-gray-700">{completedCount} of {plan.totalDays}</span>
            </div>
          </div>

          {/* Patient context card */}
          <div className="bg-blue-50 border-4 border-medflix-blue rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-4 ring-medflix-blue">
                <img 
                  src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=faces"
                  alt={patientName || samplePatient.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-2xl text-gray-900">{patientName || samplePatient.name}</p>
                <p className="text-lg text-gray-700 mt-1 font-bold">
                  Age {samplePatient.age} • {patientDiagnosis || samplePatient.diagnosis}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {samplePatient.medications.map((med, idx) => {
                    const pillStyles = [
                      'bg-red-600 text-gray-900 border-2 border-red-800',
                      'bg-blue-600 text-gray-900 border-2 border-blue-800', 
                      'bg-yellow-500 text-gray-900 border-2 border-yellow-700',
                      'bg-purple-600 text-gray-900 border-2 border-purple-800'
                    ];
                    return (
                      <span key={med.name} className={`text-sm ${pillStyles[idx % 4]} px-4 py-2 rounded-full font-bold shadow-md`}>
                        {med.name} {med.dose}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-100 rounded-2xl p-6 border-4 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-black text-gray-900">Progress</span>
              <span className="text-2xl font-black text-medflix-purple">
                {Math.round((completedCount / plan.totalDays) * 100)}%
              </span>
            </div>
            <div className="bg-white rounded-full h-8 shadow-inner border-3 border-gray-300 overflow-hidden">
              <div
                className="bg-medflix-purple h-full rounded-full transition-all duration-500 flex items-center justify-center border-2 border-purple-700"
                style={{ width: `${(completedCount / plan.totalDays) * 100}%` }}
              >
                <span className="text-gray-900 font-black text-sm">
                  {completedCount > 0 && `${completedCount} ★`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plan.days.map((day, index) => (
          <DayCard
            key={day.day}
            day={day}
            dayIndex={index}
            onComplete={() => handleCompleteDay(index)}
            onWatchVideo={() => handleWatchVideo(index)}
          />
        ))}
      </div>

      {/* Video Player Modal */}
      {showVideo !== null && (
        <VideoPlayer
          day={plan.days[showVideo]}
          patientName={patientName}
          patientDiagnosis={patientDiagnosis || plan?.diagnosis}
          onClose={() => setShowVideo(null)}
          onComplete={() => {
            handleCompleteDay(showVideo)
            setShowVideo(null)
          }}
          onNavigateToAvatar={onNavigateToAvatar}
          onVideoUrlResolved={handleVideoUrlResolved}
        />
      )}
    </div>
  )
}
