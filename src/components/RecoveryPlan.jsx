import { useState, useEffect, useRef } from 'react'
import DayCard from './DayCard'
import VideoPlayer from './VideoPlayer'

export default function RecoveryPlan({ plan, onUpdate, onNavigateToAvatar }) {
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

  const handleToggleChecklist = (dayIndex, checklistIndex) => {
    const updated = { ...plan, days: [...plan.days] }
    const day = { ...updated.days[dayIndex] }
    const checklist = [...day.checklist]
    checklist[checklistIndex] = {
      ...checklist[checklistIndex],
      checked: !checklist[checklistIndex].checked,
    }
    day.checklist = checklist
    updated.days[dayIndex] = day
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
        <h2 className="text-2xl font-bold text-gray-900">Personalized Recovery Plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Started: {formatDate(plan.startDate)} {'\u2022'} {plan.totalDays} days total
          {plan.diagnosis && <> {'\u2022'} {plan.diagnosis}</>}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2 max-w-md">
          <div
            className="bg-medflix-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / plan.totalDays) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {completedCount} of {plan.totalDays} days completed
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
            onToggleChecklist={(ci) => handleToggleChecklist(index, ci)}
            onWatchVideo={() => handleWatchVideo(index)}
          />
        ))}
      </div>

      {/* Video Player Modal */}
      {showVideo !== null && (
        <VideoPlayer
          day={plan.days[showVideo]}
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
