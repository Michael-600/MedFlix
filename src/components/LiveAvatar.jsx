import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { samplePatient } from '../data/patientData'

const STATE = { IDLE: 'idle', CONNECTING: 'connecting', CONNECTED: 'connected', ERROR: 'error' }

/**
 * Build a concise patient context string that will be prepended to every
 * user message forwarded to the LiveAvatar LLM, so the doctor avatar
 * always knows who it's talking to and what medications they're on.
 */
function buildPatientContextPrompt(pt) {
  if (!pt) return ''
  const meds = (pt.medications || [])
    .map((m) => `${m.name} ${m.dose} ${m.frequency} (${m.purpose})`)
    .join('; ')
  const conditions = (pt.conditions || []).join(', ')
  const doctorName = pt.careTeam?.[0]?.name || 'their doctor'
  const goals = (pt.goals || []).slice(0, 3).join('; ')

  return [
    `[PATIENT CONTEXT — You are a friendly health education assistant helping ${pt.name} understand their care plan.`,
    `Their doctor is ${doctorName}.`,
    `Patient: ${pt.name}, ${pt.age}yo ${pt.sex}.`,
    `Diagnosis: ${pt.diagnosis}.`,
    conditions ? `Comorbidities: ${conditions}.` : null,
    meds ? `Doctor-prescribed medications: ${meds}.` : null,
    pt.allergies?.length ? `Allergies: ${pt.allergies.join(', ')}.` : null,
    goals ? `Health goals set by their doctor: ${goals}.` : null,
    `You are NOT the doctor. NEVER say "I prescribed" or "I diagnosed". Always refer to "${doctorName}" or "your doctor" when discussing prescriptions and diagnoses. Help the patient understand what their doctor has recommended. Be warm, specific, and personalized.]`,
  ].filter(Boolean).join(' ')
}

export default function LiveAvatar({ patient }) {
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
  // Track texts we've already forwarded to LLM to prevent infinite loops
  const forwardedTextsRef = useRef(new Set())
  // Whether we've sent the initial context to the avatar LLM
  const contextSentRef = useRef(false)

  // Build patient context prompt once (memoized)
  const patientContextPrompt = useMemo(
    () => buildPatientContextPrompt(patient || samplePatient),
    [patient]
  )

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
    forwardedTextsRef.current.clear()

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

      // Send initial patient context to the LLM so the avatar knows who it's talking to
      contextSentRef.current = false
      setTimeout(() => {
        if (!contextSentRef.current) {
          contextSentRef.current = true
          const pt = patient || samplePatient
          const doctorName = pt.careTeam?.[0]?.name || 'your doctor'
          const introPrompt = `${patientContextPrompt}\n\nGreet ${pt.name} warmly by name. Introduce yourself as their health education guide. Tell them you're here to help them understand what ${doctorName} has planned for their care. Ask how they're doing today. Keep it under 3 sentences.`
          sendCommand('avatar.speak_response', { text: introPrompt })
          console.log('[LiveAvatar] → Sent initial patient context to LLM')
        }
      }, 2000)

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
          // GUARD: If the text contains our injected context marker, it's an
          // echo from the API reflecting our own avatar.speak_response command
          // back as a user.transcription.  Never forward these — they cause
          // an infinite loop where each echo gets re-wrapped and re-sent.
          if (text.includes('[PATIENT CONTEXT') || text.includes('Patient says:')) {
            console.log(`[LiveAvatar] Skip echo (contains context marker)`)
            break
          }

          showCaption(text, 'user')

          // Only forward each unique text ONCE to prevent infinite loops
          if (!forwardedTextsRef.current.has(text)) {
            forwardedTextsRef.current.add(text)
            // Clear after 10s so the same phrase can be said again later
            setTimeout(() => forwardedTextsRef.current.delete(text), 10000)
            // Prepend patient context so the LLM knows who it's talking to
            const contextualText = `${patientContextPrompt}\n\nPatient says: "${text}"`
            console.log(`[LiveAvatar] → Forwarding to LLM: "${text}"`)
            sendCommand('avatar.speak_response', { text: contextualText })
          } else {
            console.log(`[LiveAvatar] Skip duplicate forward: "${text}"`)
          }
        }
        break
      case 'avatar.transcription':  if (text) showCaption(text, 'avatar'); break
      case 'session.stopped':       setCallState(STATE.IDLE); cleanupAll(); break
      default: break
    }
  }, [showCaption, sendCommand, patientContextPrompt])

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
    forwardedTextsRef.current.clear()
    contextSentRef.current = false
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
    <div className="w-full">
      <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 rounded-3xl overflow-hidden shadow-2xl border-5 border-gray-200" style={{ minHeight: '720px' }}>

        {/* ═══ ALWAYS IN DOM: Avatar video ═══ */}
        <div className={`absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-500 ${
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
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
            {/* Playful decorative shapes */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-medflix-red rounded-full opacity-15 animate-float-gentle"></div>
            <div className="absolute top-32 right-20 w-32 h-32 bg-medflix-blue opacity-15" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
            <div className="absolute bottom-20 left-20 w-28 h-28 bg-medflix-yellow rounded-lg rotate-45 opacity-15 animate-float-gentle animation-delay-1000"></div>
            <div className="absolute bottom-32 right-32 w-20 h-20 bg-medflix-purple rounded-full opacity-15 animate-float-gentle animation-delay-2000"></div>
            
            <div className="relative z-10 text-center px-8">
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="w-40 h-40 rounded-3xl bg-white border-5 border-medflix-purple flex items-center justify-center shadow-2xl">
                  <User className="w-20 h-20 text-medflix-purple" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-gray-900 rounded-full" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">Video Chat!</h2>
              <p className="text-xl text-gray-700 mb-2 font-bold">Talk with Your Health Guide</p>
              <p className="text-base text-gray-700 mb-10 font-semibold">Ask questions and learn together!</p>
              {callState === STATE.ERROR && errorMsg && (
                <div className="mb-8 px-6 py-3 bg-red-100 border-3 border-red-400 rounded-2xl max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-600 text-sm font-bold">{errorMsg}</p>
                  </div>
                </div>
              )}
              <button onClick={startCall}
                className="group inline-flex items-center gap-3 px-12 py-5 bg-medflix-purple text-gray-900 rounded-2xl font-black text-lg hover:bg-medflix-purple-dark transition-all shadow-2xl hover:scale-105 border-4 border-purple-700">
                <Phone className="w-6 h-6" />
                Start Video Chat!
              </button>
              <p className="text-base text-gray-700 mt-6 font-bold">🎤 Voice enabled • 📹 Camera optional • 🗣️ Speak naturally</p>
            </div>
          </div>
        )}

        {/* ═══ CONNECTING ═══ */}
        {callState === STATE.CONNECTING && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50">
            {/* Animated shapes */}
            <div className="absolute top-20 left-20 w-20 h-20 bg-medflix-red rounded-full opacity-20 animate-float-gentle"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-medflix-yellow rounded-full opacity-20 animate-float-gentle animation-delay-1000"></div>
            
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-3xl border-5 border-medflix-purple opacity-30" />
                <div className="absolute inset-0 rounded-3xl border-5 border-transparent border-t-medflix-purple animate-spin" />
                <div className="absolute inset-4 rounded-2xl bg-white shadow-xl flex items-center justify-center border-3 border-gray-200">
                  <Phone className="w-10 h-10 text-medflix-purple" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Connecting...</h3>
              <p className="text-lg text-gray-700 animate-pulse font-bold">{connectingStep || 'Getting ready to chat!'}</p>
            </div>
            <button onClick={endCall}
              className="absolute bottom-10 px-8 py-3 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-colors border-3 border-red-400 shadow-lg">
              Cancel
            </button>
          </div>
        )}

        {/* ═══ CONNECTED UI ═══ */}
        {callState === STATE.CONNECTED && (
          <>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b-3 border-gray-200 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-green-700" />
                  <span className="text-gray-900 text-base font-black">Health Guide</span>
                  <span className="text-gray-500 text-base">•</span>
                  <span className="text-gray-700 text-base font-bold font-mono">{formatDuration(callDuration)}</span>
                </div>
                {isAvatarSpeaking && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-xl border-2 border-medflix-purple">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-1.5 bg-medflix-purple rounded-full animate-pulse"
                          style={{ height: `${10 + Math.random() * 8}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-medflix-purple text-sm font-bold">Speaking</span>
                  </div>
                )}
              </div>
            </div>

            {/* User camera PIP — canvas mirrors the offscreen video */}
            <div className="absolute top-24 right-5 z-20">
              <div className={`relative w-40 h-32 rounded-2xl overflow-hidden shadow-2xl border-4 transition-all ${
                isUserSpeaking ? 'border-medflix-yellow scale-105' : 'border-gray-300'
              }`}>
                {isCamOn ? (
                  <CameraMirror sourceRef={userVideoRef} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-medflix-purple" strokeWidth={2.5} />
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
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-red-700">
                    <MicOff className="w-3 h-3 text-gray-900" />
                  </div>
                )}
                <p className="absolute bottom-1.5 left-2 text-gray-700 text-xs font-bold drop-shadow">You</p>
              </div>
            </div>

            {/* Live captions */}
            {caption && (
              <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center px-8 pointer-events-none">
                <div className={`max-w-3xl px-6 py-4 rounded-2xl backdrop-blur-sm text-center animate-fadeIn border-4 shadow-2xl ${
                  captionRole === 'user' ? 'bg-medflix-yellow/95 text-gray-900 border-yellow-600' : 'bg-white/95 text-gray-900 border-medflix-blue'
                }`}>
                  {captionRole === 'user' && (
                    <p className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wider">You said</p>
                  )}
                  <p className="text-base leading-relaxed font-bold">{caption}</p>
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t-4 border-gray-200 py-6 shadow-2xl">
              <div className="flex items-center justify-center gap-6">
                <button onClick={toggleMic}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl border-3 ${
                    isMicOn ? 'bg-medflix-blue hover:bg-blue-600 border-blue-700' : 'bg-red-500 hover:bg-red-600 border-red-700'
                  }`} title={isMicOn ? 'Mute' : 'Unmute'}>
                  {isMicOn ? <Mic className="w-7 h-7 text-gray-900" /> : <MicOff className="w-7 h-7 text-gray-900" />}
                </button>
                <button onClick={toggleCamera}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl border-3 ${
                    isCamOn ? 'bg-medflix-yellow hover:bg-yellow-500 border-yellow-600' : 'bg-gray-300 hover:bg-gray-400 border-gray-500'
                  }`} title={isCamOn ? 'Camera off' : 'Camera on'}>
                  {isCamOn ? <Video className="w-7 h-7 text-gray-900" /> : <VideoOff className="w-7 h-7 text-gray-600" />}
                </button>
                <button onClick={endCall}
                  className="w-20 h-16 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-2xl hover:scale-105 border-4 border-red-700"
                  title="End call">
                  <PhoneOff className="w-7 h-7 text-gray-900" />
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
