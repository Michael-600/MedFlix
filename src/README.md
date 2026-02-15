# MedFlix Frontend

React 18 + Vite + Tailwind CSS application — a kid-friendly health education portal with AI-generated videos, real-time avatar conversations, collectible cards, and picture quizzes.

---

## Pages

### `Login.jsx`
Role selection screen. Doctors log in with a name; kids pick their emoji avatar from the patient list. Stores session in `localStorage`.

### `DoctorPortal.jsx`
Doctor's view — "My Little Patients." Select a child patient, create personalized health episodes, and send them to the patient portal. Shows sent content and episode generation status.

### `PatientPortal.jsx`
Child's view — four tabs:
| Tab | Component | Description |
|-----|-----------|-------------|
| **My Shows** | `RecoveryPlan` | 7-episode health adventure with progress tracking |
| **Talk to Doc** | `LiveAvatar` | Real-time voice call with AI Health Buddy |
| **Reminders** | `MedicationReminders` | Daily medication schedule via Poke |
| **Ask Buddy** | `AIAssistant` | Text-based Q&A with Health Buddy |

---

## Key Components

### `RecoveryPlan.jsx`
The main episode hub — "My Health Adventure!" Shows 7 `DayCard` components in sequence, a card collection counter, and star-based progress. Episodes unlock sequentially.

### `DayCard.jsx`
Each episode card includes:
- **Video button** — "Watch My Show!"
- **Key Takeaways** — bullet summary after video
- **Quiz Section** — 2-3 picture-based questions with emoji options
- **Battle Card** — collectible card revealed with flip animation after quiz completion
- Cards stored in `localStorage` per patient

### `VideoPlayer.jsx`
HeyGen video playback with:
- Auto-fetch of video URL from backend (polling for async generation)
- Kid-friendly completion overlay ("AMAZING JOB!" + 5-star rating)
- Retry and error states

### `LiveAvatar.jsx`
Full-screen real-time AI voice conversation powered by HeyGen LiveAvatar + LiveKit WebRTC:
- **Avatar selection** — 6 preset avatars (including Santa) + expandable full list
- **Quality & Language controls** — HD/SD, 10 languages
- **Patient context injection** — every message includes the child's name, diagnosis, and medications
- **First-name-only** — avatar always calls the child by first name
- **Real-time captions** — streaming transcription display
- **Status indicators** — Listening / Thinking / Speaking states
- **User camera PIP** — picture-in-picture via HTML Canvas

### `AIAssistant.jsx`
Text-based Health Buddy with keyword-matched responses for medications, pain, warnings, exercise, and diet. Uses kid-friendly language with emoji.

### `CreateContent.jsx`
Doctor-facing episode creation. 7 pre-defined episode types with kid-friendly titles. Sends patient data + episode config to backend for context building and video generation.

### `MedicationReminders.jsx`
Medication schedule display powered by Poke SDK (MCP). Shows daily med list with timing, dosage, and instructions.

---

## Data Layer

### `patientData.js`
Three kid patient profiles with full medical detail:
- **Lily Chen** (4) — Childhood Asthma
- **Noah Martinez** (3) — Ear Infection
- **Zara Thompson** (10) — Acute Lymphoblastic Leukemia

### `quizData.js`
Per-condition quiz questions for episodes 1–7, plus 7 collectible battle cards with character names, powers, and fun facts.

### `mockData.js`
Default recovery plan, kid-friendly medication lists, visual style options (Pixar, Anime, Spider-Verse, etc.), and AI assistant responses.

---

## Running

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` with Vite proxy to backend at `:3001`.
