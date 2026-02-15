import { useState, useEffect, useRef } from 'react'
import { storage } from '../utils/storage'
import DayCard from './DayCard'
import VideoPlayer from './VideoPlayer'
import { samplePatient } from '../data/patientData'
import { battleCards } from '../data/quizData'
import { Trophy, Star } from 'lucide-react'

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

  // Resolve the current patient for emoji/avatar
  const currentPatient = samplePatient // could be enhanced to use getPatientById

  // Card collection from storage
  const cardStorageKey = `medflix_cards_${currentPatient?.id || 'default'}`
  const collectedCards = storage.get(cardStorageKey) || []

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

  return (
    <div>
      {/* Plan Header — "My Health Adventure!" */}
      <div className="mb-10 relative">
        {/* Decorative shapes */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 opacity-20 rounded-full blur-xl"></div>
        <div className="absolute -top-8 -left-8 w-16 h-16 bg-pink-400 opacity-20 rotate-45 blur-xl"></div>

        <div className="relative bg-white rounded-3xl border-5 border-gray-200 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">
                {currentPatient?.emoji || '⭐'} My Health Adventure!
              </h2>
              <p className="text-xl text-gray-700 font-bold">
                {plan.totalDays} Awesome Episodes
              </p>
            </div>

            {/* Card collection counter */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-3 border-yellow-400 rounded-2xl shadow-md">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-black text-gray-900">
                  {collectedCards.length}/{battleCards.length}
                </span>
                <span className="text-sm font-bold text-gray-600">Cards</span>
              </div>
            </div>
          </div>

          {/* Kid patient context */}
          <div className="bg-blue-50 border-4 border-medflix-blue rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-200 to-purple-200 shadow-lg ring-4 ring-medflix-blue text-5xl">
                {currentPatient?.avatar || '🧒'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-2xl text-gray-900">
                  {patientName || currentPatient?.name}
                </p>
                <p className="text-lg text-gray-700 mt-1 font-bold">
                  Age {currentPatient?.age} {currentPatient?.emoji || ''} • {patientDiagnosis || currentPatient?.diagnosis}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(currentPatient?.medications || []).map((med, idx) => {
                    const pillStyles = [
                      'bg-red-500 text-white border-2 border-red-700',
                      'bg-blue-500 text-white border-2 border-blue-700',
                      'bg-green-500 text-white border-2 border-green-700',
                      'bg-purple-500 text-white border-2 border-purple-700',
                    ]
                    return (
                      <span key={med.name} className={`text-sm ${pillStyles[idx % 4]} px-4 py-2 rounded-full font-bold shadow-md`}>
                        {med.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Star Progress */}
          <div className="bg-gray-100 rounded-2xl p-6 border-4 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-black text-gray-900">Progress</span>
              <span className="text-2xl font-black text-medflix-purple">
                {Math.round((completedCount / plan.totalDays) * 100)}%
              </span>
            </div>
            <div className="flex gap-1 mb-3">
              {[...Array(plan.totalDays)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all ${
                    i < completedCount
                      ? 'bg-yellow-400 border-2 border-yellow-600 shadow-md'
                      : 'bg-gray-200 border-2 border-gray-300'
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${i < completedCount ? 'text-yellow-700 fill-yellow-600' : 'text-gray-400'}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-center text-base font-black text-gray-700">
              {completedCount} of {plan.totalDays} episodes complete!
            </p>
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
            diagnosis={patientDiagnosis || currentPatient?.diagnosis}
            patientId={currentPatient?.id}
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
