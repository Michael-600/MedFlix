🧠 MedFlix - AI-Powered Patient Education

Transforming dense medical documents into engaging, bite-sized video episodes.

⸻

## 🎨 Design System

MedFlix features a modern, professional healthcare aesthetic with a consistent purple color scheme.

### Color Palette
- **Primary**: Purple (#9333ea) - Trust, care, innovation
- **Success**: Green - Completed tasks and success states
- **Warning**: Orange - Processing and warning states
- **Error**: Red - Critical actions and errors
- **Neutral**: Gray scale for backgrounds and text

### Key Features
- Sleek glassmorphism effects
- Smooth gradient transitions
- Professional purple-accented UI
- Consistent shadows with color tints
- Animated micro-interactions

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) for detailed guidelines.

⸻

1. Problem

Current State
	•	Patients forget 40–80% of what doctors say.
	•	Discharge instructions = static PDFs.
	•	Clinics repeat explanations daily.
	•	Low adherence → worse outcomes → more calls → more liability.

Core Pain Points

For Patients
	•	Overwhelmed at time of diagnosis
	•	Confused about medications
	•	Don’t know what’s normal vs concerning
	•	Feel unsupported between visits

For Clinics
	•	Appointment time wasted on repetition
	•	High post-op call volume
	•	Low adherence
	•	Risk exposure
	•	No visibility into patient comprehension

⸻

2. Solution Overview

CareStream generates structured, episodic, personalized educational content triggered automatically from EMR data.

Patients receive:
	•	Bite-sized “episodes”
	•	Time-released
	•	Personalized to their diagnosis + procedure
	•	Interactive comprehension checks
	•	Conversational AI follow-up

Clinics receive:
	•	Completion tracking
	•	Risk flags
	•	Reduced inbound friction

This is not video generation.

This is:

Behavioral adherence infrastructure delivered via episodic AI education.

⸻

3. Product Principles
	1.	Structured, not generic
	2.	EMR-triggered, not manual
	3.	Behavior-changing, not informational
	4.	Emotionally intelligent
	5.	Time-released, not dumped

⸻

4. User Personas

Persona A: Surgical Patient (Orthopedic Example)
	•	Age: 58
	•	Scheduled knee replacement
	•	Anxiety about recovery
	•	Low medical literacy

Needs:
	•	Clear expectations
	•	Prep instructions
	•	Milestone guidance
	•	Warning signs

⸻

Persona B: Oncology Patient
	•	Newly diagnosed
	•	High emotional distress
	•	Multiple medications
	•	Complex treatment plan

Needs:
	•	Repeated reinforcement
	•	Emotional reassurance
	•	Clarity on side effects
	•	Adherence support

⸻

Persona C: Clinic Admin
	•	Manages 4 surgeons
	•	High call volume
	•	Wants operational efficiency

Needs:
	•	Automated system
	•	Low onboarding friction
	•	Analytics dashboard
	•	Legal defensibility

⸻

5. Core Features

⸻

5.1 EMR Trigger Engine

Input Sources:
	•	Procedure codes (CPT)
	•	Diagnosis codes (ICD-10)
	•	Medications prescribed
	•	Visit type

Logic:
Trigger → Episode Tree → Generate Content → Deliver

Example:

Knee Replacement CPT →
	•	Episode 1: What to Expect
	•	Episode 2: How to Prepare
	•	Episode 3: Day of Surgery
	•	Episode 4: Week 1 Recovery
	•	Episode 5: Physical Therapy Milestones

⸻

5.2 Episode Architecture

Each episode includes:
	•	2–5 min AI video explainer
	•	Bullet recap
	•	Quick knowledge check (1–2 questions)
	•	“When to call your doctor” section
	•	Optional conversational AI follow-up

⸻

5.3 Time-Release System

Episodes released based on:
	•	Days before surgery
	•	Days after surgery
	•	Medication start date
	•	Patient behavior (e.g., incomplete module)

Example Timeline:

T - 7 days → Prep episode
T - 1 day → What to expect
T + 1 day → Immediate recovery
T + 7 days → Warning signs
T + 30 days → Long-term rehab

⸻

5.4 Conversational Layer

Patient can ask:
	•	“Is swelling normal?”
	•	“What if I miss a dose?”
	•	“Why am I feeling nauseous?”

The AI:
	•	References patient’s specific procedure
	•	Pulls from structured clinical knowledge graph
	•	Avoids hallucination via bounded response system

⸻

5.5 Clinic Dashboard

Metrics:
	•	% Episode completion
	•	Drop-off points
	•	High-risk symptom flags
	•	Call reduction tracking
	•	Medication adherence self-report

Admin View:
	•	Patient-level
	•	Cohort-level
	•	Specialty-level

⸻

6. Technical Architecture

⸻

6.1 Data Flow

EMR → FHIR API →
Trigger Engine →
Condition → Episode Graph →
Content Generator →
Delivery Engine (SMS/Email/App) →
Analytics Pipeline

⸻

6.2 Content Generation Layer

Pipeline:
	1.	Structured template selection
	2.	Patient personalization (age, literacy level)
	3.	Emotional tone adaptation
	4.	Script generation
	5.	Video generation OR avatar narration
	6.	Comprehension module generation

⸻

6.3 Knowledge Graph

Not just prompting.

System maps:

Condition →
Procedures →
Medications →
Side Effects →
Warning Symptoms →
Timeline Milestones

Pre-built per specialty.

This is defensible infrastructure.

⸻

6.4 Guardrails
	•	Bounded scope per diagnosis
	•	No off-label advice
	•	Escalation logic:
	•	If symptom severe → “Call your doctor immediately”
	•	Human-reviewed medical templates initially

⸻

7. MVP Scope (Hackathon vs Production)

⸻

Hackathon MVP

Pick ONE specialty.

Example: Orthopedic knee surgery.

Build:
	•	Manual trigger input
	•	5 structured episode templates
	•	AI-generated script
	•	Simple avatar narration
	•	Web-based episode portal
	•	Mock clinic dashboard

Skip:
	•	Full EMR integration
	•	Complex knowledge graph

⸻

Beta Production

Add:
	•	FHIR integration
	•	SMS delivery
	•	Completion tracking
	•	Branch logic
	•	Symptom escalation flags
