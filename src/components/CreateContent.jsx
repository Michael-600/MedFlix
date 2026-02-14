import { useState } from 'react'
import { visualStyles, defaultRecoveryPlan } from '../data/mockData'
import {
  Palette, Users, Upload, Film, CheckCircle, PenLine,
  Plus, FileText, Image as ImageIcon, X, Trash2,
} from 'lucide-react'

const STEPS = [
  { id: 'setup', label: 'Setup', icon: Palette },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
]

export default function CreateContent({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('friends')
  const [customDescription, setCustomDescription] = useState('')
  const [characters, setCharacters] = useState([])
  const [materials, setMaterials] = useState([])
  const [videos, setVideos] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

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

  const handleGenerateVideos = () => {
    if (materials.length === 0) return
    setIsGenerating(true)
    setGenerationProgress(0)

    const interval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          // Generate mock videos
          setVideos([
            {
              id: '1',
              episode: 1,
              title: 'Introduction',
              description: 'Meet Dr. Sarah as she welcomes you and introduces your diagnosis in a clear, compassionate way.',
              duration: '45s',
              thumbnail: '🎬',
            },
            {
              id: '2',
              episode: 2,
              title: 'Understanding Your Condition',
              description: 'An animated explainer breaking down the medical terminology into simple, visual concepts.',
              duration: '60s',
              thumbnail: '📚',
            },
            {
              id: '3',
              episode: 3,
              title: 'Treatment Overview',
              description: 'A visual walkthrough of the treatment plan with clear timelines and milestones.',
              duration: '50s',
              thumbnail: '💊',
            },
            {
              id: '4',
              episode: 4,
              title: 'What to Expect',
              description: 'Practical day-to-day guidance for what patients should prepare for.',
              duration: '55s',
              thumbnail: '📋',
            },
            {
              id: '5',
              episode: 5,
              title: 'Home Care Guide',
              description: 'Step-by-step instructions for managing your recovery at home.',
              duration: '50s',
              thumbnail: '🏠',
            },
            {
              id: '6',
              episode: 6,
              title: 'Warning Signs',
              description: 'Learn what symptoms to watch for and when to contact your care team.',
              duration: '40s',
              thumbnail: '⚠️',
            },
            {
              id: '7',
              episode: 7,
              title: 'Recovery Milestones',
              description: 'Track your progress and celebrate your recovery journey.',
              duration: '30s',
              thumbnail: '🎯',
            },
          ])
          setCurrentStep(1)
          return 100
        }
        return p + 1
      })
    }, 80)
  }

  const handleComplete = () => {
    setCurrentStep(2)
  }

  const handlePublish = () => {
    // Create recovery plan from generated videos
    const newPlan = {
      ...defaultRecoveryPlan,
      patientName: 'Patient',
      diagnosis: 'Custom Patient Education',
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
        videoUrl: null,
        episodeTitle: `Episode ${idx + 1}: ${video.title}`,
      })),
    }

    if (onComplete) {
      onComplete(newPlan)
    }
    
    // Reset for next time
    setCurrentStep(0)
    setSelectedStyle('friends')
    setCustomDescription('')
    setCharacters([])
    setMaterials([])
    setVideos([])
    setIsGenerating(false)
    setGenerationProgress(0)
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
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
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
  selectedStyle, onSelectStyle,
  customDescription, onCustomDescription,
  characters, onAddCharacter, onUpdateCharacter, onRemoveCharacter, onCharacterImage,
  materials, onAddMaterial, onRemoveMaterial,
  onGenerate, isGenerating, generationProgress,
}) {
  return (
    <div className="space-y-8">
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
              <p className="text-sm font-medium text-gray-700">Generating videos...</p>
              <p className="text-sm text-medflix-accent font-medium">{generationProgress}%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-medflix-accent h-2 rounded-full transition-all duration-200"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Creating personalized video episodes from your medical documents...
            </p>
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
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-medflix-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-medflix-accent" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Generated Video Episodes</h3>
        <p className="text-gray-500">
          Review your {videos.length} personalized video episodes in <strong>{style?.name}</strong> style
        </p>
      </div>

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
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Ready</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3.5 bg-medflix-accent text-white rounded-xl font-semibold hover:bg-medflix-accentLight transition-colors flex items-center justify-center gap-2"
      >
        Continue to Complete
        <CheckCircle className="w-5 h-5" />
      </button>
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
