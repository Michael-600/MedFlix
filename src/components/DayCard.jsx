import { useState, useEffect } from 'react'
import { Lock, Check, Play, CheckCircle2, Lightbulb, Star, Trophy, Sparkles } from 'lucide-react'
import { getQuizQuestions, getBattleCard } from '../data/quizData'
import { storage } from '../utils/storage'

// ── Confetti burst animation ──────────────────────────────────
function ConfettiBurst({ show }) {
  if (!show) return null
  const pieces = Array.from({ length: 30 })
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((_, i) => {
        const colors = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-pink-400', 'bg-purple-400']
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const size = 6 + Math.random() * 8
        return (
          <div
            key={i}
            className={`absolute rounded-full ${colors[i % colors.length]}`}
            style={{
              left: `${left}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size}px`,
              animation: `confetti-fall ${1.2 + Math.random() * 0.8}s ease-out ${delay}s forwards`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Battle Card Component ─────────────────────────────────────
function BattleCardReveal({ card, revealed }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (revealed && !flipped) {
      const timer = setTimeout(() => setFlipped(true), 300)
      return () => clearTimeout(timer)
    }
  }, [revealed])

  if (!card) return null

  return (
    <div style={{ perspective: '1000px' }} className="w-full">
      <div
        className="relative w-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '200px',
        }}
      >
        {/* Card Back (mystery) */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col items-center justify-center border-4 border-dashed border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-4xl mb-2">❓</div>
          <p className="text-sm font-bold text-gray-500">Mystery Card</p>
          <p className="text-xs text-gray-400">Answer the quiz to reveal!</p>
        </div>

        {/* Card Front (revealed) — pre-rotated 180deg so it reads correctly when parent flips */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col items-center justify-center border-4 ${card.border} bg-gradient-to-br ${card.color} shadow-xl`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-5xl mb-1 drop-shadow-lg">{card.emoji}</div>
          <h4 className="text-lg font-black text-white drop-shadow-md">{card.name}</h4>
          <div className="flex items-center justify-center gap-0.5 my-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < card.stars ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-white/90 uppercase tracking-wide">{card.power}</p>
          <p className="text-xs text-white/80 mt-1 italic">"{card.fact}"</p>
        </div>
      </div>
    </div>
  )
}

// ── Quiz Section ──────────────────────────────────────────────
function QuizSection({ questions, onAllCorrect, diagnosis }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({}) // questionIndex -> 'correct' | 'wrong'
  const [showConfetti, setShowConfetti] = useState(false)
  const [tryAgain, setTryAgain] = useState(false)

  if (!questions || questions.length === 0) return null

  const q = questions[currentQ]
  const allDone = Object.keys(answers).length === questions.length
  const allCorrect = allDone && Object.values(answers).every((a) => a === 'correct')

  useEffect(() => {
    if (allCorrect && onAllCorrect) {
      onAllCorrect()
    }
  }, [allCorrect])

  const handleAnswer = (option) => {
    if (answers[currentQ]) return // already answered

    if (option.correct) {
      setAnswers((prev) => ({ ...prev, [currentQ]: 'correct' }))
      setShowConfetti(true)
      setTryAgain(false)
      setTimeout(() => {
        setShowConfetti(false)
        if (currentQ < questions.length - 1) {
          setTimeout(() => setCurrentQ(currentQ + 1), 400)
        }
      }, 1500)
    } else {
      setTryAgain(true)
      setTimeout(() => setTryAgain(false), 2000)
    }
  }

  return (
    <div className="relative">
      <ConfettiBurst show={showConfetti} />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-black text-purple-700">Quiz Time!</p>
        <span className="text-xs text-gray-500 ml-auto">
          {Object.values(answers).filter((a) => a === 'correct').length} / {questions.length}
        </span>
      </div>

      {!allCorrect && (
        <div className="bg-purple-50 border-3 border-purple-200 rounded-2xl p-4">
          <p className="text-base font-bold text-gray-800 mb-3">{q.question}</p>

          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, idx) => {
              const isAnswered = answers[currentQ]
              const isCorrectOpt = opt.correct
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!isAnswered}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-3 transition-all text-center ${
                    isAnswered && isCorrectOpt
                      ? 'border-green-500 bg-green-50 scale-105 shadow-md'
                      : isAnswered && !isCorrectOpt
                      ? 'border-gray-200 bg-gray-50 opacity-50'
                      : 'border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50 hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-xs font-bold text-gray-700">{opt.text}</span>
                </button>
              )
            })}
          </div>

          {tryAgain && (
            <p className="text-center text-sm font-bold text-orange-500 mt-2 animate-bounce">
              Almost! Try again! 💪
            </p>
          )}

          {answers[currentQ] === 'correct' && (
            <p className="text-center text-sm font-bold text-green-600 mt-2">
              {currentQ < questions.length - 1 ? 'Awesome! Next question...' : '🎉 You got them ALL right!'}
            </p>
          )}
        </div>
      )}

      {allCorrect && (
        <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-lg font-black text-green-700">🌟 PERFECT SCORE! 🌟</p>
          <p className="text-sm text-green-600 font-bold mt-1">You're a Health Hero!</p>
        </div>
      )}
    </div>
  )
}

// ── Main DayCard ──────────────────────────────────────────────
export default function DayCard({ day, dayIndex, onComplete, onWatchVideo, diagnosis, patientId }) {
  const isLocked = !day.unlocked
  const isCompleted = day.completed
  const takeaways = day.keyTakeaways || []
  const episodeNumber = day.day

  // Battle card and quiz
  const battleCard = getBattleCard(episodeNumber)
  const quizQuestions = getQuizQuestions(episodeNumber, diagnosis)

  // Track collected cards in localStorage
  const cardStorageKey = `medflix_cards_${patientId || 'default'}`
  const [collectedCards, setCollectedCards] = useState(() => {
    return storage.get(cardStorageKey) || []
  })
  const [cardRevealed, setCardRevealed] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  const hasCard = collectedCards.includes(episodeNumber)

  const handleQuizComplete = () => {
    setQuizPassed(true)
    // Reveal and collect the battle card
    if (!hasCard && battleCard) {
      const updated = [...collectedCards, episodeNumber]
      setCollectedCards(updated)
      storage.set(cardStorageKey, updated)
    }
    setCardRevealed(true)
  }

  // Episode thumbnail emojis
  const episodeEmojis = ['👋', '🔍', '🛡️', '⏰', '🍎', '📢', '🏆']
  const episodeColors = [
    'from-blue-400 to-cyan-400 border-blue-400',
    'from-purple-400 to-indigo-400 border-purple-400',
    'from-green-400 to-emerald-400 border-green-400',
    'from-yellow-400 to-amber-400 border-yellow-400',
    'from-orange-400 to-red-400 border-orange-400',
    'from-red-400 to-pink-400 border-red-400',
    'from-yellow-300 to-pink-400 border-yellow-300',
  ]
  const colorClass = episodeColors[(episodeNumber - 1) % episodeColors.length]

  return (
    <div
      className={`day-card bg-white rounded-3xl border-4 p-5 relative overflow-hidden transition-all ${
        isCompleted
          ? 'border-green-400 shadow-md'
          : isLocked
          ? 'locked border-gray-200 opacity-70'
          : 'border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02]'
      }`}
    >
      {/* Episode badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-2xl shadow-md border-2`}>
            {episodeEmojis[(episodeNumber - 1) % episodeEmojis.length]}
          </div>
          <div>
            <h3 className={`text-lg font-black ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
              Episode {episodeNumber}
            </h3>
            <h4 className={`font-bold text-sm ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
              {day.title}
            </h4>
          </div>
        </div>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-black rounded-xl shadow-md">
            <Check className="w-3.5 h-3.5" /> Done!
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`text-xs leading-relaxed mb-4 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {day.description}
      </p>

      {/* Locked State */}
      {isLocked && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          <Lock className="w-4 h-4" />
          <span className="font-bold">Complete Episode {episodeNumber - 1} to unlock!</span>
        </div>
      )}

      {/* Unlocked Active State */}
      {!isLocked && !isCompleted && (
        <>
          {/* Key Takeaways */}
          {takeaways.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Key Takeaways
              </p>
              <ul className="space-y-1.5">
                {takeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <span className="mt-0.5 text-yellow-500">⭐</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={onWatchVideo}
              className={`flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r ${colorClass} text-white text-xs font-black rounded-xl hover:scale-105 transition-all shadow-md border-2`}
            >
              <Play className="w-3.5 h-3.5" fill="white" />
              Watch My Show!
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white text-xs font-black rounded-xl hover:bg-green-600 hover:scale-105 transition-all shadow-md border-2 border-green-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Done!
            </button>
          </div>

          {/* Quiz Section */}
          {quizQuestions.length > 0 && (
            <div className="mb-3">
              <QuizSection
                questions={quizQuestions}
                onAllCorrect={handleQuizComplete}
                diagnosis={diagnosis}
              />
            </div>
          )}

          {/* Battle Card (mystery or revealed) */}
          {battleCard && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <p className="text-xs font-black text-gray-700">Collector Card</p>
              </div>
              <BattleCardReveal card={battleCard} revealed={cardRevealed || hasCard} />
            </div>
          )}
        </>
      )}

      {/* Completed State */}
      {isCompleted && !isLocked && (
        <div>
          {/* Show collected battle card */}
          {battleCard && (hasCard || isCompleted) && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <p className="text-xs font-black text-green-700">Card Collected!</p>
              </div>
              <BattleCardReveal card={battleCard} revealed={true} />
            </div>
          )}

          {/* Takeaways */}
          {takeaways.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
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
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Watch Again
          </button>
        </div>
      )}
    </div>
  )
}
