import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic, MicOff, PhoneOff, Phone, AlertCircle,
  Video, VideoOff, User,
} from 'lucide-react'
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client'

const STATE = { IDLE: 'idle', CONNECTING: 'connecting', CONNECTED: 'connected', ERROR: 'error' }

export default function LiveAvatar() {
  const [callState, setCallState] = useState(STATE.IDLE)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [caption, setCaption] = useState('')
  const [captionRole, setCaptionRole] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [connectingStep, setConnectingStep] = useState('')

  const roomRef = useRef(null)
  const avatarVideoRef = useRef(null)
  const userVideoRef = useRef(null)
  const userStreamRef = useRef(null)
  const keepAliveRef = useRef(null)
  const sessionRef = useRef({ id: null, token: null })
  const durationRef = useRef(null)
  const captionTimerRef = useRef(null)
  const seenTextsRef = useRef(new Set())
  // Track which track SIDs we've already attached to avoid duplicates
  const attachedTrackSids = useRef(new Set())

  // ── Call duration timer ─────────────────────────────
  useEffect(() => {
    if (callState === STATE.CONNECTED) {
      setCallDuration(0)
      durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000)
    } else {
      if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null }
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current) }
  }, [callState])

  // Cleanup on unmount
  useEffect(() => {
    return () => { endCall() }
  }, [])

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // ── Show caption with dedup & auto-fade ─────────────
  const showCaption = useCallback((text, role) => {
    const key = `${role}:${text}`
    if (seenTextsRef.current.has(key)) return
    seenTextsRef.current.add(key)
    setTimeout(() => seenTextsRef.current.delete(key), 30000)
    setCaption(text)
    setCaptionRole(role)
    if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
    captionTimerRef.current = setTimeout(() => { setCaption(''); setCaptionRole(null) }, 8000)
  }, [])

  // ── Attach a remote track (with dedup) ──────────────
  const doAttachTrack = useCallback((track, participant) => {
    const sid = track.sid || `${participant?.identity}-${track.kind}`
    if (attachedTrackSids.current.has(sid)) {
      console.log(`[LiveAvatar] Skip duplicate: ${track.kind} ${sid}`)
      return
    }
    attachedTrackSids.current.add(sid)
    const who = participant?.identity || 'unknown'
    console.log(`[LiveAvatar] Attaching ${track.kind} from ${who} (sid: ${sid})`)

    if (track.kind === Track.Kind.Video) {
      if (avatarVideoRef.current) {
        track.attach(avatarVideoRef.current)
        console.log('[LiveAvatar] ✓ Avatar video attached')
      }
    }

    if (track.kind === Track.Kind.Audio) {
      const el = track.attach()           // creates <audio> with srcObject
      el.volume = 1.0
      el.autoplay = true
      el.setAttribute('data-lk-managed', 'true')
      if (!el.parentElement) document.body.appendChild(el)
      el.play().then(() => {
        console.log(`[LiveAvatar] ✓ Audio playing from ${who}`)
      }).catch((e) => {
        console.warn(`[LiveAvatar] Audio play blocked for ${who}:`, e.message)
      })
    }
  }, [])

  // ── User camera ─────────────────────────────────────
  const startUserCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      })
      userStreamRef.current = stream
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream
        // Force play to ensure frames decode
        userVideoRef.current.play().catch(() => {})
        console.log('[LiveAvatar] ✓ User camera streaming')
      }
      setIsCamOn(true)
    } catch (e) {
      console.warn('[LiveAvatar] Camera denied:', e.message)
      setIsCamOn(false)
    }
  }

  const stopUserCamera = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((t) => t.stop())
      userStreamRef.current = null
    }
    if (userVideoRef.current) userVideoRef.current.srcObject = null
    setIsCamOn(false)
  }

  const toggleCamera = () => { isCamOn ? stopUserCamera() : startUserCamera() }

  // ── Send command to avatar via data channel ─────────
  const sendCommand = useCallback((eventType, data = {}) => {
    const room = roomRef.current
    if (!room || room.state !== ConnectionState.Connected) return
    const payload = { event_type: eventType, session_id: sessionRef.current.id, ...data }
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    try {
      room.localParticipant.publishData(bytes, { reliable: true, topic: 'agent-control' })
      console.log(`[LiveAvatar] → Command: ${eventType}`)
    } catch (e) {
      console.error(`[LiveAvatar] publishData error:`, e)
    }
  }, [])

  // ── Start call ──────────────────────────────────────
  const startCall = async () => {
    setCallState(STATE.CONNECTING)
    setErrorMsg('')
    setCaption('')
    seenTextsRef.current.clear()
    attachedTrackSids.current.clear()

    try {
      // 0. Cleanup stale sessions
      setConnectingStep('Preparing...')
      try {
        const r = await fetch('/api/liveavatar/stop-all', { method: 'POST' })
        const d = await r.json()
        if (d.stopped > 0) await new Promise((r) => setTimeout(r, 1500))
      } catch { /* non-critical */ }

      // 1. Token
      setConnectingStep('Setting up session...')
      const tokenRes = await fetch('/api/liveavatar/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sandbox: false }),
      })
      const tokenData = await tokenRes.json()
      if (!tokenData.data?.session_token) throw new Error(tokenData.message || 'Token failed')
      sessionRef.current = { id: tokenData.data.session_id, token: tokenData.data.session_token }

      // 2. Start
      setConnectingStep('Connecting to AI doctor...')
      const startRes = await fetch('/api/liveavatar/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionRef.current.token }),
      })
      const startData = await startRes.json()
      if (!startData.data?.livekit_url) throw new Error(startData.message || 'Start failed')
      const { livekit_url, livekit_client_token } = startData.data

      // 3. LiveKit room
      setConnectingStep('Joining call...')
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
      })
      roomRef.current = room

      // Events
      room.on(RoomEvent.Disconnected, () => { setCallState(STATE.IDLE); cleanupAll() })

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        doAttachTrack(track, participant)
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        const sid = track.sid
        if (sid) attachedTrackSids.current.delete(sid)
        track.detach()
      })

      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!room.canPlaybackAudio) room.startAudio().catch(() => {})
      })

      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const evt = JSON.parse(new TextDecoder().decode(payload))
          console.log(`[LiveAvatar] ← Event: ${evt.event_type}`, evt.text ? `"${evt.text.slice(0, 60)}"` : '')
          handleServerEvent(evt)
        } catch { /* non-JSON */ }
      })

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setIsAvatarSpeaking(speakers.some((s) => s.identity !== 'client'))
        setIsUserSpeaking(speakers.some((s) => s.identity === 'client'))
      })

      // Connect
      await room.connect(livekit_url, livekit_client_token)
      console.log('[LiveAvatar] Room connected')

      // CRITICAL: unlock audio immediately (still in user gesture chain)
      await room.startAudio()
      console.log('[LiveAvatar] ✓ startAudio() done')

      // Enable mic
      setConnectingStep('Enabling microphone...')
      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        setIsMicOn(true)
        console.log('[LiveAvatar] ✓ Mic enabled')
      } catch (e) {
        console.error('[LiveAvatar] Mic failed:', e)
        setIsMicOn(false)
      }

      // Go to connected state
      setCallState(STATE.CONNECTED)
      setConnectingStep('')

      // Start user camera after a short delay (refs are now in DOM)
      setTimeout(() => startUserCamera(), 500)

      // Tell avatar to listen
      setTimeout(() => sendCommand('avatar.start_listening'), 1000)

      // Keep-alive
      keepAliveRef.current = setInterval(async () => {
        try {
          await fetch('/api/liveavatar/keep-alive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionRef.current.id, session_token: sessionRef.current.token }),
          })
        } catch { /* silent */ }
      }, 2 * 60 * 1000)

    } catch (e) {
      console.error('Call failed:', e)
      setErrorMsg(e.message || 'Failed to connect')
      setCallState(STATE.ERROR)
      setConnectingStep('')
    }
  }

  // ── Handle data channel events ──────────────────────
  // When we get a final user.transcription, forward it to the avatar
  // as avatar.speak_response so the LLM generates a reply.
  // This is needed because CONVERSATIONAL auto-response doesn't trigger reliably.
  const handleServerEvent = useCallback((event) => {
    const { event_type, text } = event
    switch (event_type) {
      case 'avatar.speak_started':  setIsAvatarSpeaking(true);  break
      case 'avatar.speak_ended':    setIsAvatarSpeaking(false); break
      case 'user.speak_started':    setIsUserSpeaking(true);    break
      case 'user.speak_ended':      setIsUserSpeaking(false);   break
      case 'user.transcription':
        if (text) {
          showCaption(text, 'user')
          // Auto-forward to LLM so the avatar responds
          console.log(`[LiveAvatar] → Forwarding to LLM: "${text}"`)
          sendCommand('avatar.speak_response', { text })
        }
        break
      case 'avatar.transcription':  if (text) showCaption(text, 'avatar'); break
      case 'session.stopped':       setCallState(STATE.IDLE); cleanupAll(); break
      default: break
    }
  }, [showCaption, sendCommand])

  // ── Toggle mic ──────────────────────────────────────
  const toggleMic = async () => {
    const room = roomRef.current
    if (!room || room.state !== ConnectionState.Connected) return
    const target = !isMicOn
    try {
      await room.localParticipant.setMicrophoneEnabled(target)
      setIsMicOn(target)
      console.log(`[LiveAvatar] Mic → ${target ? 'ON' : 'OFF'}`)
    } catch (e) { console.error('[LiveAvatar] Mic toggle error:', e) }
  }

  // ── End call ────────────────────────────────────────
  const endCall = async () => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null }
    const { id, token } = sessionRef.current
    if (id || token) {
      try {
        await fetch('/api/liveavatar/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: id, session_token: token }),
        })
      } catch { /* best effort */ }
    }
    stopUserCamera()
    cleanupAll()
    setCallState(STATE.IDLE)
    sessionRef.current = { id: null, token: null }
    setCaption('')
    seenTextsRef.current.clear()
    attachedTrackSids.current.clear()
  }

  const cleanupAll = () => {
    if (roomRef.current) {
      try { roomRef.current.disconnect() } catch { /* ok */ }
      roomRef.current = null
    }
    document.querySelectorAll('audio[data-lk-managed]').forEach((el) => el.remove())
  }

  // ─────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '680px' }}>

        {/* ═══ ALWAYS IN DOM: Avatar video ═══ */}
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black transition-opacity duration-500 ${
          callState === STATE.CONNECTED ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <video ref={avatarVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        </div>

        {/*
          ALWAYS IN DOM: User camera video
          NOT display:none — use offscreen positioning so the browser still decodes frames
        */}
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}
        />

        {/* ═══ IDLE / ERROR ═══ */}
        {(callState === STATE.IDLE || callState === STATE.ERROR) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-medflix-darker to-gray-900">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-20 left-20 w-64 h-64 bg-medflix-accent rounded-full blur-[100px]" />
              <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10 text-center px-8">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-medflix-accent/30 to-medflix-accentLight/30 flex items-center justify-center border-4 border-medflix-accent/40 shadow-lg shadow-medflix-accent/20">
                  <User className="w-16 h-16 text-medflix-accent" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Dr. Sarah AI</h2>
              <p className="text-gray-400 text-lg mb-1">Your Personal Health Guide</p>
              <p className="text-gray-500 text-sm mb-10">Available now for a live consultation</p>
              {callState === STATE.ERROR && errorMsg && (
                <div className="mb-8 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl max-w-sm mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  </div>
                </div>
              )}
              <button onClick={startCall}
                className="group inline-flex items-center gap-3 px-10 py-4 bg-green-500 text-white rounded-full font-semibold text-lg hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-green-500/30">
                <Phone className="w-6 h-6 group-hover:animate-pulse" />
                Start Call
              </button>
              <p className="text-gray-600 text-xs mt-6">Voice call with AI &bull; Speak naturally &bull; Camera optional</p>
            </div>
          </div>
        )}

        {/* ═══ CONNECTING ═══ */}
        {callState === STATE.CONNECTING && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-medflix-darker to-gray-900">
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-medflix-accent/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-medflix-accent animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-medflix-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Calling Dr. Sarah AI...</h3>
              <p className="text-gray-400 text-sm animate-pulse">{connectingStep || 'Please wait...'}</p>
            </div>
            <button onClick={endCall}
              className="absolute bottom-10 px-8 py-3 bg-red-500/20 text-red-400 rounded-full font-medium hover:bg-red-500/30 transition-colors">
              Cancel
            </button>
          </div>
        )}

        {/* ═══ CONNECTED UI ═══ */}
        {callState === STATE.CONNECTED && (
          <>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white/90 text-sm font-medium">Dr. Sarah AI</span>
                  <span className="text-white/40 text-sm">&bull;</span>
                  <span className="text-white/60 text-sm font-mono">{formatDuration(callDuration)}</span>
                </div>
                {isAvatarSpeaking && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-medflix-accent/20 rounded-full">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-1 bg-medflix-accent rounded-full animate-pulse"
                          style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-medflix-accent text-xs font-medium">Speaking</span>
                  </div>
                )}
              </div>
            </div>

            {/* User camera PIP — canvas mirrors the offscreen video */}
            <div className="absolute top-20 right-5 z-20">
              <div className={`relative w-36 h-28 rounded-2xl overflow-hidden shadow-lg border-2 transition-colors ${
                isUserSpeaking ? 'border-medflix-accent' : 'border-white/20'
              }`}>
                {isCamOn ? (
                  <CameraMirror sourceRef={userVideoRef} />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                {isUserSpeaking && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-0.5 bg-medflix-accent rounded-full animate-pulse"
                        style={{ height: `${4 + Math.random() * 6}px`, animationDelay: `${i * 0.07}s` }} />
                    ))}
                  </div>
                )}
                {!isMicOn && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="absolute bottom-1.5 left-2 text-white/70 text-[10px] font-medium drop-shadow">You</p>
              </div>
            </div>

            {/* Live captions */}
            {caption && (
              <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center px-8 pointer-events-none">
                <div className={`max-w-2xl px-5 py-3 rounded-2xl backdrop-blur-md text-center animate-fadeIn ${
                  captionRole === 'user' ? 'bg-medflix-accent/80 text-white' : 'bg-black/70 text-white'
                }`}>
                  {captionRole === 'user' && (
                    <p className="text-[10px] text-white/60 font-medium mb-0.5 uppercase tracking-wider">You said</p>
                  )}
                  <p className="text-sm leading-relaxed font-medium">{caption}</p>
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6">
              <div className="flex items-center justify-center gap-5">
                <button onClick={toggleMic}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMicOn ? 'bg-white/15 hover:bg-white/25 backdrop-blur-sm' : 'bg-red-500 hover:bg-red-600'
                  }`} title={isMicOn ? 'Mute' : 'Unmute'}>
                  {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
                </button>
                <button onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isCamOn ? 'bg-white/15 hover:bg-white/25 backdrop-blur-sm' : 'bg-white/10 hover:bg-white/20'
                  }`} title={isCamOn ? 'Camera off' : 'Camera on'}>
                  {isCamOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-gray-400" />}
                </button>
                <button onClick={endCall}
                  className="w-16 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
                  title="End call">
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Mirrors an offscreen <video> into a visible <canvas> (flipped for selfie) ──
function CameraMirror({ sourceRef }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = sourceRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')

    const draw = () => {
      if (video.videoWidth > 0 && video.readyState >= 2) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        ctx.restore()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [sourceRef])

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />
}
