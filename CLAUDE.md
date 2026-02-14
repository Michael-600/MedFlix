# MedFlix - Patient Education Platform

## Overview

MedFlix generates personalized, episodic recovery content for patients. Patients get a 7-day recovery timeline with AI-generated videos, a real-time streaming AI avatar for Q&A, a mock AI chatbot, and AI-powered medication reminders via SMS.

## Tech Stack

**Frontend:** React 18.3.1, React Router 6.28.0, Vite 6.0.3, Tailwind CSS 3.4.16, Lucide React, livekit-client
**Backend:** Express 4.21.2 (API proxy for HeyGen, LiveAvatar, Twilio, and context APIs)
**State:** React Context API + localStorage (no Redux, no database)
**External APIs:** HeyGen (video generation), LiveAvatar (real-time streaming avatar), ClinicalTrials.gov (clinical evidence), Perplexity Sonar (web-search AI research), Twilio (SMS delivery), Poke (MCP agent for patient Q&A)

## Project Structure

```
src/
├── components/
│   ├── LiveAvatar.jsx            # Real-time streaming avatar (LiveKit + LiveAvatar API)
│   ├── RecoveryPlan.jsx          # 7-day timeline with progressive unlocking
│   ├── CreateContent.jsx         # 3-step video generation wizard
│   ├── VideoPlayer.jsx           # Video playback with clinical data overlay
│   ├── MedicationReminders.jsx   # Medication reminder UI: registration, schedule CRUD, test send
│   ├── DayCard.jsx               # Individual day card with checklist
│   ├── AIAssistant.jsx           # Mock AI chatbot (keyword-matched responses)
│   └── Header.jsx                # Top navigation
├── pages/
│   ├── Landing.jsx               # Public homepage
│   ├── Login.jsx                 # Name-based login (no real auth)
│   └── PatientPortal.jsx         # Main dashboard: 4 tabs (Recovery/Avatar/Assistant/Reminders)
├── contexts/
│   └── AuthContext.jsx           # useAuth() hook, localStorage persistence
├── utils/
│   └── storage.js                # localStorage wrapper with "medflix_" prefix
├── api/
│   └── clinicalDataTool.js       # ClinicalTrials.gov API integration (frontend)
└── data/
    └── mockData.js               # Visual styles, recovery templates, AI responses, default medications

server/
├── index.js                      # Express API: HeyGen, LiveAvatar, clinical, Perplexity, reminders
├── perplexitySonar.js            # Perplexity Sonar chat API wrapper
├── heygenPrompt.js               # Prompt builders for HeyGen + Perplexity research
├── clinicalSearch.js             # ClinicalTrials.gov search (server-side, used by MCP + reminders)
├── pokeMcp.js                    # MCP server: exposes tools for Poke agent (patient Q&A)
├── package.json
└── .env                          # API keys (see Environment Variables)
```

## Build & Run

```bash
# Frontend (terminal 1)
npm install
npm run dev                   # Vite on http://localhost:5173

# Backend (terminal 2)
cd server && npm install
npm run dev                   # Express on http://localhost:3001 (node --watch)

# MCP server for Poke agent (optional, terminal 3)
cd server && npm run mcp      # Stdio MCP server

# Connect MCP to Poke (optional)
npx poke tunnel http://localhost:3001/mcp --name "MedFlix"
```

Vite proxies `/api/*` requests to the backend: `vite.config.js:9-13`

## Environment Variables

**`server/.env`** (required for API features):
```
HEYGEN_API_KEY=               # HeyGen video generation API
LIVEAVATAR_API_KEY=           # LiveAvatar real-time streaming API
PERPLEXITY_API_KEY=           # Perplexity Sonar web-search AI (also accepts PPLX_API_KEY)
POKE_API_KEY=                 # Poke SDK for MCP agent (optional, for patient Q&A via messaging)
TWILIO_ACCOUNT_SID=           # Twilio SMS delivery
TWILIO_AUTH_TOKEN=            # Twilio SMS delivery
TWILIO_PHONE_NUMBER=          # Twilio phone number in E.164 format (e.g. +14472841792)
PORT=3001
```

**Notes:**
- Twilio trial accounts prepend "Sent from your Twilio trial account" to every SMS and can only send to the account owner's verified number.
- Twilio US numbers require A2P 10DLC registration to send to other numbers. For hackathon demos, send to your own number.
- Poke API key from: `npx poke login` or https://poke.com/kitchen/api-keys

## Key Architecture Decisions

**Backend proxy pattern:** Frontend never touches API keys. All external API calls go through `server/index.js` which adds auth headers.

**Medication reminder pipeline (most complex new feature):**
1. Patient registers phone → Twilio sends welcome SMS
2. Medications auto-populate from `defaultMedications[diagnosis]` in `mockData.js`
3. On reminder (60s interval) or "Send Test Reminder":
   - `getPatientContext()` fetches ClinicalTrials.gov evidence + Perplexity Sonar research (cached 30min)
   - `craftReminder()` asks Perplexity Sonar to write a personalized SMS using the medical context
   - `sendSms()` delivers via Twilio
4. Falls back to a template message if Perplexity is unavailable

**Poke MCP server (`pokeMcp.js`):** Standalone MCP server that Poke's AI agent can call when patients text it. Exposes 6 tools: `get_patient_context`, `get_medication_schedule`, `search_clinical_evidence`, `research_medical_topic`, `log_medication_taken`, `send_reminder`. All tools make HTTP requests to the running Express server.

**Clinical + Perplexity context endpoints:** Shared by both the reminder system and the MCP server:
- `POST /api/clinical/search` — searches ClinicalTrials.gov (server-side port of `clinicalDataTool.js`)
- `POST /api/perplexity/research` — runs Perplexity Sonar research with OpenEvidence context

**LiveAvatar:** `src/components/LiveAvatar.jsx` manages a full WebRTC session lifecycle using `livekit-client`. Session flow: create token → start session → connect LiveKit room → attach tracks → data channel messaging.

**No real authentication:** Login accepts any name, creates a user ID from `Date.now()`. All user data keyed by this ID in localStorage.

**Progressive unlocking:** Recovery plan days unlock sequentially. Complete day N to unlock day N+1.

## API Endpoints (server/index.js)

**HeyGen - Video Generation:**
- `POST /api/heygen/generate-video` — Prompt-based video generation (includes Perplexity Sonar research)
- `POST /api/heygen/generate-avatar-video` — Structured V2 avatar video generation
- `GET /api/heygen/video-status/:videoId` — Poll generation status
- `GET /api/heygen/avatars`, `/voices`, `/quota` — List resources

**LiveAvatar - Real-time Streaming:**
- `POST /api/liveavatar/token` — Create session with JWT
- `POST /api/liveavatar/start` — Start session, get LiveKit credentials
- `POST /api/liveavatar/stop` — End session
- `POST /api/liveavatar/keep-alive` — Prevent session timeout
- `POST /api/liveavatar/stop-all` — Stop all active sessions (cleanup)
- `GET /api/liveavatar/avatars`, `/voices`, `/contexts` — List resources
- `GET /api/liveavatar/transcript/:sessionId` — Get session transcript

**Clinical + Perplexity - Shared Context:**
- `POST /api/clinical/search` — Search ClinicalTrials.gov for clinical evidence
- `POST /api/perplexity/research` — Run Perplexity Sonar research query (cached 10min)

**Medication Reminders - Poke + Twilio:**
- `POST /api/poke/register` — Register patient for SMS reminders (sends welcome message)
- `POST /api/poke/medications` — Set/update medication schedule
- `POST /api/poke/send-reminder` — Manually trigger a reminder (crafted by Perplexity, sent by Twilio)
- `GET /api/poke/status/:patientId` — Get registration & medication status
- `DELETE /api/poke/unregister/:patientId` — Remove patient from reminders

**Health:** `GET /api/health` — Check API key presence (heygen, liveavatar, perplexity, poke, twilio)

## Data Structures

**User:** `{ id, name, role, diagnosis, createdAt }` — stored as `medflix_user` in localStorage
**Recovery Plan:** `{ patientName, diagnosis, startDate, totalDays, days[] }` — stored as `medflix_plan_${userId}`
**Day:** `{ day, title, description, completed, unlocked, checklist[], videoUrl, videoId, episodeTitle }`
**Medications:** `[{ id, name, dosage, frequency, times[], instructions, active }]` — stored as `medflix_medications_${userId}`
**Poke Registration:** `{ registered, patientId, phoneNumber }` — stored as `medflix_poke_registered_${userId}`
**Backend medicationStore (in-memory Map):** `patientId → { name, phoneNumber, diagnosis, patientId, userId, medications[] }`

## Default Medications (mockData.js)

Auto-populated per diagnosis on first visit to the Medication Reminders tab:
- Type 2 Diabetes: Metformin 500mg, Glipizide 5mg
- Breast Cancer - Stage II: Tamoxifen 20mg, Ondansetron 8mg
- Knee Replacement Recovery: Acetaminophen 500mg, Enoxaparin 40mg
- Cardiac Bypass Recovery: Aspirin 81mg, Metoprolol 25mg, Atorvastatin 40mg
- Chronic Back Pain Management: Ibuprofen 400mg, Cyclobenzaprine 10mg
- Post-Stroke Rehabilitation: Clopidogrel 75mg, Lisinopril 10mg, Atorvastatin 80mg

## Additional Documentation

- **`.claude/docs/architectural_patterns.md`** — Backend proxy, LiveKit session lifecycle, state management, data channel protocol, localStorage patterns, progressive unlocking, polling patterns
