# MedFlix - Patient Education Platform

**Netflix-style episodes for patient comprehension.** Transform dense medical documents into engaging, bite-sized video episodes that patients actually want to watch.

Inspired by [Neuroflix](https://www.linkedin.com/posts/antoinekllee_my-team-and-i-built-neuroflix-at-the-first-activity-7385957805679263745-hD3M/) (corporate training), adapted for healthcare.

## Features

### Patient Portal Dashboard
- **Personalized Recovery Plan** - 7-day progressive recovery plan with daily episodes
- **Day Cards** - Checklist items, video episodes, and progressive unlocking
- **Video Player** - Simulated video player with knowledge-check quiz checkpoints
- **AI Assistant** - Chat interface for patient questions about their recovery
- **Progress Tracking** - Visual progress bar and completion badges

### Create Content (Integrated)
- **Visual Style Selection** - 8 preset styles (Friends, Zootopia, Anime, The Office, Pixar, Spider-Verse, South Park, Custom)
- **Character Management** - Add characters with roles (Doctor, Nurse, Patient, etc.)
- **Material Upload** - Upload medical PDFs, discharge summaries, lab results
- **Video Generation** - Generate 7 personalized video episodes from medical documents
- **3-Step Workflow** - Setup → Videos → Complete & Publish

### General
- Single patient-focused dashboard with all features
- Condition-specific recovery plans (Breast Cancer, Diabetes, Knee Replacement, etc.)
- LocalStorage persistence for multi-user support
- Responsive, modern UI

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **Lucide React** for icons
- **LocalStorage** for state persistence (no backend required)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will open at `http://localhost:5173`.

## Usage

1. **Landing Page** - Learn about MedFlix and click "Get Started"
2. **Login** - Enter your name and select your condition
3. **Patient Portal** - Three tabs for different features:
   - **Recovery Plan** - View your 7-day personalized plan, complete checklists, watch episodes
   - **AI Assistant** - Ask questions about your recovery and treatment
   - **Create Content** - Generate custom video episodes from your medical documents

## Project Structure

```
src/
├── App.jsx              # Router and app shell
├── main.jsx             # Entry point
├── index.css            # Global styles + Tailwind
├── components/
│   ├── AIAssistant.jsx  # AI chat interface
│   ├── CreateContent.jsx # Content creation workflow
│   ├── DayCard.jsx      # Recovery plan day card
│   ├── Header.jsx       # Patient portal header
│   ├── RecoveryPlan.jsx # Recovery plan grid
│   └── VideoPlayer.jsx  # Video player modal
├── contexts/
│   └── AuthContext.jsx   # Auth state management
├── data/
│   └── mockData.js      # Visual styles, plans, AI responses
├── pages/
│   ├── Landing.jsx      # Marketing landing page
│   ├── Login.jsx        # Patient login
│   └── PatientPortal.jsx # Main patient dashboard
└── utils/
    └── storage.js       # LocalStorage helpers
```

## License

MIT
