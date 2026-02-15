import { Lock, Check, Play, CheckCircle2, Lightbulb } from 'lucide-react'

export default function DayCard({ day, dayIndex, onComplete, onWatchVideo }) {
  const isLocked = !day.unlocked
  const isCompleted = day.completed
  const takeaways = day.keyTakeaways || []

  return (
    <div
      className={`day-card bg-white rounded-xl border-2 p-5 relative ${
        isCompleted
          ? 'border-green-400 shadow-sm'
          : isLocked
          ? 'locked border-gray-100'
          : 'border-gray-200 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-lg font-bold ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
          Day {day.day}
        </h3>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-md">
            <Check className="w-3 h-3" /> Complete
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h4 className={`font-semibold text-sm mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
        {day.title}
      </h4>
      <p className={`text-xs leading-relaxed mb-4 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {day.description}
      </p>

      {/* Locked State */}
      {isLocked && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3.5 h-3.5" />
          Complete Day {day.day - 1} to unlock
        </div>
      )}

      {/* Unlocked Active State */}
      {!isLocked && !isCompleted && (
        <>
          {/* Key Takeaways */}
          {takeaways.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Key Takeaways
              </p>
              <ul className="space-y-1.5">
                {takeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-medflix-accent flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onWatchVideo}
              className="flex items-center gap-1.5 px-4 py-2 bg-medflix-dark text-white text-xs font-medium rounded-lg hover:bg-medflix-darker transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="white" />
              Watch Video
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Complete
            </button>
          </div>
        </>
      )}

      {/* Completed State — show takeaways + rewatch */}
      {isCompleted && !isLocked && (
        <div>
          {takeaways.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Key Takeaways
              </p>
              <ul className="space-y-1">
                {takeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                    <Check className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={onWatchVideo}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Rewatch Video
          </button>
        </div>
      )}
    </div>
  )
}
