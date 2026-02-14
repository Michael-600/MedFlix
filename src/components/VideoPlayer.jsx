import { useState, useEffect } from 'react'
import { X, Play, Pause, SkipForward, Volume2, Maximize2, CheckCircle } from 'lucide-react'

export default function VideoPlayer({ day, onClose, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showQuestion, setShowQuestion] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)

  // Simulated video questions (checkpoint-style like Neuroflix)
  const questions = [
    {
      question: `Based on today's episode about "${day.title}", which of the following is most important?`,
      options: [
        'Follow your care team\'s specific instructions',
        'Only rely on internet research',
        'Skip medications if feeling better',
        'Avoid all physical activity',
      ],
      correct: 0,
    },
    {
      question: 'When should you contact your healthcare provider?',
      options: [
        'Only during scheduled appointments',
        'When experiencing unexpected symptoms or concerns',
        'Never, unless it\'s an emergency',
        'Only when medications run out',
      ],
      correct: 1,
    },
  ]

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false)
          clearInterval(interval)
          return 100
        }
        // Show question at 50%
        if (p >= 48 && p < 52 && !showQuestion && !answered) {
          setIsPlaying(false)
          setShowQuestion(true)
          return 50
        }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, showQuestion, answered])

  const handleAnswer = (idx) => {
    setAnswered(true)
    setTimeout(() => {
      setShowQuestion(false)
      setAnswered(false)
      setIsPlaying(true)
      setQuestionIndex((q) => q + 1)
    }, 1500)
  }

  const currentQuestion = questions[questionIndex % questions.length]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 video-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-4xl animate-slideUp">
        {/* Close button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Area */}
        <div className="bg-medflix-dark rounded-2xl overflow-hidden shadow-2xl">
          {/* Video Content */}
          <div className="relative aspect-video bg-gradient-to-br from-medflix-dark to-gray-900 flex items-center justify-center">
            {/* Simulated video content */}
            <div className="text-center">
              <div className="w-20 h-20 bg-medflix-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {isPlaying ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-medflix-accent rounded-full animate-pulse"
                        style={{
                          height: `${20 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Play className="w-8 h-8 text-medflix-accent ml-1" fill="#00d4aa" />
                )}
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                {day.episodeTitle || `Episode: ${day.title}`}
              </h3>
              <p className="text-gray-400 text-sm">Day {day.day} &bull; {day.title}</p>
              {!isPlaying && progress === 0 && (
                <p className="text-gray-500 text-xs mt-3">
                  Click play to start your personalized episode
                </p>
              )}
            </div>

            {/* Question Overlay */}
            {showQuestion && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 animate-fadeIn">
                <div className="w-full max-w-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-medflix-accent rounded-full animate-pulse-soft" />
                    <span className="text-medflix-accent text-sm font-medium">Knowledge Check</span>
                  </div>
                  <h4 className="text-white text-lg font-medium mb-6">
                    {currentQuestion.question}
                  </h4>
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={answered}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          answered && i === currentQuestion.correct
                            ? 'border-green-500 bg-green-500/10 text-green-400'
                            : answered
                            ? 'border-gray-700 text-gray-500 opacity-50'
                            : 'border-gray-600 text-gray-300 hover:border-medflix-accent hover:bg-medflix-accent/5'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                        {answered && i === currentQuestion.correct && (
                          <CheckCircle className="inline w-4 h-4 ml-2 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                  {answered && (
                    <p className="text-green-400 text-sm mt-4 animate-fadeIn">
                      Correct! Continuing episode...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Completion overlay */}
            {progress >= 100 && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">Episode Complete!</h4>
                  <p className="text-gray-400 text-sm mb-6">
                    Great job! You've finished Day {day.day}.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={onComplete}
                      className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                    >
                      Complete Day {day.day}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-5 py-4 bg-medflix-darker">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="bg-gray-700 rounded-full h-1 cursor-pointer group">
                <div
                  className="bg-medflix-accent h-1 rounded-full transition-all relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-medflix-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={showQuestion || progress >= 100}
                  className="w-9 h-9 flex items-center justify-center text-white hover:text-medflix-accent transition-colors disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5" fill="currentColor" />
                  )}
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 ml-2">
                  {formatTime(progress * 3)} / 5:00
                </span>
              </div>
              <button className="text-white/60 hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
