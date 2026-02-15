# MedFlix Backend

Express.js API server that orchestrates clinical data retrieval, AI context generation, video creation, and real-time avatar sessions.

---

## API Routes

### Health & Status
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Server status JSON |
| `GET` | `/api/health` | Health check with feature flags |

### HeyGen Video Generation
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/heygen/video-agent` | Create a video using the Video Agent API |
| `POST` | `/api/heygen/structured-avatar` | Create a video using Structured Avatar API |
| `GET` | `/api/heygen/status/:videoId` | Poll video generation status |
| `GET` | `/api/heygen/avatars` | List available HeyGen avatars |
| `GET` | `/api/heygen/voices` | List available HeyGen voices |

### LiveAvatar (Real-Time AI)
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/liveavatar/token` | Create a LiveAvatar session (avatar, voice, quality, language) |
| `POST` | `/api/liveavatar/start` | Start the session and get LiveKit connection URL |
| `POST` | `/api/liveavatar/stop` | Stop a specific session |
| `POST` | `/api/liveavatar/stop-all` | Stop all active sessions (cleanup before new call) |
| `POST` | `/api/liveavatar/keep-alive` | Send keep-alive ping during active session |
| `GET` | `/api/liveavatar/avatars` | List available LiveAvatar avatars |

### Context Engine
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/context/build` | Build episode context from patient data + clinical APIs |
| `POST` | `/api/context/clear-cache` | Clear Perplexity/context cache |

### Poke (Medication Reminders)
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/poke/register` | Register a patient for reminders |
| `GET` | `/api/poke/status/:patientId` | Get registration status |
| `POST` | `/api/poke/medications/sync` | Sync medications for a patient |
| `POST` | `/api/poke/reminders/send` | Send a medication reminder |
| `POST` | `/api/poke/recovery/event` | Log a recovery event |

---

## Core Modules

### `contextEngine.js`
Orchestrates the clinical data pipeline:
1. Calls `gatherClinicalData()` — parallel fetch from OpenFDA + DailyMed
2. For episodes 1–7, delegates to `episodeScripts.js` hardcoded builders
3. For custom episodes, builds context via Perplexity Sonar AI
4. Caches results in-memory to reduce API calls

### `episodeScripts.js`
Seven hardcoded episode builders that use patient data + FDA/DailyMed results to generate scene-by-scene scripts. Each builder branches on diagnosis (asthma, ear infection, leukemia) and produces:
- `scenes[]` — array of `{ script, visual }` pairs
- `keyPoints[]` — episode summary bullets
- `sources[]` — data attribution

### `heygenPrompt.js`
Transforms episode scenes into HeyGen-compatible prompts with:
- Per-scene script text for avatar narration
- Visual directives for background/animation
- Style configuration (avatar, voice, pacing)

### `perplexitySonar.js`
Thin wrapper around the Perplexity Sonar API (`sonar` model) for building the medical context layer. Configured with:
- `max_tokens: 2000`
- `temperature: 0.3` (factual, low creativity)
- `search_recency_filter: "month"`
- In-memory result caching

### `pokeMcp.js`
Model Context Protocol server for medication reminders using the Poke SDK. Exposes MCP tools for patient registration, medication sync, and reminder delivery.

---

## Environment Variables

```env
HEYGEN_API_KEY=           # HeyGen video generation API key
LIVEAVATAR_API_KEY=       # HeyGen LiveAvatar API key
PERPLEXITY_API_KEY=       # Perplexity Sonar API key
POKE_API_KEY=             # Poke SDK API key
PORT=3001                 # Server port
```

---

## Running

```bash
cd server
npm install
node index.js        # or: npm run dev (with --watch)
```

Server runs on `http://localhost:3001`.
