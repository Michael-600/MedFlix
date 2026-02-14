# Architectural Patterns

## Backend API Proxy

All external API calls are proxied through the Express backend to keep API keys server-side.

**Pattern:** Frontend → Vite proxy (`/api/*`) → Express (`server/index.js`) → External API

**Implementation:**
- Vite proxy config: `vite.config.js:9-13`
- HeyGen helper with auth injection: `server/index.js:15-25`
- LiveAvatar helper with auth injection: `server/index.js:27-37`

**Used by:**
- `src/components/LiveAvatar.jsx` — `/api/liveavatar/token`, `/start`, `/stop`, `/keep-alive`
- `src/components/CreateContent.jsx` — `/api/heygen/generate-video`
- `src/components/VideoPlayer.jsx` — `/api/heygen/video-status/:videoId`
- `src/components/RecoveryPlan.jsx` — `/api/heygen/video-status/:videoId`

## LiveKit Session Lifecycle (LiveAvatar)

The most complex pattern in the codebase. `src/components/LiveAvatar.jsx` manages a WebRTC session using `livekit-client` directly.

**State machine:** `IDLE → CONNECTING → CONNECTED → IDLE`

**Session startup flow:**
1. `POST /api/liveavatar/token` → get `session_token` + `session_id`
2. `POST /api/liveavatar/start` (Bearer token) → get `livekit_url` + `livekit_client_token`
3. Create `Room` instance with audio capture defaults
4. Register room event handlers (Connected, TrackSubscribed, DataReceived, etc.)
5. `room.connect(livekit_url, livekit_client_token)`
6. Attach existing remote participant tracks
7. Enable local microphone
8. Start keep-alive interval (2 min)

**Session cleanup (on unmount or end):**
1. Clear keep-alive interval
2. `POST /api/liveavatar/stop`
3. `room.disconnect()`
4. Remove orphaned audio elements from DOM

**Key refs:**
- `roomRef` — LiveKit Room instance (survives re-renders without causing them)
- `videoRef` — Video DOM element for avatar stream
- `sessionRef` — `{ id, token }` for keep-alive/stop calls
- `keepAliveRef` — Interval ID for cleanup

## Data Channel Protocol

LiveAvatar communicates through LiveKit's data channel for avatar control and transcription.

**Sending (user → avatar):**
- Topic: `agent-control`
- Payload: JSON with `{ event_type: 'avatar.speak_response', session_id, text }`
- Published via `room.localParticipant.publishData()` with `reliable: true`
- Implementation: `src/components/LiveAvatar.jsx` — `sendTextToAvatar()`

**Receiving (avatar → user):**
- Handled via `RoomEvent.DataReceived` — raw bytes decoded to JSON
- Event types: `avatar.speak_started`, `avatar.speak_ended`, `user.speak_started`, `user.speak_ended`, `user.transcription`, `avatar.transcription`, `session.stopped`
- Implementation: `src/components/LiveAvatar.jsx` — `handleServerEvent()`

**Transcription (native LiveKit):**
- `RoomEvent.TranscriptionReceived` provides segments with `{ final, text }`
- Only final segments added to conversation

## Track Attachment

LiveKit tracks (audio/video) are attached to DOM elements when subscribed.

**Pattern:**
- Video: `track.attach(videoRef.current)` — attaches to existing element
- Audio: `track.attach()` → creates new `<audio>` element → append to `document.body`
- Audio elements created per-track to avoid autoplay browser restrictions
- Detach on `TrackUnsubscribed`

## State Management

### Context API for Auth
- Single context: `src/contexts/AuthContext.jsx`
- Provider wraps app: `src/App.jsx`
- Custom hook with provider guard: `useAuth()` throws if used outside provider

### Props Drilling for Component State
Parent components own state, pass data + callbacks down as props.
- `PatientPortal` → `RecoveryPlan` (plan data + onUpdate handler)
- `RecoveryPlan` → `DayCard` (day data + completion handlers)
- `PatientPortal` → `LiveAvatar` (patientName, diagnosis)

### Refs for Non-rendering State
`useRef` for values that must persist across renders but shouldn't trigger re-renders:
- LiveKit Room instance: `src/components/LiveAvatar.jsx` — `roomRef`
- Polling intervals: `src/components/CreateContent.jsx`, `src/components/VideoPlayer.jsx`
- Session credentials: `src/components/LiveAvatar.jsx` — `sessionRef`

## localStorage Persistence

### Abstraction Layer
All access through `src/utils/storage.js` with `medflix_` namespace prefix.

### User-Keyed Data
User-specific data uses composite keys: `plan_${user.id}`, `content_created_${user.id}`
- Enables multi-user isolation in the same browser
- Pattern used in: `src/pages/PatientPortal.jsx`

## Immutable State Updates

All React state updates use spread operators to trigger re-renders:
```
const updated = { ...plan, days: [...plan.days] }
updated.days[i] = { ...updated.days[i], completed: true }
```
Used in: `src/components/RecoveryPlan.jsx`

## Progressive Unlocking

Recovery plan days have `unlocked` and `completed` boolean flags.
- Day 1 starts unlocked, rest locked
- Completing day N sets `days[N+1].unlocked = true`
- UI renders locked/active/completed states based on flags
- Implementation: `src/components/RecoveryPlan.jsx`

## Polling for Async Operations

Video generation is async — components poll for completion.

**Pattern:**
- Start operation → get `videoId`
- `setInterval` polls `/api/heygen/video-status/:videoId`
- On `status: 'completed'` → update state with `video_url`, clear interval
- Cleanup interval on unmount via `useRef` + `useEffect` return

**Used by:**
- `src/components/VideoPlayer.jsx` — 15s polling for individual video
- `src/components/CreateContent.jsx` — 10s polling for batch generation

## Protected Routes

Route protection via wrapper component checking auth state.
- Shows loading spinner while auth initializes
- Redirects to `/login` if no user
- Implementation: `src/App.jsx` — `ProtectedRoute`

## Active Speakers Detection

LiveKit provides `RoomEvent.ActiveSpeakersChanged` with array of speaking participants.
- Avatar speaking: any participant with identity !== 'client'
- User speaking: participant with identity === 'client'
- Drives UI indicators (speaking animations, bounce dots)
- Implementation: `src/components/LiveAvatar.jsx`
