import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic, MicOff, Send, Sparkles,
  User, PhoneOff, Phone, Loader2, AlertCircle,
} from 'lucide-react'
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client'

const SESSION_STATE = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
}

export default function LiveAvatar({ patientName, diagnosis }) {
  const [sessionState, setSessionState] = useState(SESSION_STATE.IDLE)
  const [sessionId, setSessionId] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [debugLog, setDebugLog] = useState([])

  const roomRef = useRef(null)
  const videoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const keepAliveRef = useRef(null)
  const sessionRef = useRef({ id: null, token: null })

  const addDebug = (msg) => {
    console.log('[LiveAvatar]', msg)
    setDebugLog((prev) => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  // ── Attach tracks helper ────────────────────────────
  const attachTrack = (track, participant) => {
    addDebug(`Track subscribed: ${track.kind} from ${participant?.identity || 'unknown'}`)

    if (track.kind === Track.Kind.Video) {
      const el = videoRef.current
      if (el) {
        track.attach(el)
        addDebug('Video track attached to element')
      }
    }

    if (track.kind === Track.Kind.Audio) {
      // Create a new audio element each time to avoid autoplay issues
      const audioEl = track.attach()
      audioEl.autoplay = true
      audioEl.volume = 1.0
      document.body.appendChild(audioEl)
      addDebug('Audio track attached and appended to body')
    }
  }

  // ── Start a LiveAvatar Session ──────────────────────
  const startSession = async () => {
    setSessionState(SESSION_STATE.CONNECTING)
    setErrorMsg('')
    setConversation([])
    setDebugLog([])
    addDebug('Starting session...')

    try {
      // 1. Create session token
      addDebug('Creating session token...')
      const tokenRes = await fetch('/api/liveavatar/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sandbox: false }),
      })
      const tokenData = await tokenRes.json()
      addDebug(`Token response code: ${tokenData.code}`)

      if (!tokenData.data?.session_token) {
        throw new Error(tokenData.message || 'Failed to create session token')
      }

      const token = tokenData.data.session_token
      const sid = tokenData.data.session_id
      setSessionToken(token)
      setSessionId(sid)
      sessionRef.current = { id: sid, token }

      // 2. Start session
      addDebug('Starting session with token...')
      const startRes = await fetch('/api/liveavatar/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      })
      const startData = await startRes.json()
      addDebug(`Start response code: ${startData.code}`)

      if (!startData.data?.livekit_url) {
        throw new Error(startData.message || 'Failed to start session')
      }

      const { livekit_url, livekit_client_token } = startData.data
      addDebug(`LiveKit URL: ${livekit_url}`)

      // 3. Connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      roomRef.current = room

      // ── Room event handlers ──

      room.on(RoomEvent.Connected, () => {
        addDebug('Room connected!')
      })

      room.on(RoomEvent.Disconnected, (reason) => {
        addDebug(`Room disconnected: ${reason}`)
        setSessionState(SESSION_STATE.IDLE)
        cleanupRoom()
      })

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        addDebug(`Participant joined: ${participant.identity}`)
      })

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        addDebug(`Participant left: ${participant.identity}`)
      })

      // Handle remote tracks (avatar video + audio)
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        attachTrack(track, participant)
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        addDebug(`Track unsubscribed: ${track.kind}`)
      })

      // Handle data messages from LiveAvatar
      room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        try {
          const text = new TextDecoder().decode(payload)
          const event = JSON.parse(text)
          addDebug(`Data event [${topic || 'no-topic'}]: ${event.event_type}`)
          handleServerEvent(event)
        } catch (e) {
          // Non-JSON data
        }
      })

      // Handle transcription events (LiveKit 2.x native transcription support)
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        addDebug(`Transcription from ${participant?.identity || 'unknown'}: ${segments?.length} segments`)
        if (segments && segments.length > 0) {
          for (const segment of segments) {
            if (segment.final && segment.text) {
              const isAvatar = participant?.identity !== 'client'
              addDebug(`Transcript [${isAvatar ? 'avatar' : 'user'}]: ${segment.text}`)
              setConversation((prev) => [...prev, {
                role: isAvatar ? 'avatar' : 'user',
                content: segment.text,
                timestamp: new Date(),
              }])
            }
          }
        }
      })

      // Active speakers change
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const avatarSpeaking = speakers.some((s) => s.identity !== 'client')
        const userSpeaking = speakers.some((s) => s.identity === 'client')
        setIsAvatarSpeaking(avatarSpeaking)
        setIsUserSpeaking(userSpeaking)
      })

      // Connect to the room
      addDebug('Connecting to LiveKit room...')
      await room.connect(livekit_url, livekit_client_token)
      addDebug(`Room state: ${room.state}`)

      // Check for any existing remote tracks
      room.remoteParticipants.forEach((participant) => {
        addDebug(`Existing participant: ${participant.identity}`)
        participant.trackPublications.forEach((pub) => {
          if (pub.track && pub.isSubscribed) {
            attachTrack(pub.track, participant)
          }
        })
      })

      // Enable local microphone
      addDebug('Enabling microphone...')
      await room.localParticipant.setMicrophoneEnabled(true)
      addDebug('Microphone enabled')

      setSessionState(SESSION_STATE.CONNECTED)

      // Add greeting
      setConversation([{
        role: 'system',
        content: 'Session connected! You can speak directly to the avatar or type a message below.',
        timestamp: new Date(),
      }])

      // Keep-alive interval (every 2 minutes)
      keepAliveRef.current = setInterval(async () => {
        try {
          await fetch('/api/liveavatar/keep-alive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionRef.current.id,
              session_token: sessionRef.current.token,
            }),
          })
        } catch (e) {
          // Silent
        }
      }, 2 * 60 * 1000)

    } catch (e) {
      console.error('Session start failed:', e)
      addDebug(`ERROR: ${e.message}`)
      setErrorMsg(e.message || 'Failed to connect')
      setSessionState(SESSION_STATE.ERROR)
    }
  }

  // ── Handle server events from LiveAvatar data channel ─
  const handleServerEvent = useCallback((event) => {
    const { event_type, text } = event

    switch (event_type) {
      case 'avatar.speak_started':
        setIsAvatarSpeaking(true)
        break
      case 'avatar.speak_ended':
        setIsAvatarSpeaking(false)
        break
      case 'user.speak_started':
        setIsUserSpeaking(true)
        break
      case 'user.speak_ended':
        setIsUserSpeaking(false)
        break
      case 'user.transcription':
        if (text) {
          setConversation((prev) => [...prev, {
            role: 'user',
            content: text,
            timestamp: new Date(),
          }])
        }
        break
      case 'avatar.transcription':
        if (text) {
          setConversation((prev) => [...prev, {
            role: 'avatar',
            content: text,
            timestamp: new Date(),
          }])
        }
        break
      case 'session.stopped':
        setSessionState(SESSION_STATE.IDLE)
        cleanupRoom()
        break
      default:
        break
    }
  }, [])

  // ── Send text command to avatar ─────────────────────
  const sendTextToAvatar = (text) => {
    const room = roomRef.current
    if (!room || room.state !== ConnectionState.Connected) {
      addDebug('Cannot send: room not connected')
      return
    }

    const event = {
      event_type: 'avatar.speak_response',
      session_id: sessionId,
      text,
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(event))

    try {
      room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'agent-control',
      })
      addDebug(`Sent speak_response: "${text.slice(0, 50)}..."`)
    } catch (e) {
      addDebug(`Failed to publish data: ${e.message}`)
    }
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    setConversation((prev) => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }])

    sendTextToAvatar(message)
    setMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ── Toggle microphone ───────────────────────────────
  const toggleMic = async () => {
    const room = roomRef.current
    if (!room) return
    const newState = !isMicEnabled
    try {
      await room.localParticipant.setMicrophoneEnabled(newState)
      setIsMicEnabled(newState)
      addDebug(`Mic ${newState ? 'enabled' : 'disabled'}`)
    } catch (e) {
      addDebug(`Mic toggle failed: ${e.message}`)
    }
  }

  // ── End session ─────────────────────────────────────
  const endSession = async () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }

    const { id, token } = sessionRef.current
    if (id || token) {
      try {
        await fetch('/api/liveavatar/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: id, session_token: token }),
        })
      } catch (e) {
        // Best effort
      }
    }

    cleanupRoom()
    setSessionState(SESSION_STATE.IDLE)
    setSessionId(null)
    setSessionToken(null)
    sessionRef.current = { id: null, token: null }
  }

  const cleanupRoom = () => {
    if (roomRef.current) {
      try {
        roomRef.current.disconnect()
      } catch (e) {
        // Already disconnected
      }
      roomRef.current = null
    }
    // Remove any attached audio elements
    document.querySelectorAll('audio[data-lk-audio]').forEach((el) => el.remove())
  }

  // ── Quick question handler ──────────────────────────
  const handleQuickQuestion = (q) => {
    if (sessionState === SESSION_STATE.CONNECTED) {
      setConversation((prev) => [...prev, {
        role: 'user',
        content: q,
        timestamp: new Date(),
      }])
      sendTextToAvatar(q)
    } else {
      setMessage(q)
    }
  }

  // ── Render ──────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-medflix-accent to-medflix-accentLight p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Live AI Health Companion</h2>
              <p className="text-white/90 text-sm">
                {sessionState === SESSION_STATE.CONNECTED
                  ? 'Connected — speak or type to interact with your AI doctor'
                  : 'Start a session to talk with your AI health companion in real time'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Avatar Video Section */}
          <div className="lg:col-span-1 bg-medflix-darker p-6 flex flex-col items-center justify-center min-h-[500px]">
            {/* Video element for avatar stream */}
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden bg-black/50 mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className={`w-full h-full object-cover ${sessionState !== SESSION_STATE.CONNECTED ? 'hidden' : ''}`}
              />

              {sessionState !== SESSION_STATE.CONNECTED && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-medflix-accent/20 to-medflix-accentLight/20 flex items-center justify-center border-4 border-medflix-accent/30 mb-4">
                    <User className="w-12 h-12 text-medflix-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">Dr. Sarah AI</h3>
                  <p className="text-gray-400 text-sm">Your Personal Health Guide</p>
                </div>
              )}

              {/* Speaking indicator */}
              {isAvatarSpeaking && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-medflix-accent rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-white text-xs font-medium">Speaking...</span>
                </div>
              )}
            </div>

            {/* Status & Controls */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                {sessionState === SESSION_STATE.CONNECTED ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Live Session Active</span>
                  </>
                ) : sessionState === SESSION_STATE.CONNECTING ? (
                  <>
                    <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                    <span className="text-yellow-400 text-xs font-medium">Connecting...</span>
                  </>
                ) : sessionState === SESSION_STATE.ERROR ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 text-xs font-medium">Connection Failed</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-xs font-medium">Ready to Connect</span>
                )}
              </div>

              {isUserSpeaking && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-medflix-accent rounded-full animate-pulse"
                        style={{ height: `${10 + Math.random() * 12}px`, animationDelay: `${i * 0.08}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">You're speaking...</span>
                </div>
              )}
            </div>

            {/* Session Controls */}
            <div className="flex gap-3">
              {sessionState === SESSION_STATE.IDLE || sessionState === SESSION_STATE.ERROR ? (
                <button
                  onClick={startSession}
                  className="flex items-center gap-2 px-6 py-3 bg-medflix-accent text-white rounded-full font-medium hover:bg-medflix-accentLight transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Start Session
                </button>
              ) : sessionState === SESSION_STATE.CONNECTING ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-gray-300 rounded-full font-medium cursor-not-allowed"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isMicEnabled
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                    title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isMicEnabled ? (
                      <Mic className="w-5 h-5 text-white" />
                    ) : (
                      <MicOff className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={endSession}
                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                    title="End session"
                  >
                    <PhoneOff className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg max-w-[280px]">
                <p className="text-red-400 text-xs text-center">{errorMsg}</p>
                <button
                  onClick={() => { setErrorMsg(''); setSessionState(SESSION_STATE.IDLE) }}
                  className="text-red-300 text-xs underline mt-1 block mx-auto"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Debug log (collapsible) */}
            {debugLog.length > 0 && (
              <details className="mt-4 w-full max-w-[280px]">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300">
                  Connection Log ({debugLog.length})
                </summary>
                <div className="mt-2 bg-black/30 rounded-lg p-2 max-h-32 overflow-y-auto">
                  {debugLog.map((log, i) => (
                    <p key={i} className="text-gray-500 text-[10px] font-mono leading-tight">{log}</p>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversation.length === 0 && sessionState !== SESSION_STATE.CONNECTED && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-8">
                  <div>
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500 mb-1">Start a live session</p>
                    <p>Click "Start Session" to connect with your AI health companion. You can speak naturally or type messages.</p>
                  </div>
                </div>
              )}
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' :
                    msg.role === 'system' ? 'justify-center' :
                    'justify-start'
                  } animate-slideUp`}
                >
                  {msg.role === 'system' ? (
                    <div className="bg-medflix-accent/10 text-medflix-accent text-xs px-4 py-2 rounded-full font-medium">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-medflix-accent text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {isAvatarSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    sessionState === SESSION_STATE.CONNECTED
                      ? 'Type your question or speak directly...'
                      : 'Start a session first to chat...'
                  }
                  disabled={sessionState !== SESSION_STATE.CONNECTED}
                  rows="2"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sessionState !== SESSION_STATE.CONNECTED}
                  className="px-6 bg-medflix-accent text-white rounded-xl hover:bg-medflix-accentLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  {sessionState === SESSION_STATE.CONNECTED
                    ? 'Speak naturally or type — press Enter to send text'
                    : 'Click "Start Session" to begin'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="border-t p-6 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'What should I do if I feel pain?',
              'Explain my medications',
              'When is my next milestone?',
              'What foods should I eat?',
              'How do I track my progress?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-medflix-accent hover:text-medflix-accent transition-colors disabled:opacity-50"
                disabled={sessionState !== SESSION_STATE.CONNECTED}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
