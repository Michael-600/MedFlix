import { useState, useEffect } from 'react'
import { X, Play, Pause, SkipForward, Volume2, Maximize2, Video, CheckCircle } from 'lucide-react'
import { searchClinicalData } from '../api/clinicalDataTool'

export default function VideoPlayer({
  day,
  patientName,
  patientDiagnosis,
  onClose,
  onComplete,
  onNavigateToAvatar,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [evidenceStatus, setEvidenceStatus] = useState('idle')
  const [evidence, setEvidence] = useState(null)
  const [evidenceError, setEvidenceError] = useState(null)

  useEffect(() => {
    if (hasRealVideo || !isPlaying) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false)
          clearInterval(interval)
          return 100
        }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, hasRealVideo])

  // Auto-play when video URL becomes available
  useEffect(() => {
    if (hasRealVideo && videoUrl && videoRef.current) {
      // Small delay to let the video element mount
      const timer = setTimeout(() => {
        videoRef.current?.play().catch(() => {
          // Autoplay blocked — user will click play
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasRealVideo, videoUrl])

  // Real video event handlers
  const handleTimeUpdate = () => {
    const vid = videoRef.current
    if (!vid) return
    setCurrentTime(vid.currentTime)
    if (vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    const vid = videoRef.current
    if (vid) setDuration(vid.duration)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setProgress(100)
  }

  const handleVideoError = (e) => {
    console.error('[VideoPlayer] Video element error:', e)
    setVideoLoadError(true)
  }

  const togglePlay = () => {
    if (hasRealVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((e) => {
          console.error('[VideoPlayer] Play failed:', e)
        })
      }
    }
    setIsPlaying(!isPlaying)
  }

  const formatTimeDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    let active = true
    setEvidenceStatus('loading')
    setEvidenceError(null)

    searchClinicalData({
      patientName,
      diagnosis: patientDiagnosis,
      episodeTitle: day?.episodeTitle,
      dayTitle: day?.title,
      dayDescription: day?.description,
      instruction: 'Tailor the script to the patient.',
    })
      .then((result) => {
        if (!active) return
        if (result.ok) {
          setEvidence(result.data)
          setEvidenceStatus('ready')
        } else {
          setEvidenceStatus('error')
          setEvidenceError(result.error || 'unknown_error')
        }
      })
      .catch(() => {
        if (!active) return
        setEvidenceStatus('error')
        setEvidenceError('request_failed')
      })

    return () => {
      active = false
    }
  }, [day, patientName, patientDiagnosis])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 video-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Video Area */}
        <div className="bg-medflix-dark rounded-2xl overflow-hidden shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 transition-colors z-10"
            aria-label="Close video"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Video Content */}
          <div className="relative aspect-video bg-gradient-to-br from-medflix-dark to-gray-900 flex items-center justify-center">
            {/* Real video element */}
            {hasRealVideo && videoUrl && !videoLoadError && (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={handleVideoError}
                playsInline
              />
            )}

            {/* Loading state - fetching URL */}
            {isLoading && !hasRealVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-medflix-accent animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm font-medium">Loading video...</p>
                  <p className="text-gray-400 text-xs mt-1">Fetching from HeyGen servers</p>
                </div>
              </div>
            )}

            {/* Video load error */}
            {videoLoadError && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Video playback issue</p>
                <p className="text-gray-400 text-sm mb-4">
                  The video URL may have expired or have CORS restrictions.
                </p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 bg-medflix-accent text-white rounded-lg font-medium hover:bg-medflix-accentLight transition-colors"
                >
                  Open Video in New Tab
                </a>
              </div>
            )}

            {/* Still processing state */}
            {!hasRealVideo && !isLoading && fetchError === 'still_processing' && (
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Video Still Rendering...</h3>
                <p className="text-gray-400 text-sm mb-3">
                  HeyGen is generating your video. This typically takes 1-5 minutes.
                </p>
                <p className="text-gray-500 text-xs">Auto-checking every 15 seconds</p>
              </div>
            )}

            {/* Failed state */}
            {!hasRealVideo && !isLoading && fetchError === 'generation_failed' && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Video Generation Failed</p>
                <p className="text-gray-400 text-sm">Please try regenerating this episode.</p>
              </div>
            )}

            {/* Network error state */}
            {!hasRealVideo && !isLoading && fetchError === 'network' && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Could not reach server</p>
                <p className="text-gray-400 text-sm mb-4">Make sure the backend is running on port 3001.</p>
                <button
                  onClick={() => day.videoId && fetchVideoUrl(day.videoId)}
                  className="px-4 py-2 bg-medflix-accent text-white rounded-lg text-sm hover:bg-medflix-accentLight transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Retry
                </button>
              </div>
            )}

            {/* Simulated video placeholder (no videoId at all) */}
            {!hasRealVideo && !isLoading && !fetchError && (
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
                {day.videoId && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    <p className="text-yellow-400 text-xs">Video is being generated by AI...</p>
                    <button
                      onClick={() => fetchVideoUrl(day.videoId)}
                      className="text-medflix-accent text-xs underline ml-2"
                    >
                      <RefreshCw className="w-3 h-3 inline mr-1" />
                      Check status
                    </button>
                  </div>
                )}
                {!day.videoId && !isPlaying && progress === 0 && (
                  <p className="text-gray-500 text-xs mt-3">
                    Click play to start your personalized episode
                  </p>
                )}
              </div>
            )}

            {/* Completion overlay */}
            {progress >= 100 && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center animate-fadeIn">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">Episode Complete!</h4>
                  <p className="text-gray-400 text-sm mb-6">
                    Great job! You've finished Day {day.day}.
                  </p>

                  {/* Call-to-action for Live Avatar */}
                  <div className="bg-medflix-accent/10 border border-medflix-accent/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Video className="w-5 h-5 text-medflix-accent" />
                      <p className="text-white font-medium text-sm">Have Questions?</p>
                    </div>
                    <p className="text-gray-400 text-xs mb-3">
                      Chat with your AI health companion for personalized answers
                    </p>
                    <button
                      onClick={() => {
                        onClose()
                        if (onNavigateToAvatar) onNavigateToAvatar()
                      }}
                      className="w-full px-4 py-2.5 bg-medflix-accent text-white rounded-lg font-medium hover:bg-medflix-accentLight transition-colors flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Talk to Live Avatar
                    </button>
                  </div>

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
                  onClick={togglePlay}
                  disabled={progress >= 100 || (isLoading && !hasRealVideo)}
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
                  {hasRealVideo
                    ? `${formatTimeDuration(currentTime)} / ${formatTimeDuration(duration)}`
                    : `${formatTimeDuration(progress * 3)} / 5:00`}
                </span>
              </div>
              <button className="text-white/60 hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clinical Data Highlights */}
          <div className="px-5 py-4 bg-medflix-darker border-t border-white/10">
            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Clinical Data Highlights
                </p>
                {evidenceStatus === 'loading' && (
                  <p className="text-sm text-gray-400">Searching clinical data sources...</p>
                )}
                {evidenceStatus === 'error' && (
                  <p className="text-sm text-amber-300">
                    Unable to fetch evidence right now ({evidenceError}).
                  </p>
                )}
                {evidenceStatus === 'ready' ? (
                  <>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {evidence?.summary || 'No evidence summary returned.'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Evidence summary will appear here once available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
