# MedFlix - Patient Education Platform

## Overview

MedFlix generates personalized, episodic recovery content for patients. Patients get a 7-day recovery timeline with AI-generated videos, a real-time streaming AI avatar for Q&A, and a mock AI chatbot.

## Tech Stack

**Frontend:** React 18.3.1, React Router 6.28.0, Vite 6.0.3, Tailwind CSS 3.4.16, Lucide React, livekit-client
**Backend:** Express 4.21.2 (API proxy for HeyGen + LiveAvatar)
**State:** React Context API + localStorage (no Redux, no database)
**External APIs:** HeyGen (video generation), LiveAvatar (real-time streaming avatar), ClinicalTrials.gov

## Project Structure

```
src/
├── components/
│   ├── LiveAvatar.jsx        # Real-time streaming avatar (LiveKit + LiveAvatar API)
│   ├── RecoveryPlan.jsx      # 7-day timeline with progressive unlocking
│   ├── CreateContent.jsx     # 3-step video generation wizard
│   ├── VideoPlayer.jsx       # Video playback with clinical data overlay
│   ├── DayCard.jsx           # Individual day card with checklist
│   ├── AIAssistant.jsx       # Mock AI chatbot (keyword-matched responses)
│   └── Header.jsx            # Top navigation
├── pages/
│   ├── Landing.jsx           # Public homepage
│   ├── Login.jsx             # Name-based login (no real auth)
│   └── PatientPortal.jsx     # Main dashboard: 3 tabs (Recovery/Avatar/Assistant)
├── contexts/
│   └── AuthContext.jsx       # useAuth() hook, localStorage persistence
├── utils/
│   └── storage.js            # localStorage wrapper with "medflix_" prefix
├── api/
│   └── clinicalDataTool.js   # ClinicalTrials.gov API integration
└── data/
    └── mockData.js           # Visual styles, recovery templates, AI responses

server/
├── index.js                  # Express proxy: /api/heygen/* and /api/liveavatar/*
├── package.json
└── .env                      # HEYGEN_API_KEY, LIVEAVATAR_API_KEY
```

## Build & Run

```bash
# Frontend (terminal 1)
npm install
npm run dev                   # Vite on http://localhost:5173

# Backend (terminal 2)
cd server && npm install
npm run dev                   # Express on http://localhost:3001 (node --watch)

# Production
npm run build                 # Output: dist/
npm run preview               # Preview production build
```

Vite proxies `/api/*` requests to the backend: `vite.config.js:9-13`

## Environment Variables

**`server/.env`** (required for API features):
```
HEYGEN_API_KEY=               # HeyGen video generation API
LIVEAVATAR_API_KEY=           # LiveAvatar real-time streaming API
```

Keys from: https://app.heygen.com/ (HeyGen) and LiveAvatars > Developers (LiveAvatar)

## Key Architecture Decisions

**Backend proxy pattern:** Frontend never touches API keys. All external API calls go through `server/index.js` which adds auth headers. Frontend calls `/api/liveavatar/*` and `/api/heygen/*` via Vite proxy.

**LiveAvatar (most complex component):** `src/components/LiveAvatar.jsx` manages a full WebRTC session lifecycle using `livekit-client` directly. Session flow: create token → start session → connect LiveKit room → attach tracks → data channel messaging. See `.claude/docs/architectural_patterns.md` for details.

**No real authentication:** Login accepts any name, creates a user ID from `Date.now()`. All user data keyed by this ID in localStorage: `src/contexts/AuthContext.jsx`

**Progressive unlocking:** Recovery plan days unlock sequentially. Complete day N to unlock day N+1: `src/components/RecoveryPlan.jsx`

## API Endpoints (server/index.js)

**HeyGen - Video Generation:**
- `POST /api/heygen/generate-video` — Prompt-based video generation (`server/index.js:66-85`)
- `GET /api/heygen/video-status/:videoId` — Poll generation status (`server/index.js:107-117`)
- `GET /api/heygen/avatars`, `/voices`, `/quota` — List resources

**LiveAvatar - Real-time Streaming:**
- `POST /api/liveavatar/token` — Create session with JWT (`server/index.js:182-218`)
- `POST /api/liveavatar/start` — Start session, get LiveKit credentials (`server/index.js:221-237`)
- `POST /api/liveavatar/stop` — End session (`server/index.js:240-260`)
- `POST /api/liveavatar/keep-alive` — Prevent session timeout (`server/index.js:263-283`)
- `GET /api/liveavatar/avatars`, `/voices`, `/contexts` — List resources

**Health:** `GET /api/health` — Check API key presence

## Data Structures

**User:** `{ id, name, role, diagnosis, createdAt }` — stored as `medflix_user` in localStorage
**Recovery Plan:** `{ patientName, diagnosis, startDate, totalDays, days[] }` — stored as `medflix_plan_${userId}`
**Day:** `{ day, title, description, completed, unlocked, checklist[], videoUrl, videoId, episodeTitle }`

## Additional Documentation

- **`.claude/docs/architectural_patterns.md`** — Backend proxy, LiveKit session lifecycle, state management, data channel protocol, localStorage patterns, progressive unlocking, polling patterns
