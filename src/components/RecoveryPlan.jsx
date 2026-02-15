import { useState, useEffect, useRef } from 'react'
import DayCard from './DayCard'
import VideoPlayer from './VideoPlayer'
import { samplePatient } from '../data/patientData'

export default function RecoveryPlan({
  plan,
  patientName,
  patientDiagnosis,
  onUpdate,
  onNavigateToAvatar,
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Personalized Care Plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Started: {formatDate(plan.startDate)} {'\u2022'} {plan.totalDays} episodes
          {plan.diagnosis && <> {'\u2022'} {plan.diagnosis}</>}
        </p>

        {/* Patient context card */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-medflix-accent/10 rounded-full flex items-center justify-center flex-shrink-0 text-medflix-accent font-bold text-sm">
              {(patientName || samplePatient.name).split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{patientName || samplePatient.name}</p>
              <p className="text-xs text-gray-500">
                {samplePatient.age}yo {samplePatient.sex} {'\u2022'} {patientDiagnosis || samplePatient.diagnosis}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {samplePatient.medications.map((med) => (
                  <span key={med.name} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {med.name} {med.dose}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Care Team: {samplePatient.careTeam.map(c => c.name).join(' • ')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2 max-w-md">
          <div
            className="bg-medflix-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / plan.totalDays) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {completedCount} of {plan.totalDays} episodes completed
        </p>
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
