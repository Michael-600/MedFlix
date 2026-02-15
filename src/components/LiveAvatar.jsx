import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Mic, MicOff, PhoneOff, Phone, AlertCircle,
  Video, VideoOff, User, ChevronDown, Sparkles, Globe,
} from 'lucide-react'
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client'
import { samplePatient } from '../data/patientData'

const STATE = { IDLE: 'idle', CONNECTING: 'connecting', CONNECTED: 'connected', ERROR: 'error' }

// ── Curated avatar presets (kid-friendly, with real API IDs) ──
const AVATAR_PRESETS = [
  {
    id: 'fc9c1f9f-bc99-4fd9-a6b2-8b4b5669a046',
    name: 'Ann',
    subtitle: 'Doctor (Sitting)',
    tag: 'Default',
    preview_url: 'https://files2.heygen.ai/avatar/v3/26de369b2d4443e586dedf27abb1ce38_45570/preview_talk_4.webp',
    default_voice: { id: 'de5574fc-009e-4a01-a881-9919ef8f5a0c', name: 'Ann - IA' },
  },
  {
    id: '567e8371-f69f-49ec-9f2d-054083431165',
    name: 'Ann',
    subtitle: 'Doctor (Standing)',
    tag: null,
    preview_url: 'https://files2.heygen.ai/avatar/v3/699a4c2995914d39b2cb311a930d7720_45570/preview_talk_3.webp',
    default_voice: { id: 'de5574fc-009e-4a01-a881-9919ef8f5a0c', name: 'Ann - IA' },
  },
  {
    id: '513fd1b7-7ef9-466d-9af2-344e51eeb833',
    name: 'Ann',
    subtitle: 'Therapist',
    tag: null,
    preview_url: 'https://files2.heygen.ai/avatar/v3/75e0a87b7fd94f0981ff398b593dd47f_45570/preview_talk_4.webp',
    default_voice: { id: 'de5574fc-009e-4a01-a881-9919ef8f5a0c', name: 'Ann - IA' },
  },
  {
    id: null,
    name: 'Dexter',
    subtitle: 'Doctor (Sitting)',
    tag: null,
    preview_url: 'https://files2.heygen.ai/avatar/v3/f83fffc45faa4368b6db9597e63fb4e9_46860/preview_talk_4.webp',
    default_voice: null,
    _lookupName: 'Dexter Doctor Sitting',
  },
  {
    id: null,
    name: 'Judy',
    subtitle: 'Doctor (Standing)',
    tag: null,
    preview_url: 'https://files2.heygen.ai/avatar/v3/13bc0ed39627493da8404a4be9e3be2c_64386/preview_talk_4.webp',
    default_voice: null,
    _lookupName: 'Judy Doctor Standing',
  },
  {
    id: null,
    name: 'Santa',
    subtitle: 'Health Buddy',
    tag: 'Kids Fav',
    preview_url: null,
    default_voice: null,
    _lookupName: 'Santa',
  },
]

const QUALITY_OPTIONS = [
  { value: 'high', label: 'High (720p)' },
  { value: 'medium', label: 'Medium (480p)' },
  { value: 'low', label: 'Low (360p)' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
]

/**
 * Build a concise patient context string that will be prepended to every
 * user message forwarded to the LiveAvatar LLM, so the doctor avatar
 * always knows who it's talking to and what medications they're on.
 */
function buildPatientContextPrompt(pt) {
  if (!pt) return ''
  const firstName = (pt.name || 'friend').split(' ')[0]
  const meds = (pt.medications || [])
    .map((m) => `${m.name} (${m.purpose})`)
    .join('; ')
  const doctorName = pt.careTeam?.[0]?.name || 'their doctor'
  const goals = (pt.goals || []).slice(0, 3).join('; ')

  return [
    `[PATIENT CONTEXT — You are a friendly, warm Health Buddy talking to a CHILD named ${firstName}, age ${pt.age}.`,
    `IMPORTANT: Use very simple words that a ${pt.age}-year-old can understand. Short sentences. Be fun, encouraging, and gentle.`,
    `IMPORTANT: Always call the child "${firstName}" — NEVER use their last name.`,
    `Their doctor is ${doctorName}.`,
    `Patient: ${firstName}, age ${pt.age}, ${pt.sex}.`,
    `Diagnosis: ${pt.diagnosis}.`,
    meds ? `Medicines the doctor gave them: ${meds}.` : null,
    pt.allergies?.length ? `Allergies: ${pt.allergies.join(', ')}.` : null,
    goals ? `Goals: ${goals}.` : null,
    `You are NOT the doctor. NEVER say "I prescribed." Always say "${doctorName}" or "your doctor." Use words like "awesome," "super," "you're so brave!" Be warm, fun, and encouraging. Avoid scary medical terms. If the child seems confused, simplify even more.]`,
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
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

  // ── Avatar selection state ───────────────────────────
  const [avatars, setAvatars] = useState(AVATAR_PRESETS)
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_PRESETS.find(a => a.id)?.id || null)
  const [selectedQuality, setSelectedQuality] = useState('high')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showAllAvatars, setShowAllAvatars] = useState(false)
  const [loadingAvatars, setLoadingAvatars] = useState(false)

  // Fetch real avatar list from API to resolve placeholder IDs and get more avatars
  useEffect(() => {
    let cancelled = false
    const fetchAvatars = async () => {
      setLoadingAvatars(true)
      try {
        const res = await fetch('/api/liveavatar/avatars')
        const data = await res.json()
        const apiAvatars = data?.data?.results || data?.data || []
        // Log avatar names with "santa" for debugging
        const santaAvatars = apiAvatars.filter((a) => a.name?.toLowerCase().includes('santa'))
        console.log('[LiveAvatar] Santa avatars from API:', santaAvatars.map((a) => ({ id: a.id, name: a.name })))
        if (!cancelled && apiAvatars.length > 0) {
          // Resolve placeholders in presets
          const resolved = AVATAR_PRESETS.map((preset) => {
            if (preset.id) return preset
            const match = apiAvatars.find((a) =>
              a.name === preset._lookupName ||
              (preset._lookupName && a.name?.toLowerCase().includes(preset._lookupName.toLowerCase()))
            )
            if (match) {
              return {
                ...preset,
                id: match.id,
                preview_url: match.preview_url || preset.preview_url,
                default_voice: match.default_voice || preset.default_voice,
              }
            }
            return preset
          })

          // Add extra avatars from API that aren't already in presets
          const presetIds = new Set(resolved.map((p) => p.id).filter(Boolean))
          const extras = apiAvatars
            .filter((a) => !presetIds.has(a.id) && a.status === 'ACTIVE')
            .map((a) => ({
              id: a.id,
              name: a.name?.split(' ')[0] || 'Avatar',
              subtitle: a.name?.replace(/^\w+\s*/, '') || '',
              tag: null,
              preview_url: a.preview_url || '',
              default_voice: a.default_voice || null,
            }))

          setAvatars([...resolved, ...extras])
        }
      } catch {
        // Keep presets as-is
      }
      if (!cancelled) setLoadingAvatars(false)
    }
    fetchAvatars()
    return () => { cancelled = true }
  }, [])

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId) || avatars[0]
  const displayedAvatars = showAllAvatars ? avatars : avatars.slice(0, 6)

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
  // Accumulate streaming transcription chunks for real-time caption display
  const avatarChunkRef = useRef('')
  const userChunkRef = useRef('')
  const chunkTimerRef = useRef(null)
  // Track when we forwarded a message to show "thinking" state
  const thinkingTimerRef = useRef(null)

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

      // 1. Token — pass selected avatar, voice, quality, language
      setConnectingStep('Setting up session...')
      const tokenPayload = {
        is_sandbox: false,
        avatar_id: selectedAvatar?.id || undefined,
        voice_id: selectedAvatar?.default_voice?.id || undefined,
        language: selectedLanguage,
        quality: selectedQuality,
      }
      console.log('[LiveAvatar] Token payload:', tokenPayload)
      const tokenRes = await fetch('/api/liveavatar/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload),
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
          const childFirstName = (pt.name || 'friend').split(' ')[0]
          const introPrompt = `${patientContextPrompt}\n\nGreet ${childFirstName} warmly by FIRST NAME ONLY (just "${childFirstName}", never their last name). Introduce yourself as their friendly Health Buddy. Tell them you're here to help them learn about staying healthy — in a super fun way! Ask how they're feeling today. Use simple words. Be cheerful and encouraging. Keep it under 3 short sentences.`
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
  // Streams transcription chunks in real-time for seamless captions,
  // and forwards final user transcriptions to the LLM.
  const handleServerEvent = useCallback((event) => {
    const { event_type, text } = event
    switch (event_type) {
      case 'avatar.speak_started':
        setIsAvatarSpeaking(true)
        setIsThinking(false)
        if (thinkingTimerRef.current) { clearTimeout(thinkingTimerRef.current); thinkingTimerRef.current = null }
        break
      case 'avatar.speak_ended':
        setIsAvatarSpeaking(false)
        avatarChunkRef.current = ''
        setIsListening(true)
        break
      case 'user.speak_started':
        setIsUserSpeaking(true)
        setIsListening(true)
        userChunkRef.current = ''
        break
      case 'user.speak_ended':
        setIsUserSpeaking(false)
        break

      // Real-time streaming: show chunks as they arrive
      case 'avatar.transcription.chunk':
        if (text) {
          avatarChunkRef.current += text
          // Show the growing caption in real-time
          setCaption(avatarChunkRef.current.trim())
          setCaptionRole('avatar')
          // Keep resetting the fade timer so it doesn't disappear mid-sentence
          if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
          captionTimerRef.current = setTimeout(() => { setCaption(''); setCaptionRole(null) }, 10000)
        }
        break

      case 'user.transcription.chunk':
        if (text) {
          userChunkRef.current += text
          setCaption(userChunkRef.current.trim())
          setCaptionRole('user')
          if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
          captionTimerRef.current = setTimeout(() => { setCaption(''); setCaptionRole(null) }, 10000)
        }
        break

      case 'user.transcription':
        if (text) {
          // GUARD: If the text contains our injected context marker, it's an echo
          if (text.includes('[PATIENT CONTEXT') || text.includes('Patient says:')) {
            console.log(`[LiveAvatar] Skip echo (contains context marker)`)
            break
          }

          // Show final transcription (replaces any streaming chunks)
          userChunkRef.current = ''
          showCaption(text, 'user')
          setIsListening(false)

          // Only forward each unique text ONCE to prevent infinite loops
          if (!forwardedTextsRef.current.has(text)) {
            forwardedTextsRef.current.add(text)
            setTimeout(() => forwardedTextsRef.current.delete(text), 10000)
            const contextualText = `${patientContextPrompt}\n\nPatient says: "${text}"`
            console.log(`[LiveAvatar] → Forwarding to LLM: "${text}"`)
            sendCommand('avatar.speak_response', { text: contextualText })
            // Show "thinking" state while LLM processes
            setIsThinking(true)
            thinkingTimerRef.current = setTimeout(() => setIsThinking(false), 15000) // safety timeout
          } else {
            console.log(`[LiveAvatar] Skip duplicate forward: "${text}"`)
          }
        }
        break

      case 'avatar.transcription':
        if (text) {
          // Final avatar transcription — show full text, reset chunk buffer
          avatarChunkRef.current = ''
          showCaption(text, 'avatar')
        }
        break

      case 'session.stopped':
        setCallState(STATE.IDLE)
        cleanupAll()
        break
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
    setIsListening(false)
    setIsThinking(false)
    seenTextsRef.current.clear()
    attachedTrackSids.current.clear()
    forwardedTextsRef.current.clear()
    contextSentRef.current = false
    avatarChunkRef.current = ''
    userChunkRef.current = ''
    if (chunkTimerRef.current) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null }
    if (thinkingTimerRef.current) { clearTimeout(thinkingTimerRef.current); thinkingTimerRef.current = null }
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
          <div className="absolute inset-0 z-30 flex flex-col bg-gradient-to-br from-gray-900 via-medflix-darker to-gray-900 overflow-y-auto">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-20 left-20 w-64 h-64 bg-medflix-accent rounded-full blur-[100px]" />
              <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-8">
              {/* Header */}
              <h2 className="text-2xl font-bold text-white mb-1">MedFlix Health Guide</h2>
              <p className="text-gray-400 text-sm mb-6">Choose your AI guide and start a voice call</p>

              {/* Avatar Grid */}
              <div className="w-full max-w-lg mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Choose Your Guide</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {displayedAvatars.map((avatar) => {
                    if (!avatar.id) return null
                    const isSelected = selectedAvatarId === avatar.id
                    return (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={`relative group rounded-xl border-2 overflow-hidden transition-all ${
                          isSelected
                            ? 'border-medflix-accent ring-2 ring-medflix-accent/30 scale-[1.02]'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="aspect-[3/4] bg-gray-800 relative">
                          {avatar.preview_url ? (
                            <img
                              src={avatar.preview_url}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-10 h-10 text-gray-600" />
                            </div>
                          )}
                          {/* Selected overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-medflix-accent/10 border-2 border-medflix-accent rounded-lg" />
                          )}
                          {/* Tag badge */}
                          {avatar.tag && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-medflix-accent text-white text-[9px] font-bold rounded-md uppercase">
                              {avatar.tag}
                            </span>
                          )}
                        </div>
                        <div className="p-2 bg-gray-800/80">
                          <p className="text-white text-xs font-semibold truncate">{avatar.name}</p>
                          <p className="text-gray-500 text-[10px] truncate">{avatar.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Show more / less */}
                {avatars.length > 6 && (
                  <button
                    onClick={() => setShowAllAvatars(!showAllAvatars)}
                    className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllAvatars ? 'rotate-180' : ''}`} />
                    {showAllAvatars ? 'Show less' : `Show all ${avatars.filter(a => a.id).length} avatars`}
                  </button>
                )}
              </div>

              {/* Settings Row */}
              <div className="w-full max-w-lg flex gap-3 mb-6">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                    <Sparkles className="w-3 h-3 inline mr-1" />Video Quality
                  </label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:border-medflix-accent outline-none cursor-pointer"
                  >
                    {QUALITY_OPTIONS.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                    <Globe className="w-3 h-3 inline mr-1" />Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:border-medflix-accent outline-none cursor-pointer"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Voice info */}
              {selectedAvatar?.default_voice && (
                <p className="text-gray-500 text-xs mb-4">
                  Voice: <span className="text-gray-400">{selectedAvatar.default_voice.name}</span>
                </p>
              )}

              {/* Error message */}
              {callState === STATE.ERROR && errorMsg && (
                <div className="mb-4 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl max-w-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Start Call Button */}
              <button onClick={startCall}
                className="group inline-flex items-center gap-3 px-10 py-4 bg-green-500 text-white rounded-full font-semibold text-lg hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-green-500/30">
                <Phone className="w-6 h-6 group-hover:animate-pulse" />
                Start Call
              </button>
              <p className="text-gray-600 text-xs mt-4">Voice call with AI &bull; Speak naturally &bull; Camera optional</p>
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
              <h3 className="text-xl font-semibold text-white mb-2">Connecting to Health Guide...</h3>
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
                  <span className="text-white/90 text-sm font-medium">{selectedAvatar?.name || 'Health Guide'} &mdash; {selectedAvatar?.subtitle || 'MedFlix'}</span>
                  <span className="text-white/40 text-sm">&bull;</span>
                  <span className="text-white/60 text-sm font-mono">{formatDuration(callDuration)}</span>
                </div>
                {/* Status indicator: Speaking / Thinking / Listening */}
                {isAvatarSpeaking ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-medflix-accent/20 rounded-full">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-1 bg-medflix-accent rounded-full animate-pulse"
                          style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-medflix-accent text-xs font-medium">Speaking</span>
                  </div>
                ) : isThinking ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                    <span className="text-yellow-400 text-xs font-medium">Thinking...</span>
                  </div>
                ) : isListening || isUserSpeaking ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Listening</span>
                  </div>
                ) : null}
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
