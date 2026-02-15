import { useState, useEffect, useRef } from 'react'
import {
  X,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Maximize2,
  Video,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { searchClinicalData } from '../api/clinicalDataTool'

export default function VideoPlayer({
  day,
  patientName,
  patientDiagnosis,
  onClose,
  onComplete,
  onNavigateToAvatar,
  onVideoUrlResolved,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [evidenceStatus, setEvidenceStatus] = useState('idle')
  const [evidence, setEvidence] = useState(null)
  const [evidenceError, setEvidenceError] = useState(null)
  const [videoUrl, setVideoUrl] = useState(day?.videoUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef(null)
  const hasRealVideo = Boolean(videoUrl)

  const fetchVideoUrl = async (videoId) => {
    if (!videoId || isLoading) return
    setIsLoading(true)
    setFetchError(null)

    try {
      const res = await fetch(`/api/heygen/video-status/${videoId}`)
      const data = await res.json()
      const status = data?.data?.status
      const resolvedUrl = data?.data?.video_url

      if (status === 'completed' && resolvedUrl) {
        setVideoUrl(resolvedUrl)
        setFetchError(null)
        setVideoLoadError(false)
        if (onVideoUrlResolved && day?.day) {
          onVideoUrlResolved(day.day, resolvedUrl)
        }
      } else if (status === 'failed') {
        setFetchError('generation_failed')
      } else if (status === 'processing' || status === 'pending' || status === 'queued') {
        setFetchError('still_processing')
      } else {
        setFetchError('still_processing')
      }
    } catch (e) {
      console.warn('[VideoPlayer] Failed to fetch video URL:', e)
      setFetchError('network')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when switching to a different day
  useEffect(() => {
    setVideoUrl(day?.videoUrl || null)
    setIsLoading(false)
    setFetchError(null)
    setVideoLoadError(false)
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }, [day])

  // Auto-fetch video URL when available but missing
  useEffect(() => {
    if (day?.videoId && !videoUrl) {
      fetchVideoUrl(day.videoId)
    }
  }, [day?.videoId, videoUrl])

  // Poll if still processing
  useEffect(() => {
    if (!day?.videoId || videoUrl || fetchError !== 'still_processing') return
    const timer = setInterval(() => {
      fetchVideoUrl(day.videoId)
    }, 15000)
    return () => clearInterval(timer)
  }, [day?.videoId, videoUrl, fetchError])

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

  // Handle video seeking by clicking on progress bar
  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget
    const clickX = e.clientX - progressBar.getBoundingClientRect().left
    const width = progressBar.offsetWidth
    const clickedProgress = (clickX / width) * 100

    if (hasRealVideo && videoRef.current && duration > 0) {
      // Real video: seek to time
      const seekTime = (clickedProgress / 100) * duration
      videoRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
      setProgress(clickedProgress)
    } else {
      // Simulated video: just update progress
      setProgress(Math.max(0, Math.min(100, clickedProgress)))
    }
  }

  // Handle skip forward/backward
  const skipForward = () => {
    if (hasRealVideo && videoRef.current && duration > 0) {
      const newTime = Math.min(duration, currentTime + 10)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress((newTime / duration) * 100)
    }
  }

  const skipBackward = () => {
    if (hasRealVideo && videoRef.current && duration > 0) {
      const newTime = Math.max(0, currentTime - 10)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress((newTime / duration) * 100)
    }
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
            className="absolute top-4 right-4 text-gray-300 hover:text-gray-100 p-1 transition-colors z-10 bg-gray-900/50 rounded-full"
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
                  <p className="text-gray-100 text-sm font-bold">Loading video...</p>
                  <p className="text-gray-300 text-sm mt-1 font-medium">Fetching from HeyGen servers</p>
                </div>
              </div>
            )}

            {/* Video load error */}
            {videoLoadError && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="text-gray-100 font-bold mb-2 text-lg">Video playback issue</p>
                <p className="text-gray-300 text-sm mb-4 font-medium">
                  The video URL may have expired or have CORS restrictions.
                </p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 bg-purple-600 text-gray-900 rounded-lg font-bold hover:bg-purple-500 transition-colors border-2 border-purple-800"
                >
                  Open Video in New Tab
                </a>
              </div>
            )}

            {/* Still processing state */}
            {!hasRealVideo && !isLoading && fetchError === 'still_processing' && (
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                  <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                </div>
                <h3 className="text-gray-100 font-bold text-xl mb-2">Video Still Rendering...</h3>
                <p className="text-gray-300 text-base mb-3 font-medium">
                  HeyGen is generating your video. This typically takes 1-5 minutes.
                </p>
                <p className="text-gray-300 text-sm font-medium">Auto-checking every 15 seconds</p>
              </div>
            )}

            {/* Failed state */}
            {!hasRealVideo && !isLoading && fetchError === 'generation_failed' && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-100 font-bold mb-2 text-lg">Video Generation Failed</p>
                <p className="text-gray-300 text-sm font-medium">Please try regenerating this episode.</p>
              </div>
            )}

            {/* Network error state */}
            {!hasRealVideo && !isLoading && fetchError === 'network' && (
              <div className="text-center px-6">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="text-gray-100 font-bold mb-2 text-lg">Could not reach server</p>
                <p className="text-gray-300 text-sm mb-4 font-medium">Make sure the backend is running on port 3001.</p>
                <button
                  onClick={() => day.videoId && fetchVideoUrl(day.videoId)}
                  className="px-4 py-2 bg-purple-600 text-gray-900 rounded-lg text-sm font-bold hover:bg-purple-500 transition-colors border-2 border-purple-800"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Retry
                </button>
              </div>
            )}

            {/* Simulated video placeholder (no videoId at all) */}
            {!hasRealVideo && !isLoading && !fetchError && (
              <div className="text-center">
                <div className="w-28 h-28 bg-medflix-red rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-red-300">
                  {isPlaying ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-2 bg-medflix-red rounded-full animate-pulse"
                          style={{
                            height: `${24 + Math.random() * 20}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="w-12 h-12 text-gray-100 ml-2" fill="currentColor" />
                  )}
                </div>
                <h3 className="text-gray-100 font-semibold text-lg mb-1">
                  {day.episodeTitle || `Episode: ${day.title}`}
                </h3>
                <p className="text-gray-300 text-sm font-medium">Day {day.day} &bull; {day.title}</p>
                {day.videoId && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                    <p className="text-orange-400 text-xs font-medium">Video is being generated by AI...</p>
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
                  <p className="text-gray-200 text-sm mt-3 font-medium">
                    Click play to start your personalized episode
                  </p>
                )}
              </div>
            )}

            {/* Completion overlay */}
            {progress >= 100 && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center animate-fadeIn">
                <div className="text-center max-w-md px-6">
                  <div className="w-24 h-24 shape-star bg-yellow-400 mx-auto mb-6 flex items-center justify-center shadow-2xl border-3 border-yellow-600">
                    <span className="text-gray-900 font-black text-4xl">★</span>
                  </div>
                  <h4 className="text-gray-100 text-3xl font-black mb-3">You Did It!</h4>
                  <p className="text-gray-300 text-xl mb-8 font-bold">
                    Day {day.day} Complete!
                  </p>

                  {/* Call-to-action for Live Avatar */}
                  <div className="bg-blue-50 border-4 border-medflix-blue rounded-3xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Video className="w-7 h-7 text-medflix-blue" />
                      <p className="text-gray-900 font-black text-lg">Have Questions?</p>
                    </div>
                    <p className="text-gray-700 text-base mb-4 font-bold">
                      Chat with me! I can help!
                    </p>
                    <button
                      onClick={() => {
                        onClose()
                        if (onNavigateToAvatar) onNavigateToAvatar()
                      }}
                      className="w-full px-6 py-4 bg-medflix-blue text-gray-900 rounded-2xl font-black text-lg hover:bg-medflix-blue-dark transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-3 border-3 border-blue-700"
                    >
                      <Video className="w-6 h-6" />
                      Video Chat
                    </button>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={onComplete}
                      className="px-8 py-4 bg-green-500 text-gray-900 rounded-2xl font-black text-lg hover:bg-green-600 transition-all shadow-xl hover:scale-105 border-3 border-green-700"
                    >
                      Mark as Done! ✓
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-4 bg-gray-700 text-gray-100 rounded-2xl font-bold text-base hover:bg-gray-600 transition-all shadow-lg hover:scale-105 border-2 border-gray-600"
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
            {/* Progress Bar - Clickable for seeking */}
            <div className="mb-3">
              <div 
                className="bg-gray-700 rounded-full h-2 cursor-pointer group relative"
                onClick={handleProgressClick}
              >
                <div
                  className="bg-medflix-red h-2 rounded-full transition-all relative shadow-md pointer-events-none"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-medflix-yellow border-3 border-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  disabled={!hasRealVideo}
                  className="text-gray-100 hover:text-medflix-blue transition-colors disabled:opacity-30 hover:scale-110"
                  title="Skip back 10s"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </button>
                
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  disabled={progress >= 100 || (isLoading && !hasRealVideo)}
                  className="w-12 h-12 flex items-center justify-center text-gray-100 hover:text-medflix-red transition-colors disabled:opacity-50 hover:scale-110"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6" fill="currentColor" />
                  )}
                </button>
                
                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  disabled={!hasRealVideo}
                  className="text-gray-100 hover:text-medflix-blue transition-colors disabled:opacity-30 hover:scale-110"
                  title="Skip forward 10s"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </button>

                {/* Time Display */}
                <span className="text-base text-gray-200 ml-2 font-mono font-bold">
                  {hasRealVideo
                    ? `${formatTimeDuration(currentTime)} / ${formatTimeDuration(duration)}`
                    : `${formatTimeDuration(progress * 3)} / 5:00`}
                </span>
              </div>
              <button className="text-gray-300 hover:text-gray-100 transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clinical Data Highlights */}
          <div className="px-5 py-4 bg-medflix-darker border-t border-white/10">
            <div className="grid gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-300 mb-2 font-bold">
                  Clinical Data Highlights
                </p>
                {evidenceStatus === 'loading' && (
                  <p className="text-sm text-gray-300 font-medium">Searching clinical data sources...</p>
                )}
                {evidenceStatus === 'error' && (
                  <p className="text-sm text-amber-300 font-medium">
                    Unable to fetch evidence right now ({evidenceError}).
                  </p>
                )}
                {evidenceStatus === 'ready' ? (
                  <>
                    <p className="text-sm text-gray-200 leading-relaxed font-medium">
                      {evidence?.summary || 'No evidence summary returned.'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-300 font-medium">
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
