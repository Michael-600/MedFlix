import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { visualStyles } from '../data/mockData'
import {
  Heart, RotateCcw, ChevronLeft, ChevronRight,
  Palette, Users, Upload, Film, CheckCircle,
  PenLine, Trash2, Plus, FileText, Image as ImageIcon, X,
} from 'lucide-react'

const STEPS = [
  { id: 'setup', label: 'Setup', icon: Palette },
  { id: 'storyboard', label: 'Storyboard', icon: PenLine },
  { id: 'references', label: 'References', icon: FileText },
  { id: 'videos', label: 'Videos', icon: Film, sublabel: 'Generate scenes' },
  { id: 'complete', label: 'Complete', icon: CheckCircle, sublabel: 'Merge & finalize' },
]

export default function Workbench() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('friends')
  const [customDescription, setCustomDescription] = useState('')
  const [characters, setCharacters] = useState([])
  const [materials, setMaterials] = useState([])
  const [storyboard, setStoryboard] = useState([])
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
    // Simulate file upload with a placeholder
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const color = colors[Math.floor(Math.random() * colors.length)]
    handleUpdateCharacter(id, 'imagePreview', color)
  }

  const handleAddMaterial = () => {
    // Simulate PDF upload
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

  const handleGenerateStoryboard = () => {
    if (materials.length === 0) return
    setIsGenerating(true)
    setGenerationProgress(0)

    const interval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          // Generate mock storyboard
          setStoryboard([
            {
              id: '1',
              scene: 1,
              title: 'Introduction',
              description: 'Meet Dr. Sarah as she welcomes you and introduces your diagnosis in a clear, compassionate way.',
              dialogue: '"Hello! I\'m Dr. Sarah, and today we\'re going to talk about your health journey together. Don\'t worry — we\'ll take this one step at a time."',
              duration: '45s',
            },
            {
              id: '2',
              scene: 2,
              title: 'Understanding Your Condition',
              description: 'An animated explainer breaking down the medical terminology into simple, visual concepts.',
              dialogue: '"Think of your body like a garden. Sometimes a weed grows that doesn\'t belong. Our job is to identify it and create a plan to remove it safely."',
              duration: '60s',
            },
            {
              id: '3',
              scene: 3,
              title: 'Treatment Overview',
              description: 'A visual walkthrough of the treatment plan with clear timelines and milestones.',
              dialogue: '"Your treatment will happen in phases. Each phase builds on the last, and we\'ll check in regularly to make sure everything is on track."',
              duration: '50s',
            },
            {
              id: '4',
              scene: 4,
              title: 'What to Expect',
              description: 'Practical day-to-day guidance for what patients should prepare for.',
              dialogue: '"In the coming days, you might feel tired or a bit sore. That\'s completely normal. Here are some things that can help..."',
              duration: '55s',
            },
            {
              id: '5',
              scene: 5,
              title: 'Knowledge Check',
              description: 'Interactive quiz checkpoint to reinforce key concepts from the episode.',
              dialogue: '"Before we wrap up, let\'s make sure we covered everything. I\'ll ask you a few quick questions!"',
              duration: '30s',
            },
            {
              id: '6',
              scene: 6,
              title: 'Closing & Preview',
              description: 'Encouraging wrap-up with a preview of tomorrow\'s episode.',
              dialogue: '"Great job today! Tomorrow, we\'ll talk about managing your care at home. See you then!"',
              duration: '20s',
            },
          ])
          setCurrentStep(1)
          return 100
        }
        return p + 2
      })
    }, 80)
  }

  const handleGenerateVideos = () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    const interval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          setCurrentStep(4)
          return 100
        }
        return p + 1
      })
    }, 100)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedStyle('friends')
    setCustomDescription('')
    setCharacters([])
    setMaterials([])
    setStoryboard([])
    setIsGenerating(false)
    setGenerationProgress(0)
  }

  return (
    <div className="h-screen bg-medflix-bg flex flex-col overflow-hidden">
      {/* Workbench Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            <span className="text-medflix-accent">MedFlix</span>{' '}
            <span className="font-extrabold">Workbench</span>
          </h1>
          <p className="text-sm text-gray-500">Create and refine patient education content</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r p-5 overflow-y-auto flex-shrink-0">
          {/* Visual Style Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-medflix-accent" />
              <h3 className="font-semibold text-sm text-gray-900">Visual Style</h3>
            </div>
            {activeStyle && (
              <>
                <p className="text-sm font-medium text-gray-800 mb-2">{activeStyle.name}</p>
                <div className="flex gap-1.5 mb-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: activeStyle.color + '15' }}
                    >
                      {activeStyle.preview}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                  {activeStyle.description || 'Custom style — define your own visual direction'}
                </p>
              </>
            )}
          </div>

          {/* Characters Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-medflix-accent" />
              <h3 className="font-semibold text-sm text-gray-900">Characters</h3>
            </div>
            {characters.length === 0 ? (
              <p className="text-xs text-gray-400">No characters added</p>
            ) : (
              <div className="space-y-2">
                {characters.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 text-xs font-bold border-2 border-gray-700"
                      style={{ backgroundColor: c.imagePreview || '#d1d5db' }}
                    >
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {c.name || 'Unnamed'}
                      </p>
                      <p className="text-[10px] text-gray-400">{c.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materials Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-medflix-accent" />
              <h3 className="font-semibold text-sm text-gray-900">Materials</h3>
            </div>
            {materials.length === 0 ? (
              <p className="text-xs text-gray-400">No materials uploaded</p>
            ) : (
              <div className="space-y-2">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{m.name}</span>
                    <span className="text-gray-400 flex-shrink-0">{m.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8">
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
              onGenerate={handleGenerateStoryboard}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
            />
          )}

          {currentStep === 1 && (
            <StoryboardStep
              storyboard={storyboard}
              onUpdateScene={(id, field, value) =>
                setStoryboard((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
                )
              }
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <ReferencesStep
              materials={materials}
              onAddMaterial={handleAddMaterial}
              onRemoveMaterial={handleRemoveMaterial}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <VideosStep
              storyboard={storyboard}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              onGenerate={handleGenerateVideos}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <CompleteStep
              storyboard={storyboard}
              style={activeStyle}
              characters={characters}
              onPublish={() => {
                navigate('/portal')
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </main>
      </div>

      {/* Step Navigation */}
      <footer className="bg-white border-t px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                if (i <= currentStep || (i === 1 && storyboard.length > 0)) {
                  setCurrentStep(i)
                }
              }}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${
                i === currentStep
                  ? 'text-medflix-accent'
                  : i < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              } ${i <= currentStep || (i === 1 && storyboard.length > 0) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === currentStep
                    ? 'bg-medflix-accent/10 text-medflix-accent'
                    : i < currentStep
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-medium">{step.label}</span>
              {step.sublabel && (
                <span className="text-[10px] text-gray-400">{step.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      </footer>
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
    <div className="max-w-3xl space-y-10">
      {/* Visual Style */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Visual Style</h2>
        <p className="text-sm text-gray-500 mb-5">
          Choose a visual style for your patient education videos or customize your own
        </p>

        <h3 className="text-sm font-medium text-gray-700 mb-3">Select a Preset Style</h3>
        <div className="grid grid-cols-4 gap-3 mb-6">
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

        <h3 className="text-sm font-medium text-gray-700 mb-2">Style Description</h3>
        <textarea
          value={selectedStyle === 'custom' ? customDescription : (visualStyles.find(s => s.id === selectedStyle)?.description || '')}
          onChange={(e) => {
            if (selectedStyle === 'custom') onCustomDescription(e.target.value)
          }}
          readOnly={selectedStyle !== 'custom'}
          placeholder={selectedStyle === 'custom' ? 'Describe your desired visual style...' : ''}
          className={`w-full h-32 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all ${
            selectedStyle !== 'custom' ? 'bg-gray-50 text-gray-600' : 'bg-white'
          }`}
        />
      </section>

      {/* Characters */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Characters</h2>
        <p className="text-sm text-gray-500 mb-5">
          Add characters for your education videos. Upload reference images to personalize.
        </p>

        <div className="space-y-3 mb-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl"
            >
              <button
                onClick={() => onCharacterImage(char.id)}
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-300 hover:border-medflix-accent transition-colors cursor-pointer overflow-hidden"
                style={char.imagePreview ? { backgroundColor: char.imagePreview, borderStyle: 'solid', borderColor: char.imagePreview } : {}}
              >
                {char.imagePreview ? (
                  <span className="text-gray-900 text-lg font-bold">
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

        <button
          onClick={onAddCharacter}
          className="flex items-center gap-2 px-4 py-2.5 border-3 border-dashed border-gray-400 text-gray-800 rounded-xl hover:border-medflix-accent hover:text-medflix-accent hover:bg-purple-50 transition-all text-sm font-bold w-full justify-center shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Character
        </button>
      </section>

      {/* Materials */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Materials</h2>
        <p className="text-sm text-gray-500 mb-5">
          Upload medical PDFs, discharge summaries, lab results, or treatment plans
        </p>

        {materials.length > 0 && (
          <div className="space-y-2 mb-4">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl"
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
          className="flex items-center gap-2 px-4 py-2.5 border-3 border-dashed border-gray-400 text-gray-800 rounded-xl hover:border-medflix-accent hover:text-medflix-accent hover:bg-purple-50 transition-all text-sm font-bold w-full justify-center shadow-sm"
        >
          <Upload className="w-5 h-5" />
          Upload PDF / Document
        </button>
      </section>

      {/* Generate Button */}
      <div className="pt-4">
        {isGenerating ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Generating storyboard...</p>
              <p className="text-sm text-medflix-accent font-medium">{generationProgress}%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-medflix-accent h-2 rounded-full transition-all duration-200"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Analyzing medical documents and creating personalized storyboard...
            </p>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            disabled={materials.length === 0}
            className="w-full py-3.5 bg-medflix-accent text-gray-900 rounded-xl font-bold hover:bg-medflix-accentLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-3 border-purple-700"
          >
            <Film className="w-5 h-5" />
            Generate Storyboard
          </button>
        )}
        {materials.length === 0 && !isGenerating && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Upload at least one medical document to generate a storyboard
          </p>
        )}
      </div>
    </div>
  )
}

// ----- Storyboard Step -----
function StoryboardStep({ storyboard, onUpdateScene, onNext }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review Storyboard</h2>
      <p className="text-sm text-gray-500 mb-6">
        Review and edit the AI-generated storyboard for your patient education episode
      </p>

      <div className="space-y-4 mb-8">
        {storyboard.map((scene) => (
          <div key={scene.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-medflix-accent/10 rounded-lg flex items-center justify-center text-medflix-accent text-sm font-bold">
                  {scene.scene}
                </div>
                <input
                  type="text"
                  value={scene.title}
                  onChange={(e) => onUpdateScene(scene.id, 'title', e.target.value)}
                  className="font-semibold text-gray-900 border-none outline-none bg-transparent"
                />
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {scene.duration}
              </span>
            </div>
            <textarea
              value={scene.description}
              onChange={(e) => onUpdateScene(scene.id, 'description', e.target.value)}
              className="w-full text-sm text-gray-600 mb-3 border border-gray-100 rounded-lg p-2 resize-none focus:border-medflix-accent outline-none"
              rows={2}
            />
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Dialogue</p>
              <textarea
                value={scene.dialogue}
                onChange={(e) => onUpdateScene(scene.id, 'dialogue', e.target.value)}
                className="w-full text-sm text-gray-700 italic bg-transparent border-none outline-none resize-none"
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-medflix-accent text-gray-900 rounded-xl font-bold hover:bg-medflix-accentLight transition-colors border-2 border-purple-700"
        >
          Continue to References
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ----- References Step -----
function ReferencesStep({ materials, onAddMaterial, onRemoveMaterial, onNext, onBack }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Reference Materials</h2>
      <p className="text-sm text-gray-500 mb-6">
        Review uploaded materials and add additional references for accuracy
      </p>

      <div className="space-y-3 mb-6">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl"
          >
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{mat.name}</p>
              <p className="text-xs text-gray-400">{mat.size} &bull; Uploaded</p>
            </div>
            <button
              onClick={() => onRemoveMaterial(mat.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddMaterial}
        className="flex items-center gap-2 px-4 py-2.5 border-3 border-dashed border-gray-400 text-gray-800 rounded-xl hover:border-medflix-accent hover:text-medflix-accent hover:bg-purple-50 transition-all text-sm font-bold w-full justify-center mb-8 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Add Reference Material
      </button>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Storyboard
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-medflix-accent text-gray-900 rounded-xl font-bold hover:bg-medflix-accentLight transition-colors border-2 border-purple-700"
        >
          Generate Videos
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ----- Videos Step -----
function VideosStep({ storyboard, isGenerating, generationProgress, onGenerate, onBack }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Generate Video Scenes</h2>
      <p className="text-sm text-gray-500 mb-6">
        Generate individual video scenes from your storyboard
      </p>

      {!isGenerating && generationProgress === 0 && (
        <>
          <div className="space-y-3 mb-8">
            {storyboard.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <Film className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Scene {scene.scene}: {scene.title}
                  </p>
                  <p className="text-xs text-gray-500">{scene.duration}</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Pending
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to References
            </button>
            <button
              onClick={onGenerate}
              className="flex items-center gap-2 px-6 py-3 bg-medflix-accent text-gray-900 rounded-xl font-bold hover:bg-medflix-accentLight transition-colors border-2 border-purple-700"
            >
              <Film className="w-5 h-5" />
              Generate All Scenes
            </button>
          </div>
        </>
      )}

      {isGenerating && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-medflix-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-medflix-accent animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Videos</h3>
          <p className="text-sm text-gray-500 mb-6">
            Creating personalized video scenes from your storyboard...
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Scene {Math.min(Math.ceil(generationProgress / (100 / storyboard.length)), storyboard.length)} of {storyboard.length}
              </p>
              <p className="text-sm font-medium text-medflix-accent">{generationProgress}%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-medflix-accent h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----- Complete Step -----
function CompleteStep({ storyboard, style, characters, onPublish, onBack }) {
  return (
    <div className="max-w-3xl">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Ready!</h2>
        <p className="text-gray-500">
          Your patient education episode has been generated and is ready to publish
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Episode Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Visual Style</p>
            <p className="font-medium text-gray-900">{style?.name || 'Custom'}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Scenes</p>
            <p className="font-medium text-gray-900">{storyboard.length} scenes</p>
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
            <p className="text-gray-500">Estimated Duration</p>
            <p className="font-medium text-gray-900">~5 minutes</p>
          </div>
        </div>
      </div>

      {/* Scene list */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Scenes</h3>
        <div className="space-y-3">
          {storyboard.map((scene) => (
            <div key={scene.id} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Scene {scene.scene}: {scene.title}
                </p>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                Ready
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Videos
        </button>
        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-gray-900 rounded-xl font-bold hover:bg-green-700 transition-colors border-3 border-green-800"
        >
          <CheckCircle className="w-5 h-5" />
          Publish to Patient Portal
        </button>
      </div>
    </div>
  )
}
