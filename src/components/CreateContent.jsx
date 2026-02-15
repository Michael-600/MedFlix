import { useState, useEffect, useRef } from 'react'
import { visualStyles, defaultRecoveryPlan } from '../data/mockData'
import { searchClinicalData } from '../api/clinicalDataTool'
import { samplePatient, getPatientContext } from '../data/patientData'
import {
  Palette, Users, Upload, Film, CheckCircle, PenLine,
  Plus, FileText, Image as ImageIcon, X, Trash2, Loader2, RefreshCw,
  Database, Brain, Video,
} from 'lucide-react'

const STEPS = [
  { id: 'setup', label: 'Setup', icon: Palette },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
]

// Avatar presets for the structured video API.
// Each combines an avatar_id, voice_id, and avatar_style from HeyGen.
// Users can also load custom avatars from the API.
const AVATAR_PRESETS = [
  {
    id: 'angela',
    name: 'Angela',
    subtitle: 'Professional presenter',
    avatar_id: 'Angela-inTshirt-20220820',
    voice_id: '1bd001e7e50f421d891986aad5571571',
    avatar_style: 'normal',
    preview: '👩‍⚕️',
  },
  {
    id: 'josh',
    name: 'Josh',
    subtitle: 'Friendly male guide',
    avatar_id: 'josh_lite3_20230714',
    voice_id: '077ab11b14f04ce0b49b5f0f3ccb1573',
    avatar_style: 'normal',
    preview: '👨‍⚕️',
  },
  {
    id: 'anna',
    name: 'Anna',
    subtitle: 'Warm female presenter',
    avatar_id: 'Anna_public_3_20240108',
    voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54',
    avatar_style: 'normal',
    preview: '👩',
  },
  {
    id: 'edward',
    name: 'Edward',
    subtitle: 'Confident male expert',
    avatar_id: 'Tyler-incasualsuit-20220721',
    voice_id: '131a436c47064f708210df6628ef8f32',
    avatar_style: 'normal',
    preview: '👨',
  },
  {
    id: 'closeup',
    name: 'Close-Up',
    subtitle: 'Intimate close-up style',
    avatar_id: 'Angela-inTshirt-20220820',
    voice_id: '1bd001e7e50f421d891986aad5571571',
    avatar_style: 'closeUp',
    preview: '🔍',
  },
  {
    id: 'circle',
    name: 'Circle Overlay',
    subtitle: 'Avatar in a circle overlay',
    avatar_id: 'Angela-inTshirt-20220820',
    voice_id: '1bd001e7e50f421d891986aad5571571',
    avatar_style: 'circle',
    preview: '⭕',
  },
]

export default function CreateContent({
  onComplete,
  defaultPatientName = '',
  defaultDiagnosis = '',
  patient = null, // full patient object if provided
}) {
  // Use provided patient, fallback to samplePatient
  const activePatient = patient || samplePatient

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('friends')
  const [selectedAvatar, setSelectedAvatar] = useState('angela')
  const [customDescription, setCustomDescription] = useState('')
  const [patientName, setPatientName] = useState(defaultPatientName || activePatient.name)
  const [diagnosis, setDiagnosis] = useState(defaultDiagnosis || activePatient.diagnosis || defaultRecoveryPlan.diagnosis || '')
  const [characters, setCharacters] = useState([])
  const [materials, setMaterials] = useState([])
  const [videos, setVideos] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationPhase, setGenerationPhase] = useState('')

  const activeStyle = visualStyles.find((s) => s.id === selectedStyle)

  const handleAddCharacter = () => {
    setCharacters((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        role: 'Doctor',
        imagePreview: null,
      },
    ])
  }

  const handleUpdateCharacter = (id, field, value) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleRemoveCharacter = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }

  const handleCharacterImage = (id) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const color = colors[Math.floor(Math.random() * colors.length)]
    handleUpdateCharacter(id, 'imagePreview', color)
  }

  const handleAddMaterial = () => {
    const sampleFiles = [
      'Patient_Discharge_Summary.pdf',
      'Lab_Results_2026.pdf',
      'Treatment_Plan_v2.pdf',
      'Medication_Guide.pdf',
      'Post_Surgery_Instructions.pdf',
    ]
    const name = sampleFiles[materials.length % sampleFiles.length]
    setMaterials((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        type: 'pdf',
        size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
      },
    ])
  }

  const handleRemoveMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  // Get the primary doctor name from patient data
  const doctorName = activePatient.careTeam?.[0]?.name || 'Dr. Sarah Chen'

  // Episode definitions for structured generation
  // NOTE: The presenter is an education GUIDE, not the patient's doctor.
  // Videos should be 50-60 seconds, built from 5-7 scenes of detailed clinical content.
  const episodeDefs = [
    {
      episode: 1,
      title: 'Welcome & Introduction',
      description: `A friendly guide welcomes you and explains what ${doctorName} has planned for your care, including an overview of your diagnosis, medications, and goals.`,
      thumbnail: '🎬',
      prompt: `Create a 60-second patient education video. A health guide welcomes the patient by name and provides an overview of their care journey: their diagnosis, the medications ${doctorName} has prescribed, and the goals they'll work toward. Reference specific medication names and health targets. The guide is NOT the doctor. Tone: warm, clear, reassuring.`,
    },
    {
      episode: 2,
      title: 'Understanding Your Condition',
      description: `A detailed explanation of the patient's specific diagnosis — what it means, how it affects the body, key numbers to understand, and why the treatment plan matters.`,
      thumbnail: '📚',
      prompt: `Create a 60-second educational video. A health guide explains the patient's SPECIFIC diagnosis in detail: what it is medically, how it affects the body, what the patient's current numbers mean (e.g., HbA1c, blood pressure, ejection fraction), and why ${doctorName}'s treatment plan targets those numbers. Use ONLY factual medical information. NO vague wellness talk. Reference the actual condition name and actual clinical values.`,
    },
    {
      episode: 3,
      title: 'Your Medications',
      description: `A thorough walkthrough of each prescribed medication: name, dose, when to take it, what it does, side effects to watch for, and important warnings from FDA data.`,
      thumbnail: '💊',
      prompt: `Create a 60-second medication education video. A health guide walks through EACH medication by name and dose, explaining: what it does, when and how to take it, common side effects from FDA data, and key warnings. Cover ALL prescribed medications one by one. Say "your doctor has prescribed" not "I prescribed".`,
    },
    {
      episode: 4,
      title: 'What to Expect',
      description: `Practical week-by-week guidance: what changes to expect, how the body responds to treatment, monitoring schedule, and when things should start improving.`,
      thumbnail: '📋',
      prompt: `Create a 60-second patient preparation video. A health guide covers week-by-week expectations: how the body responds to the prescribed medications, what monitoring the patient needs to do, when they should see improvement, and practical tips for the first month. Reference specific medications and their expected timeline of effects.`,
    },
    {
      episode: 5,
      title: 'Lifestyle & Home Care',
      description: `Specific diet, exercise, and daily habit recommendations based on the patient's condition, with actionable steps and measurable targets.`,
      thumbnail: '🏠',
      prompt: `Create a 60-second lifestyle guide video. A health guide gives SPECIFIC actionable recommendations for diet, exercise, and daily routines tailored to the patient's condition. Include measurable targets (e.g., "30 minutes of walking", "less than 2000mg sodium"). Reference how lifestyle changes interact with their specific medications.`,
    },
    {
      episode: 6,
      title: 'Warning Signs & When to Call',
      description: `Specific symptoms that need attention, organized by urgency — what to watch for with each medication, and exactly when to call the care team or go to the ER.`,
      thumbnail: '⚠️',
      prompt: `Create a 60-second warning signs video. A health guide lists SPECIFIC symptoms to watch for, organized by urgency level. Include medication-specific side effects (from FDA data) that require immediate attention. Explain exactly when to call the care team vs. go to the ER. Reference each medication's key warnings by name.`,
    },
    {
      episode: 7,
      title: 'Your Goals & Next Steps',
      description: `Review of the specific health goals the doctor has set, how to track progress, upcoming appointments, and an encouraging wrap-up of the care journey.`,
      thumbnail: '🎯',
      prompt: `Create a 60-second goals and next steps video. A health guide reviews each specific health goal the doctor has set, explains how to track progress (what numbers to monitor), lists upcoming milestones, and provides an encouraging summary of the entire care plan. Reference specific target values and timelines.`,
    },
  ]

  const pollingRef = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Background polling: check video statuses every 10s
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    const hasProcessing = videos.some((v) => v.status === 'processing')
    if (!hasProcessing || videos.length === 0) return

    pollingRef.current = setInterval(async () => {
      let changed = false
      const updated = [...videos]

      for (let i = 0; i < updated.length; i++) {
        const v = updated[i]
        if (v.videoId && v.status === 'processing') {
          try {
            const statusRes = await fetch(`/api/heygen/video-status/${v.videoId}`)
            const statusData = await statusRes.json()
            const status = statusData?.data?.status

            if (status === 'completed') {
              updated[i] = {
                ...v,
                status: 'completed',
                videoUrl: statusData.data.video_url,
                duration: statusData.data.duration
                  ? `${Math.round(statusData.data.duration)}s`
                  : v.duration,
              }
              changed = true
            } else if (status === 'failed') {
              updated[i] = {
                ...v,
                status: 'failed',
                errorMsg: statusData.data?.error?.message || 'Generation failed',
              }
              changed = true
            }
          } catch {
            // Will retry next interval
          }
        }
      }

      if (changed) setVideos(updated)

      // Stop polling if all done
      const stillProcessing = updated.some((v) => v.status === 'processing')
      if (!stillProcessing && pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }, 10000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [videos])

  const handleGenerateVideos = async () => {
    if (materials.length === 0) return
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationPhase('Gathering clinical data...')

    const generatedVideos = []
    const totalEpisodes = episodeDefs.length
    const styleText =
      selectedStyle === 'custom'
        ? customDescription
        : (visualStyles.find((s) => s.id === selectedStyle)?.description || '')

    // Get selected avatar settings
    const avatarPreset = AVATAR_PRESETS.find((a) => a.id === selectedAvatar) || AVATAR_PRESETS[0]

    // Build full patient context from sample data
    const patientContext = getPatientContext({
      ...activePatient,
      name: patientName || activePatient.name,
      diagnosis: diagnosis || activePatient.diagnosis,
    })

    for (let i = 0; i < totalEpisodes; i++) {
      const ep = episodeDefs[i]
      const progressPct = Math.round(((i + 0.5) / totalEpisodes) * 100)
      setGenerationProgress(progressPct)

      try {
        // Phase 1: Build context via the context engine (hardcoded episode builders + FDA/DailyMed data)
        setGenerationPhase(`Episode ${ep.episode}: Building clinical context...`)
        let episodeContext = null
        try {
          const contextRes = await fetch('/api/context/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient: patientContext,
              episode: { title: ep.title, description: ep.description },
              episodeNumber: ep.episode,
            }),
          })
          const contextData = await contextRes.json()
          if (contextData?.ok) {
            episodeContext = contextData.data
          }
        } catch {
          // Context is optional; proceed without it
        }

        // Phase 2: Also fetch ClinicalTrials.gov data (existing pipeline)
        let clinicalContext = null
        try {
          const evidenceResult = await searchClinicalData({
            patientName,
            diagnosis,
            episodeTitle: `Episode ${ep.episode}: ${ep.title}`,
            dayTitle: ep.title,
            dayDescription: ep.description,
            instruction: 'Tailor the script to the patient.',
          })
          if (evidenceResult?.ok) {
            clinicalContext = evidenceResult.data
          }
        } catch {
          // Evidence is optional
        }

        setGenerationPhase(`Episode ${ep.episode}: Generating video...`)
        setGenerationProgress(Math.round(((i + 1) / totalEpisodes) * 100))

        // Phase 3: Generate video using structured V2 API if we have context scripts
        let videoId = null
        let videoData = null

        if (episodeContext?.scenes?.length > 0 || (episodeContext?.greeting && episodeContext?.mainContent)) {
          // Use structured video API — avatar speaks the scripted scenes
          // Visual descriptions from the context engine inform the background/style of each scene
          const contextScenes = episodeContext.scenes || [
            { script: episodeContext.greeting, visual: '' },
            { script: episodeContext.mainContent, visual: '' },
            { script: episodeContext.closing, visual: '' },
          ]
          const scenes = contextScenes.map((s) => ({
            script: s.script,
            avatar_id: avatarPreset.avatar_id,
            voice_id: avatarPreset.voice_id,
            avatar_style: avatarPreset.avatar_style,
            // Pass visual description as background context
            visual: s.visual || '',
          }))

          try {
            const res = await fetch('/api/heygen/generate-structured-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scenes,
                avatar_id: avatarPreset.avatar_id,
                voice_id: avatarPreset.voice_id,
                title: `Episode ${ep.episode}: ${ep.title}`,
              }),
            })
            videoData = await res.json()
            videoId = videoData?.data?.video_id
          } catch {
            // Fall back to Video Agent below
          }
        }

        // Fallback: use Video Agent API if structured video didn't work
        if (!videoId) {
          // Include visual descriptions from context engine in the Video Agent prompt
          const visualDirections = episodeContext?.scenes
            ?.map((s, idx) => `Scene ${idx + 1}: ${s.visual}`)
            .filter((v) => v)
            .join('\n') || ''

          const basePrompt = [
            ep.prompt,
            styleText ? `\nVISUAL STYLE:\n${styleText}` : null,
            visualDirections ? `\nEXACT VISUAL DIRECTIONS (show ONLY these on screen):\n${visualDirections}` : null,
          ].filter(Boolean).join('\n\n')

          const res = await fetch('/api/heygen/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: basePrompt,
              duration_sec: 60,
              patient: patientContext,
              episode: {
                title: ep.title,
                description: ep.description,
                episode: ep.episode,
              },
              clinicalContext,
              use_sonar: true,
            }),
          })
          videoData = await res.json()
          videoId = videoData?.data?.video_id
        }

        // Build the full script text for display
        const fullScript = episodeContext
          ? [episodeContext.greeting, episodeContext.mainContent, episodeContext.closing].filter(Boolean).join('\n\n')
          : null

        generatedVideos.push({
          id: videoId || `local-${i + 1}`,
          episode: ep.episode,
          title: ep.title,
          description: ep.description,
          duration: '30-45s',
          thumbnail: ep.thumbnail,
          videoId: videoId || null,
          videoUrl: null,
          status: videoId ? 'processing' : 'prompt_ready',
          errorMsg: videoId ? null : (videoData?.error || null),
          research: videoData?.medflix || null,
          prompt: fullScript || videoData?.medflix?.prompt || ep.prompt,
          keyPoints: episodeContext?.keyPoints || null,
          contextSources: episodeContext?.sources || null,
          clinicalData: episodeContext?.clinicalData || null,
        })
      } catch (e) {
        console.error(`Failed to generate episode ${ep.episode}:`, e)
        generatedVideos.push({
          id: `local-${i + 1}`,
          episode: ep.episode,
          title: ep.title,
          description: ep.description,
          duration: '30-45s',
          thumbnail: ep.thumbnail,
          videoId: null,
          videoUrl: null,
          status: 'failed',
          errorMsg: e.message,
          research: null,
          prompt: null,
        })
      }
    }

    // Immediately move to Videos step — polling happens in background via useEffect
    setVideos(generatedVideos)
    setIsGenerating(false)
    setGenerationProgress(100)
    setGenerationPhase('')
    setCurrentStep(1)
  }

  const handleComplete = () => {
    setCurrentStep(2)
  }

  const handlePublish = () => {
    // Create recovery plan from generated videos
    const newPlan = {
      ...defaultRecoveryPlan,
      patientName: patientName || 'Patient',
      diagnosis: diagnosis || defaultRecoveryPlan.diagnosis,
      startDate: new Date().toISOString().split('T')[0],
      totalDays: videos.length,
      days: videos.map((video, idx) => ({
        day: idx + 1,
        title: video.title,
        description: video.description,
        completed: false,
        unlocked: idx === 0,
        checklist: [
          { id: `c${idx}-1`, text: 'Watch the full episode', checked: false },
          { id: `c${idx}-2`, text: 'Complete knowledge check questions', checked: false },
          { id: `c${idx}-3`, text: 'Review key takeaways', checked: false },
        ],
        videoUrl: video.videoUrl || null,
        videoId: video.videoId || null,
        episodeTitle: `Episode ${idx + 1}: ${video.title}`,
      })),
    }

    if (onComplete) {
      onComplete(newPlan)
    }
    
    // Reset for next time
    setCurrentStep(0)
    setSelectedStyle('friends')
    setSelectedAvatar('angela')
    setCustomDescription('')
    setPatientName(defaultPatientName || activePatient.name)
    setDiagnosis(defaultDiagnosis || activePatient.diagnosis || defaultRecoveryPlan.diagnosis || '')
    setCharacters([])
    setMaterials([])
    setVideos([])
    setIsGenerating(false)
    setGenerationProgress(0)
    setGenerationPhase('')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Patient Education Content</h2>
        <p className="text-sm text-gray-500">
          Transform medical documents into engaging video episodes
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (i < currentStep || (i === 1 && videos.length > 0)) {
                  setCurrentStep(i)
                }
              }}
              disabled={i > currentStep && !(i === 1 && videos.length > 0)}
              className={`flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                i === currentStep
                  ? 'text-medflix-accent'
                  : i < currentStep
                  ? 'text-green-600 cursor-pointer hover:bg-gray-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === currentStep
                    ? 'bg-medflix-accent/10 text-medflix-accent'
                    : i < currentStep
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-medium">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {currentStep === 0 && (
          <SetupStep
            patientName={patientName}
            onPatientName={setPatientName}
            diagnosis={diagnosis}
            onDiagnosis={setDiagnosis}
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
            selectedAvatar={selectedAvatar}
            onSelectAvatar={setSelectedAvatar}
            customDescription={customDescription}
            onCustomDescription={setCustomDescription}
            characters={characters}
            onAddCharacter={handleAddCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onRemoveCharacter={handleRemoveCharacter}
            onCharacterImage={handleCharacterImage}
            materials={materials}
            onAddMaterial={handleAddMaterial}
            onRemoveMaterial={handleRemoveMaterial}
            onGenerate={handleGenerateVideos}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            generationPhase={generationPhase}
          />
        )}

        {currentStep === 1 && (
          <VideosStep
            videos={videos}
            style={activeStyle}
            onComplete={handleComplete}
          />
        )}

        {currentStep === 2 && (
          <CompleteStep
            videos={videos}
            style={activeStyle}
            characters={characters}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  )
}

// ----- Setup Step -----
function SetupStep({
  patientName, onPatientName,
  diagnosis, onDiagnosis,
  selectedStyle, onSelectStyle,
  selectedAvatar, onSelectAvatar,
  customDescription, onCustomDescription,
  characters, onAddCharacter, onUpdateCharacter, onRemoveCharacter, onCharacterImage,
  materials, onAddMaterial, onRemoveMaterial,
  onGenerate, isGenerating, generationProgress, generationPhase,
}) {
  return (
    <div className="space-y-8">
      {/* Patient */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Patient Context</h3>
        <p className="text-sm text-gray-500 mb-4">
          Patient data is used to query OpenFDA, DailyMed, and Perplexity Sonar for personalized clinical context
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Patient name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => onPatientName(e.target.value)}
              placeholder="e.g., Marcus Thompson"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => onDiagnosis(e.target.value)}
              placeholder="e.g., Type 2 Diabetes"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Visual Style */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Choose Visual Style</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select a visual style for your patient education videos
        </p>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {visualStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className={`style-preset px-4 py-3 rounded-xl border-2 text-center transition-all ${
                selectedStyle === style.id
                  ? 'border-medflix-accent bg-medflix-accent/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-1">{style.preview}</div>
              <p className="font-medium text-sm text-gray-900">{style.name}</p>
              <p className="text-xs text-gray-500">{style.subtitle}</p>
            </button>
          ))}
        </div>

        <textarea
          value={selectedStyle === 'custom' ? customDescription : (visualStyles.find(s => s.id === selectedStyle)?.description || '')}
          onChange={(e) => {
            if (selectedStyle === 'custom') onCustomDescription(e.target.value)
          }}
          readOnly={selectedStyle !== 'custom'}
          placeholder={selectedStyle === 'custom' ? 'Describe your desired visual style...' : ''}
          className={`w-full h-24 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all ${
            selectedStyle !== 'custom' ? 'bg-gray-50 text-gray-600' : 'bg-white'
          }`}
        />
      </section>

      {/* Avatar & Presenter Style */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Choose Your Presenter</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select an AI avatar and presentation style for your education videos
        </p>

        <div className="grid grid-cols-3 gap-3">
          {AVATAR_PRESETS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => onSelectAvatar(avatar.id)}
              className={`relative px-4 py-4 rounded-xl border-2 text-center transition-all ${
                selectedAvatar === avatar.id
                  ? 'border-medflix-accent bg-medflix-accent/5 shadow-md ring-2 ring-medflix-accent/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
              }`}
            >
              {selectedAvatar === avatar.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-medflix-accent rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{avatar.preview}</div>
              <p className="font-semibold text-sm text-gray-900">{avatar.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{avatar.subtitle}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-mono">{avatar.avatar_style}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Characters */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Characters</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add characters for your education videos (optional)
        </p>

        {characters.length > 0 && (
          <div className="space-y-3 mb-4">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <button
                  onClick={() => onCharacterImage(char.id)}
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-300 hover:border-medflix-accent transition-colors cursor-pointer overflow-hidden"
                  style={char.imagePreview ? { backgroundColor: char.imagePreview, borderStyle: 'solid', borderColor: char.imagePreview } : {}}
                >
                  {char.imagePreview ? (
                    <span className="text-white text-lg font-bold">
                      {char.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={char.name}
                    onChange={(e) => onUpdateCharacter(char.id, 'name', e.target.value)}
                    placeholder="Character name"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-medflix-accent outline-none"
                  />
                  <select
                    value={char.role}
                    onChange={(e) => onUpdateCharacter(char.id, 'role', e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-medflix-accent outline-none bg-white"
                  >
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Patient</option>
                    <option>Family Member</option>
                    <option>Therapist</option>
                    <option>Pharmacist</option>
                    <option>Narrator</option>
                  </select>
                </div>
                <button
                  onClick={() => onRemoveCharacter(char.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onAddCharacter}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-medflix-accent hover:text-medflix-accent transition-colors text-sm font-medium w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </button>
      </section>

      {/* Materials */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Materials</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload medical PDFs, discharge summaries, or treatment plans
        </p>

        {materials.length > 0 && (
          <div className="space-y-2 mb-4">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{mat.name}</p>
                  <p className="text-xs text-gray-400">{mat.size}</p>
                </div>
                <button
                  onClick={() => onRemoveMaterial(mat.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onAddMaterial}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-medflix-accent hover:text-medflix-accent transition-colors text-sm font-medium w-full justify-center"
        >
          <Upload className="w-4 h-4" />
          Upload PDF / Document
        </button>
      </section>

      {/* Generate Button */}
      <div className="pt-4">
        {isGenerating ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {generationPhase || 'Generating care episodes...'}
              </p>
              <p className="text-sm text-medflix-accent font-medium">{generationProgress}%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-medflix-accent h-2 rounded-full transition-all duration-200"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" /> OpenFDA + DailyMed
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" /> Perplexity Sonar
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" /> HeyGen Video
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            disabled={materials.length === 0}
            className="w-full py-3.5 bg-medflix-accent text-white rounded-xl font-semibold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Film className="w-5 h-5" />
            Generate Video Episodes
          </button>
        )}
        {materials.length === 0 && !isGenerating && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Upload at least one medical document to generate videos
          </p>
        )}
      </div>
    </div>
  )
}

// ----- Videos Step -----
function VideosStep({ videos, style, onComplete }) {
  const completed = videos.filter((v) => v.status === 'completed').length
  const processing = videos.filter((v) => v.status === 'processing').length
  const promptReady = videos.filter((v) => v.status === 'prompt_ready').length
  const failed = videos.filter((v) => v.status === 'failed').length
  const [expandedId, setExpandedId] = useState(null)

  const copyPrompt = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-medflix-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-medflix-accent" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Video Episodes</h3>
        <p className="text-gray-500">
          {processing > 0
            ? `${completed} of ${videos.length} videos ready — ${processing} still rendering with AI...`
            : promptReady > 0
              ? `${promptReady} prompts ready${failed ? ` • ${failed} failed` : ''}`
              : `All ${videos.length} video episodes in ${style?.name || 'your'} style`}
        </p>
      </div>

      {/* Status summary bar */}
      {processing > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                AI is generating your videos — this takes 1-3 minutes per episode
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Status updates automatically. You can continue to publish — videos will be ready when you view them.
              </p>
            </div>
          </div>
          <div className="mt-3 bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((completed + failed) / videos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-medflix-accent/30 transition-colors"
          >
            <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
              {video.thumbnail}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-medflix-accent bg-medflix-accent/10 px-2 py-0.5 rounded">
                  Episode {video.episode}
                </span>
                <span className="text-xs text-gray-400">{video.duration}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{video.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{video.description}</p>
              {video.status === 'failed' && video.errorMsg && (
                <p className="text-xs text-red-500 mt-1">{video.errorMsg}</p>
              )}

              {/* Key points from context engine */}
              {video.keyPoints?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {video.keyPoints.slice(0, 3).map((kp, idx) => (
                    <span key={idx} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {kp.length > 50 ? kp.slice(0, 50) + '...' : kp}
                    </span>
                  ))}
                </div>
              )}

              {/* Clinical data badge */}
              {video.clinicalData && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                  {video.clinicalData.fdaDrugsFound > 0 && (
                    <span>FDA: {video.clinicalData.fdaDrugsFound} drugs</span>
                  )}
                  {video.clinicalData.dailyMedFound > 0 && (
                    <span>DailyMed: {video.clinicalData.dailyMedFound} labels</span>
                  )}
                </div>
              )}

              {video.prompt && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === video.id ? null : video.id)}
                      className="text-xs font-medium text-medflix-dark hover:text-medflix-accent transition-colors"
                      type="button"
                    >
                      {expandedId === video.id ? 'Hide script' : 'View script'}
                    </button>
                    <span className="text-xs text-gray-400">•</span>
                    <button
                      onClick={() => copyPrompt(video.prompt)}
                      className="text-xs font-medium text-medflix-dark hover:text-medflix-accent transition-colors"
                      type="button"
                    >
                      Copy script
                    </button>
                    {video?.research?.used_sonar && (
                      <span className="text-[11px] text-gray-400 ml-1">
                        (Sonar: {video.research?.sonar_model || 'sonar'})
                      </span>
                    )}
                  </div>

                  {expandedId === video.id && (
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-3 text-[11px] leading-relaxed text-gray-700">
                      {video.prompt}
                    </pre>
                  )}
                </div>
              )}
            </div>
            <div className={`flex items-center gap-1.5 flex-shrink-0 ${
              video.status === 'completed' ? 'text-green-600' :
              video.status === 'processing' ? 'text-yellow-500' :
              video.status === 'prompt_ready' ? 'text-blue-600' :
              'text-red-500'
            }`}>
              {video.status === 'completed' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Ready</span>
                </>
              ) : video.status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-medium">Rendering...</span>
                </>
              ) : video.status === 'prompt_ready' ? (
                <>
                  <PenLine className="w-4 h-4" />
                  <span className="text-xs font-medium">Prompt ready</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium">Failed</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3.5 bg-medflix-accent text-white rounded-xl font-semibold hover:bg-medflix-accentLight transition-colors flex items-center justify-center gap-2"
      >
        {processing > 0 ? 'Continue Anyway' : 'Continue to Complete'}
        <CheckCircle className="w-5 h-5" />
      </button>
      {processing > 0 && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Videos will continue rendering in the background
        </p>
      )}
    </div>
  )
}

// ----- Complete Step -----
function CompleteStep({ videos, style, characters, onPublish }) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Content Ready!</h3>
        <p className="text-gray-500">
          Your patient education series has been generated and is ready to publish
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">Content Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Visual Style</p>
            <p className="font-medium text-gray-900">{style?.name || 'Custom'}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Episodes</p>
            <p className="font-medium text-gray-900">{videos.length} videos</p>
          </div>
          <div>
            <p className="text-gray-500">Characters</p>
            <p className="font-medium text-gray-900">
              {characters.length > 0
                ? characters.map((c) => c.name || 'Unnamed').join(', ')
                : 'Auto-generated'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total Duration</p>
            <p className="font-medium text-gray-900">~6 minutes</p>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">Episodes</h4>
        <div className="space-y-2">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Episode {video.episode}: {video.title}
                </p>
              </div>
              <span className="text-xs text-gray-400">{video.duration}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPublish}
        className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-lg"
      >
        <CheckCircle className="w-6 h-6" />
        Publish to Recovery Plan
      </button>
      <p className="text-xs text-center text-gray-500 mt-3">
        This will add the video episodes to your Recovery Plan dashboard
      </p>
    </div>
  )
}
