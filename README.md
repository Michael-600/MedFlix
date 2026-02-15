# MedFlix Prime Care

**AI-powered health education for children — transforming dense medical files into bite-sized, personalized video episodes that kids actually want to watch.**

---

## The Problem

- Children diagnosed with conditions like **asthma, ear infections, or leukemia** are scared and confused
- Medical discharge papers are written for adults — kids can't understand them
- Parents are overwhelmed and forget 40–80% of what doctors tell them
- There's no engaging, age-appropriate way for kids to learn about their own health

## The Solution

MedFlix takes a child's real medical data and turns it into a **7-episode animated health show** — personalized to their name, diagnosis, medications, and care team. Kids also get a **real-time AI Health Buddy** they can talk to, **collectible battle cards** for completing episodes, and **picture-based quizzes** to reinforce learning.

---

## System Architecture

```mermaid
graph TB
    subgraph "👨‍⚕️ Doctor Portal"
        DOC[Doctor Selects Patient]
        CREATE[Create Health Episodes]
        SEND[Send to Patient Portal]
    end

    subgraph "📋 Patient Data Layer"
        PD[(Patient Profiles<br/>Lily · Noah · Zara)]
        DIAG[Diagnosis + Medications<br/>+ Care Team + Goals]
    end

    subgraph "🔬 Clinical Data Pipeline"
        FDA[OpenFDA API<br/>Drug Labels & Safety]
        DM[DailyMed API<br/>NLM Clinical Data]
        GATHER[gatherClinicalData<br/>Parallel Fetch + Cache]
    end

    subgraph "🧠 AI Context Engine"
        PPLX[Perplexity Sonar AI<br/>LLM Context Layer]
        CTX[contextEngine.js<br/>Build Episode Context]
        SCRIPTS[episodeScripts.js<br/>7 Hardcoded Builders<br/>per Condition]
    end

    subgraph "🎬 Video Generation Pipeline"
        PROMPT[heygenPrompt.js<br/>Scene-by-Scene Directives]
        HEYGEN[HeyGen Video API<br/>Structured Avatar Video]
        POLL[Async Status Polling<br/>Background Generation]
        VIDEO[(Generated Videos<br/>Per Episode)]
    end

    subgraph "🗣️ Real-Time AI Avatar"
        LA_TOKEN[LiveAvatar Token API<br/>Session + Avatar Config]
        LA_SESSION[LiveAvatar Session<br/>FULL Interactive Mode]
        LIVEKIT[LiveKit WebRTC<br/>Audio/Video Streams]
        LLM[LiveAvatar LLM<br/>Patient Context Injected]
    end

    subgraph "💊 Medication Reminders"
        POKE[Poke SDK<br/>Model Context Protocol]
        MCP[MCP Server<br/>Tools + Resources]
        REMIND[Medication Schedules<br/>+ Reminders]
    end

    subgraph "👧 Patient Portal"
        LOGIN[Kid Login<br/>Emoji Avatar Selection]
        PLAN[Recovery Plan<br/>7-Episode Adventure]
        CARDS[Battle Card Collection<br/>Quiz + Rewards]
        LIVE[Live Health Buddy<br/>Voice Conversation]
        MEDS[Medication Reminders<br/>Daily Schedule]
        AI_CHAT[AI Assistant<br/>Text Q&A]
    end

    DOC --> PD
    PD --> DIAG
    CREATE --> DIAG

    DIAG --> GATHER
    GATHER --> FDA
    GATHER --> DM
    FDA --> CTX
    DM --> CTX
    DIAG --> CTX

    CTX --> PPLX
    PPLX --> CTX
    CTX --> SCRIPTS
    SCRIPTS --> PROMPT

    PROMPT --> HEYGEN
    HEYGEN --> POLL
    POLL --> VIDEO
    VIDEO --> PLAN

    SEND --> PLAN

    DIAG --> LLM
    LA_TOKEN --> LA_SESSION
    LA_SESSION --> LIVEKIT
    LIVEKIT --> LLM
    LLM --> LIVE

    POKE --> MCP
    MCP --> REMIND
    REMIND --> MEDS

    LOGIN --> PLAN
    PLAN --> CARDS
    LIVE --> LIVEKIT
```

---

## Data Flow — Video Generation

```mermaid
sequenceDiagram
    participant Doc as 👨‍⚕️ Doctor
    participant FE as React Frontend
    participant BE as Express Backend
    participant FDA as OpenFDA API
    participant DM as DailyMed API
    participant PPLX as Perplexity Sonar
    participant HG as HeyGen API

    Doc->>FE: Select patient + episode
    FE->>BE: POST /api/context/build
    BE->>FDA: GET drug labels (parallel)
    BE->>DM: GET clinical data (parallel)
    FDA-->>BE: Drug safety, indications, warnings
    DM-->>BE: Dosage, interactions, contraindications

    BE->>PPLX: Build context layer<br/>(clinical data + patient info)
    PPLX-->>BE: Enriched medical context

    BE->>BE: episodeScripts.js<br/>Build scenes (6-8 per episode)<br/>Script + Visual per scene

    BE-->>FE: Episode context + scenes

    FE->>BE: POST /api/heygen/video-agent
    BE->>HG: Create video (script + visuals)
    HG-->>BE: video_id (async)

    loop Poll every 5s
        FE->>BE: GET /api/heygen/status/:id
        BE->>HG: Check video status
        HG-->>BE: pending / completed + URL
    end

    HG-->>FE: Video URL ready
    FE->>FE: Display in Recovery Plan
```

---

## Data Flow — LiveAvatar Conversation

```mermaid
sequenceDiagram
    participant Kid as 👧 Child
    participant FE as React + LiveKit
    participant BE as Express Backend
    participant LA as LiveAvatar API
    participant LK as LiveKit Server
    participant LLM as Avatar LLM

    Kid->>FE: Click "Start Call"
    FE->>BE: POST /api/liveavatar/stop-all
    BE->>LA: Close stale sessions
    FE->>BE: POST /api/liveavatar/token
    BE->>LA: Create session (avatar, voice, quality, language)
    LA-->>BE: Session token + LiveKit URL
    BE-->>FE: Token + URL

    FE->>BE: POST /api/liveavatar/start
    BE->>LA: Start session
    LA-->>BE: Session active

    FE->>LK: Connect WebRTC room
    LK-->>FE: Audio/Video tracks attached

    FE->>LLM: Inject patient context prompt<br/>(name, age, diagnosis, meds, goals)
    LLM-->>FE: Initial greeting<br/>"Hi Lily! I'm your Health Buddy!"

    loop Conversation
        Kid->>FE: Speaks (microphone)
        FE->>LK: Audio stream
        LK->>LLM: user.transcription
        FE->>LLM: Forward with patient context
        LLM-->>FE: avatar.speak_response
        FE->>Kid: Avatar speaks + captions
    end
```

---

## Episode Pipeline — Per Condition

```mermaid
graph LR
    subgraph "Episode 1: Hi There!"
        E1[Welcome + Meet Health Buddy]
    end
    subgraph "Episode 2: What's Happening?"
        E2[Condition Explanation<br/>Age-Appropriate]
    end
    subgraph "Episode 3: Super Medicine!"
        E3[Each Med = Superpower<br/>How-To + Fun Facts]
    end
    subgraph "Episode 4: What's Next?"
        E4[Treatment Timeline<br/>Day-by-Day Expectations]
    end
    subgraph "Episode 5: Healthy Habits!"
        E5[Diet + Exercise + Sleep<br/>Daily Routines]
    end
    subgraph "Episode 6: Uh Oh Moments!"
        E6[Warning Signs<br/>When to Tell a Grown-Up]
    end
    subgraph "Episode 7: You Did It!"
        E7[Celebration + Recap<br/>Health Hero Certificate]
    end

    E1 --> E2 --> E3 --> E4 --> E5 --> E6 --> E7

    E1 -.- C1[🦸 Captain Welcome]
    E2 -.- C2[🦉 Dr. Owl]
    E3 -.- C3[🛡️ Super Shield]
    E4 -.- C4[🐢 Time Turtle]
    E5 -.- C5[🦊 Veggie Fox]
    E6 -.- C6[🦅 Alert Eagle]
    E7 -.- C7[⭐ Star Champion]
```

Each episode unlocks a **collectible Battle Card** + **picture-based quiz**.

---

## Supported Conditions

| Condition | Patient | Age | Key Medications |
|-----------|---------|-----|-----------------|
| Childhood Asthma | Lily Chen | 4 | Albuterol (rescue), Flovent (daily controller) |
| Ear Infection (Otitis Media) | Noah Martinez | 3 | Amoxicillin (antibiotic), Children's Tylenol |
| Acute Lymphoblastic Leukemia | Zara Thompson | 10 | Vincristine (chemo), Prednisone, Ondansetron |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | Kid-friendly responsive UI |
| **Backend** | Node.js, Express.js | API orchestration server |
| **Video AI** | HeyGen API | Personalized avatar video generation |
| **Live AI** | HeyGen LiveAvatar + LiveKit | Real-time voice AI conversation |
| **Context AI** | Perplexity Sonar API | LLM-powered medical context layer |
| **Drug Data** | OpenFDA API | FDA drug labels, safety, indications |
| **Clinical Data** | DailyMed / NLM API | Clinical dosage, interactions |
| **Reminders** | Poke SDK (MCP) | Medication reminders via Model Context Protocol |
| **Real-Time** | LiveKit (WebRTC) | Audio/video streaming |
| **Icons** | Lucide React | UI iconography |
| **Storage** | LocalStorage | Demo-friendly client-side persistence |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Michael-600/MedFlix.git
cd MedFlix

# 2. Install frontend
npm install

# 3. Install backend
cd server && npm install && cd ..

# 4. Configure environment
# Create server/.env with:
#   HEYGEN_API_KEY=your_key
#   LIVEAVATAR_API_KEY=your_key
#   PERPLEXITY_API_KEY=your_key
#   POKE_API_KEY=your_key
#   PORT=3001

# 5. Start backend
cd server && node index.js &

# 6. Start frontend
cd .. && npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:3001`

---

## Project Structure

```
MedFlix/
├── src/                            # React Frontend
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Router setup
│   ├── index.css                   # Global styles (Tailwind)
│   ├── components/                 # UI Components
│   │   ├── RecoveryPlan.jsx        # 7-episode adventure view
│   │   ├── DayCard.jsx             # Episode card + quiz + battle card
│   │   ├── VideoPlayer.jsx         # HeyGen video playback
│   │   ├── LiveAvatar.jsx          # Real-time AI voice conversation
│   │   ├── AIAssistant.jsx         # Text-based Health Buddy
│   │   ├── CreateContent.jsx       # Doctor content creation
│   │   ├── MedicationReminders.jsx # Poke medication tracking
│   │   ├── Header.jsx              # Navigation
│   │   └── Logo.jsx                # App logo component
│   ├── pages/
│   │   ├── Landing.jsx             # Public homepage
│   │   ├── Login.jsx               # Role selection (Doctor / Kid)
│   │   ├── DoctorPortal.jsx        # Doctor's patient management
│   │   └── PatientPortal.jsx       # Kid's health adventure
│   ├── contexts/
│   │   └── AuthContext.jsx          # useAuth() hook, localStorage persistence
│   ├── data/
│   │   ├── patientData.js          # 3 kid patient profiles
│   │   ├── quizData.js             # Quiz questions + battle cards
│   │   └── mockData.js             # Defaults, medications, AI responses
│   ├── utils/
│   │   └── storage.js              # localStorage wrapper with "medflix_" prefix
│   └── api/
│       └── clinicalDataTool.js     # OpenFDA + DailyMed client
│
├── server/                         # Node.js Backend
│   ├── index.js                    # Express API server (all routes)
│   ├── contextEngine.js            # Clinical data → episode context
│   ├── episodeScripts.js           # 7 hardcoded episode builders
│   ├── heygenPrompt.js             # Video generation prompt builder
│   ├── perplexitySonar.js          # Perplexity AI integration
│   ├── clinicalSearch.js           # ClinicalTrials.gov search (server-side)
│   ├── openfdaClient.js            # OpenFDA drug data client
│   ├── dailymedClient.js           # DailyMed drug label client
│   ├── pokeMcp.js                  # Poke MCP server (stdio)
│   └── mcp/                        # MCP tools for Poke agent
│       ├── main.js                 # MCP server entry point
│       ├── createServer.js         # Server factory + tool registration
│       ├── api.js                  # Shared API helpers
│       └── tools/
│           ├── index.js            # Tool registry
│           ├── getPatientContext.js # Patient info lookup
│           ├── getMedicationSchedule.js # Medication schedule lookup
│           ├── searchClinicalEvidence.js # ClinicalTrials.gov search
│           ├── researchMedicalTopic.js  # Perplexity Sonar research
│           ├── logMedicationTaken.js    # Log adherence events
│           └── sendReminder.js          # Send reminder via Poke
│
├── README.md                       # ← You are here
├── server/README.md                # Backend documentation
└── src/README.md                   # Frontend documentation
```

---

## Team

Built for [Hackathon Name] by the MedFlix Prime Care team.

---

*"Every child deserves to understand their own health — in words they can actually understand."*
