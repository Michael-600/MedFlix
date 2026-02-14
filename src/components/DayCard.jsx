import { Lock, Check, Play, CheckCircle2 } from 'lucide-react'

export default function DayCard({ day, dayIndex, onComplete, onToggleChecklist, onWatchVideo }) {
  const isLocked = !day.unlocked
  const isCompleted = day.completed
  const checkedCount = day.checklist.filter(c => c.checked).length
  const allChecked = checkedCount === day.checklist.length

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
          {/* Checklist */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Checklist ({checkedCount}/{day.checklist.length})
            </p>
            <div className="space-y-2">
              {day.checklist.map((item, i) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 cursor-pointer group"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggleChecklist(i)}
                      className="w-4 h-4 rounded border-gray-300 text-medflix-accent focus:ring-medflix-accent cursor-pointer"
                    />
                  </div>
                  <span
                    className={`text-xs leading-relaxed ${
                      item.checked ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onWatchVideo}
              className="flex items-center gap-1.5 px-4 py-2 bg-medflix-dark text-white text-xs font-medium rounded-lg hover:bg-medflix-darker transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="white" />
              Watch Video
            </button>
            {allChecked && (
              <button
                onClick={onComplete}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors animate-fadeIn"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Complete
              </button>
            )}
          </div>
        </>
      )}

      {/* Completed State */}
      {isCompleted && !isLocked && (
        <button
          onClick={onWatchVideo}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Rewatch Video
        </button>
      )}
    </div>
  )
}
