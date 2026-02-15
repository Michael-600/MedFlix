import { Lock, Check, Play, CheckCircle2 } from 'lucide-react'

export default function DayCard({ day, dayIndex, onComplete, onToggleChecklist, onWatchVideo }) {
  const isLocked = !day.unlocked
  const isCompleted = day.completed
  const checkedCount = day.checklist.filter(c => c.checked).length
  const allChecked = checkedCount === day.checklist.length

  const colors = [
    { bg: 'bg-medflix-red', border: 'border-medflix-red', light: 'bg-red-50' },
    { bg: 'bg-medflix-blue', border: 'border-medflix-blue', light: 'bg-blue-50' },
    { bg: 'bg-medflix-yellow', border: 'border-medflix-yellow', light: 'bg-yellow-50' },
    { bg: 'bg-medflix-purple', border: 'border-medflix-purple', light: 'bg-purple-50' },
  ];
  const colorScheme = colors[day.day % colors.length];

  return (
    <div
      className={`day-card relative overflow-hidden rounded-3xl border-5 p-6 transition-all bg-white ${
        isCompleted
          ? 'border-green-500 shadow-2xl'
          : isLocked
          ? 'locked border-gray-300 opacity-60'
          : `${colorScheme.border} shadow-xl hover:shadow-2xl hover:scale-[1.03]`
      }`}
    >
      {/* Geometric shape decoration */}
      {!isLocked && !isCompleted && (
        <div className={`absolute top-4 right-4 w-16 h-16 ${colorScheme.bg} opacity-10 rounded-full`}></div>
      )}
      {isCompleted && (
        <div className="absolute top-4 right-4 w-16 h-16 shape-star bg-green-500 opacity-20"></div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl font-black text-3xl shadow-lg border-4 ${
          isCompleted 
            ? 'bg-green-500 text-gray-900 border-green-700'
            : isLocked 
            ? 'bg-gray-400 text-gray-900 border-gray-600'
            : `${colorScheme.bg} text-gray-900 ${colorScheme.border}`
        }`}>
          {day.day}
        </div>
        {isCompleted && (
          <div className="flex flex-col items-end gap-1">
            <div className="w-10 h-10 shape-star bg-yellow-400 flex items-center justify-center shadow-lg border-2 border-yellow-600">
              <span className="text-gray-900 font-bold text-lg">★</span>
            </div>
            <span className="text-xs font-bold text-green-600">Completed!</span>
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h4 className={`font-black text-xl mb-3 ${isLocked ? 'text-gray-600' : 'text-gray-900'}`}>
        {day.title}
      </h4>
      <p className={`text-base leading-relaxed mb-6 font-medium ${isLocked ? 'text-gray-600' : 'text-gray-700'}`}>
        {day.description}
      </p>

      {/* Locked State */}
      {isLocked && (
        <div className="inline-flex items-center gap-3 px-5 py-4 bg-gray-200 border-4 border-gray-400 rounded-2xl text-base text-gray-700 font-black">
          <Lock className="w-6 h-6" />
          Complete Day {day.day - 1} First!
        </div>
      )}

      {/* Unlocked Active State */}
      {!isLocked && !isCompleted && (
        <>
          {/* Checklist */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-lg font-black text-gray-900">
                ✓ My Tasks
              </p>
              <span className={`text-base font-black px-4 py-2 rounded-full border-3 ${colorScheme.light} ${colorScheme.border}`}>
                {checkedCount}/{day.checklist.length}
              </span>
            </div>
            <div className="space-y-3">
              {day.checklist.map((item, i) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-4 cursor-pointer group p-4 rounded-2xl hover:${colorScheme.light} transition-all border-3 border-transparent hover:${colorScheme.border}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggleChecklist(i)}
                      className={`w-6 h-6 rounded-lg border-3 ${colorScheme.border} cursor-pointer`}
                      style={{accentColor: item.checked ? colorScheme.bg.replace('bg-', '') : undefined}}
                    />
                  </div>
                  <span
                    className={`text-base leading-relaxed font-semibold ${
                      item.checked ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onWatchVideo}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-gray-900 text-gray-100 text-lg font-black rounded-2xl hover:shadow-2xl transition-all hover:scale-105 hover:bg-black border-3 border-gray-700`}
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Watch!
            </button>
            {allChecked && (
              <button
                onClick={onComplete}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-green-500 text-gray-900 text-lg font-black rounded-2xl hover:bg-green-600 hover:shadow-2xl transition-all hover:scale-105 animate-scaleIn border-3 border-green-700"
              >
                <CheckCircle2 className="w-6 h-6" />
                Done!
              </button>
            )}
          </div>
        </>
      )}

      {/* Completed State */}
      {isCompleted && !isLocked && (
        <button
          onClick={onWatchVideo}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gray-100 text-gray-900 text-lg font-black rounded-2xl hover:bg-gray-200 transition-all border-4 border-gray-300 hover:scale-105"
        >
          <Play className="w-6 h-6" />
          Watch Again
        </button>
      )}
    </div>
  )
}
