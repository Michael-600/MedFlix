import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Poke } from 'poke'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import { getPerplexityKey, perplexitySonarChat } from './perplexitySonar.js'
import { buildHeyGenPrompt, buildPerplexityDeepResearchPrompt, safePreview } from './heygenPrompt.js'
import { buildEpisodeContext, gatherClinicalData, clearContextCache } from './contextEngine.js'
import { searchClinicalData } from './clinicalSearch.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY
const PERPLEXITY_API_KEY = getPerplexityKey()
const POKE_API_KEY = process.env.POKE_API_KEY
const HEYGEN_DISABLED =
  String(process.env.HEYGEN_DISABLED || '').toLowerCase() === 'true' ||
  String(process.env.DISABLE_HEYGEN || '').toLowerCase() === 'true'
const HEYGEN_BASE = 'https://api.heygen.com'
const LIVEAVATAR_BASE = 'https://api.liveavatar.com'

// ─── Poke client ────────────────────────────────────────
const pokeClient = POKE_API_KEY ? new Poke({ apiKey: POKE_API_KEY }) : null

// ─── Helper ────────────────────────────────────────────
async function heygenFetch(path, opts = {}) {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': HEYGEN_API_KEY,
      ...opts.headers,
    },
  })
  return res.json()
}

async function liveAvatarFetch(path, opts = {}) {
  const res = await fetch(`${LIVEAVATAR_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': LIVEAVATAR_API_KEY,
      ...opts.headers,
    },
  })
  return res.json()
}

// Simple in-memory cache to avoid repeat Sonar calls during bulk generation
const sonarCache = new Map()
const SONAR_CACHE_TTL_MS = 10 * 60 * 1000

function getCachedSonar(key) {
  const item = sonarCache.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    sonarCache.delete(key)
    return null
  }
  return item.value
}

function setCachedSonar(key, value) {
  sonarCache.set(key, { value, expiresAt: Date.now() + SONAR_CACHE_TTL_MS })
}

// ═══════════════════════════════════════════════════════
//  HEYGEN  –  Care Video Generation
// ═══════════════════════════════════════════════════════

// List available avatars
app.get('/api/heygen/avatars', async (_req, res) => {
  try {
    const data = await heygenFetch('/v2/avatars')
    res.json(data)
  } catch (e) {
    console.error('avatars error:', e)
    res.status(500).json({ error: e.message })
  }
})

// List available voices
app.get('/api/heygen/voices', async (_req, res) => {
  try {
    const data = await heygenFetch('/v2/voices')
    res.json(data)
  } catch (e) {
    console.error('voices error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Generate video via Video Agent (prompt → video) — legacy endpoint
app.post('/api/heygen/generate-video', async (req, res) => {
  try {
    const {
      prompt: basePrompt,
      avatar_id,
      duration_sec,
      orientation,
      patient,
      episode,
      clinicalContext,
      // Legacy support: accept openEvidence too
      openEvidence,
      use_sonar,
      sonar_model,
      sonar_search_recency_filter,
    } = req.body

    const contextData = clinicalContext || openEvidence || null

    let sonar = null
    if (use_sonar && PERPLEXITY_API_KEY) {
      const sonarMessages = buildPerplexityDeepResearchPrompt({
        patient,
        episode,
        clinicalContext: contextData,
      })
      const cacheKey = JSON.stringify({
        model: sonar_model || 'sonar',
        search_recency_filter: sonar_search_recency_filter || 'month',
        messages: sonarMessages,
      })
      const cached = getCachedSonar(cacheKey)
      if (cached) {
        sonar = cached
      } else {
        const sonarResult = await perplexitySonarChat({
          apiKey: PERPLEXITY_API_KEY,
          model: sonar_model || 'sonar',
          messages: sonarMessages,
          search_recency_filter: sonar_search_recency_filter || 'month',
        })
        if (sonarResult.ok) {
          sonar = sonarResult.data
          setCachedSonar(cacheKey, sonar)
        } else {
          console.warn('[Perplexity] Sonar call failed:', sonarResult.error, safePreview(sonarResult.detail))
        }
      }
    }

    const prompt = buildHeyGenPrompt({
      basePrompt: basePrompt,
      patient,
      episode,
      clinicalContext: contextData,
      sonarResearch: sonar,
    })

    if (HEYGEN_DISABLED || !HEYGEN_API_KEY) {
      return res.json({
        data: {
          video_id: null,
        },
        error: HEYGEN_DISABLED ? 'heygen_disabled' : 'missing_heygen_api_key',
        medflix: {
          prompt,
          used_sonar: Boolean(use_sonar && PERPLEXITY_API_KEY && sonar?.content),
          sonar_model: use_sonar ? (sonar_model || 'sonar') : null,
          sonar_content: sonar?.content || null,
          sonar_preview: sonar?.content ? safePreview(sonar.content, 800) : null,
        },
      })
    }

    const body = { prompt }
    if (avatar_id || duration_sec || orientation) {
      body.config = {}
      if (avatar_id) body.config.avatar_id = avatar_id
      if (duration_sec) body.config.duration_sec = duration_sec
      if (orientation) body.config.orientation = orientation
    }
    const data = await heygenFetch('/v1/video_agent/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    res.json({
      ...data,
      medflix: {
        prompt,
        used_sonar: Boolean(use_sonar && PERPLEXITY_API_KEY && sonar?.content),
        sonar_model: use_sonar ? (sonar_model || 'sonar') : null,
        sonar_content: sonar?.content || null,
        sonar_preview: sonar?.content ? safePreview(sonar.content, 800) : null,
      },
    })
  } catch (e) {
    console.error('generate-video error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Generate video via structured V2 endpoint (avatar + script)
app.post('/api/heygen/generate-avatar-video', async (req, res) => {
  try {
    const { video_inputs, dimension, title, caption } = req.body
    const body = { video_inputs }
    if (dimension) body.dimension = dimension
    if (title) body.title = title
    if (caption !== undefined) body.caption = caption
    const data = await heygenFetch('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    res.json(data)
  } catch (e) {
    console.error('generate-avatar-video error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Check video generation status
app.get('/api/heygen/video-status/:videoId', async (req, res) => {
  try {
    const data = await heygenFetch(
      `/v1/video_status.get?video_id=${req.params.videoId}`
    )
    res.json(data)
  } catch (e) {
    console.error('video-status error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Get remaining quota
app.get('/api/heygen/quota', async (_req, res) => {
  try {
    const data = await heygenFetch('/v2/user/remaining_quota')
    res.json(data)
  } catch (e) {
    console.error('quota error:', e)
    res.status(500).json({ error: e.message })
  }
})

// List available HeyGen avatars
app.get('/api/heygen/avatars', async (_req, res) => {
  try {
    if (HEYGEN_DISABLED || !HEYGEN_API_KEY) {
      return res.json({ data: { avatars: [] }, error: 'heygen_disabled' })
    }
    const data = await heygenFetch('/v2/avatars')
    res.json(data)
  } catch (e) {
    console.error('avatars error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════
//  CONTEXT ENGINE  –  Clinical Data Aggregation
// ═══════════════════════════════════════════════════════

// Clear context engine cache (useful for demo resets)
app.post('/api/context/clear-cache', (_req, res) => {
  clearContextCache()
  res.json({ ok: true, message: 'Context cache cleared' })
})

// Build episode context from OpenFDA + DailyMed + Perplexity Sonar
app.post('/api/context/build', async (req, res) => {
  try {
    const { patient, episode, episodeNumber } = req.body
    if (!patient || !episode) {
      return res.status(400).json({ error: 'patient and episode are required' })
    }
    const result = await buildEpisodeContext({ patient, episode, episodeNumber })
    res.json(result)
  } catch (e) {
    console.error('context/build error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Gather raw clinical data only (without Perplexity synthesis)
app.post('/api/context/clinical-data', async (req, res) => {
  try {
    const { patient } = req.body
    if (!patient) {
      return res.status(400).json({ error: 'patient is required' })
    }
    const data = await gatherClinicalData(patient)
    res.json({ ok: true, data })
  } catch (e) {
    console.error('context/clinical-data error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════
//  CLINICAL + PERPLEXITY  –  Shared Context Endpoints
// ═══════════════════════════════════════════════════════

// Search ClinicalTrials.gov for clinical evidence
app.post('/api/clinical/search', async (req, res) => {
  try {
    const { diagnosis, patientName, episodeTitle, query } = req.body
    if (!diagnosis && !query) {
      return res.status(400).json({ error: 'diagnosis or query is required' })
    }
    const result = await searchClinicalData({ diagnosis, patientName, episodeTitle, query })
    res.json(result)
  } catch (e) {
    console.error('clinical/search error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Run Perplexity Sonar research query (cached 10min)
app.post('/api/perplexity/research', async (req, res) => {
  try {
    const { patient, episode, openEvidence } = req.body
    if (!patient) {
      return res.status(400).json({ error: 'patient is required' })
    }
    if (!PERPLEXITY_API_KEY) {
      return res.status(503).json({ ok: false, error: 'perplexity_not_configured' })
    }

    const sonarMessages = buildPerplexityDeepResearchPrompt({
      patient,
      episode,
      clinicalContext: openEvidence || null,
    })
    const cacheKey = JSON.stringify({ model: 'sonar', messages: sonarMessages })
    const cached = getCachedSonar(cacheKey)
    if (cached) {
      return res.json({ ok: true, data: cached })
    }

    const sonarResult = await perplexitySonarChat({
      apiKey: PERPLEXITY_API_KEY,
      model: 'sonar',
      messages: sonarMessages,
      search_recency_filter: 'month',
    })
    if (sonarResult.ok) {
      setCachedSonar(cacheKey, sonarResult.data)
      return res.json({ ok: true, data: sonarResult.data })
    }
    res.status(502).json({ ok: false, error: sonarResult.error, detail: sonarResult.detail })
  } catch (e) {
    console.error('perplexity/research error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Generate video via HeyGen Structured V2 API (avatar speaks scripted scenes)
app.post('/api/heygen/generate-structured-video', async (req, res) => {
  try {
    const {
      scenes,
      avatar_id,
      voice_id,
      title,
      dimension,
    } = req.body

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: 'scenes array is required' })
    }

    if (HEYGEN_DISABLED || !HEYGEN_API_KEY) {
      return res.json({
        data: { video_id: null },
        error: HEYGEN_DISABLED ? 'heygen_disabled' : 'missing_heygen_api_key',
      })
    }

    const defaultAvatarId = avatar_id || 'Angela-inTshirt-20220820'
    const defaultVoiceId = voice_id || '1bd001e7e50f421d891986aad5571571'

    const video_inputs = scenes.map((scene) => ({
      character: {
        type: 'avatar',
        avatar_id: scene.avatar_id || defaultAvatarId,
        avatar_style: scene.avatar_style || 'normal',
      },
      voice: {
        type: 'text',
        input_text: scene.script,
        voice_id: scene.voice_id || defaultVoiceId,
        speed: scene.speed || 1.0,
      },
      background: scene.background || { type: 'color', value: '#f0f4f8' },
    }))

    const body = {
      video_inputs,
      dimension: dimension || { width: 1280, height: 720 },
    }
    if (title) body.title = title

    const data = await heygenFetch('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    res.json(data)
  } catch (e) {
    console.error('generate-structured-video error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════
//  LIVEAVATAR  –  Real-time Streaming Avatar
// ═══════════════════════════════════════════════════════

// List public avatars
app.get('/api/liveavatar/avatars', async (_req, res) => {
  try {
    const data = await liveAvatarFetch('/v1/avatars/public?page_size=100')
    res.json(data)
  } catch (e) {
    console.error('liveavatar avatars error:', e)
    res.status(500).json({ error: e.message })
  }
})

// List voices
app.get('/api/liveavatar/voices', async (_req, res) => {
  try {
    const data = await liveAvatarFetch('/v1/voices?page_size=100')
    res.json(data)
  } catch (e) {
    console.error('liveavatar voices error:', e)
    res.status(500).json({ error: e.message })
  }
})

// List contexts
app.get('/api/liveavatar/contexts', async (_req, res) => {
  try {
    const data = await liveAvatarFetch('/v1/contexts')
    res.json(data)
  } catch (e) {
    console.error('liveavatar contexts error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Create a context (knowledge base for the avatar)
app.post('/api/liveavatar/contexts', async (req, res) => {
  try {
    const data = await liveAvatarFetch('/v1/contexts', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })
    res.json(data)
  } catch (e) {
    console.error('liveavatar create context error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Create session token (FULL mode)
app.post('/api/liveavatar/token', async (req, res) => {
  try {
    const {
      avatar_id,
      voice_id,
      context_id,
      language,
      quality,
      is_sandbox,
    } = req.body

    const payload = {
      mode: 'FULL',
      avatar_id: avatar_id || 'fc9c1f9f-bc99-4fd9-a6b2-8b4b5669a046', // Ann Doctor Sitting
      is_sandbox: is_sandbox ?? false,
      video_settings: {
        quality: quality || 'high',
        encoding: 'H264',
      },
      avatar_persona: {
        language: language || 'en',
      },
      interactivity_type: 'CONVERSATIONAL',
    }

    if (voice_id) payload.avatar_persona.voice_id = voice_id
    if (context_id) payload.avatar_persona.context_id = context_id

    const data = await liveAvatarFetch('/v1/sessions/token', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    res.json(data)
  } catch (e) {
    console.error('liveavatar token error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Start session (uses session JWT token)
app.post('/api/liveavatar/start', async (req, res) => {
  try {
    const { session_token } = req.body
    const response = await fetch(`${LIVEAVATAR_BASE}/v1/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session_token}`,
      },
    })
    const data = await response.json()
    res.json(data)
  } catch (e) {
    console.error('liveavatar start error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Stop session
app.post('/api/liveavatar/stop', async (req, res) => {
  try {
    const { session_id, session_token } = req.body
    const headers = { 'Content-Type': 'application/json' }
    if (session_token) {
      headers.Authorization = `Bearer ${session_token}`
    } else {
      headers['X-Api-Key'] = LIVEAVATAR_API_KEY
    }
    const response = await fetch(`${LIVEAVATAR_BASE}/v1/sessions/stop`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ session_id, reason: 'USER_CLOSED' }),
    })
    const data = await response.json()
    res.json(data)
  } catch (e) {
    console.error('liveavatar stop error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Keep alive
app.post('/api/liveavatar/keep-alive', async (req, res) => {
  try {
    const { session_id, session_token } = req.body
    const headers = { 'Content-Type': 'application/json' }
    if (session_token) {
      headers.Authorization = `Bearer ${session_token}`
    } else {
      headers['X-Api-Key'] = LIVEAVATAR_API_KEY
    }
    const response = await fetch(`${LIVEAVATAR_BASE}/v1/sessions/keep-alive`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ session_id }),
    })
    const data = await response.json()
    res.json(data)
  } catch (e) {
    console.error('liveavatar keep-alive error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Get session transcript
app.get('/api/liveavatar/transcript/:sessionId', async (req, res) => {
  try {
    const data = await liveAvatarFetch(
      `/v1/sessions/${req.params.sessionId}/transcript`
    )
    res.json(data)
  } catch (e) {
    console.error('liveavatar transcript error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Stop all active sessions (cleanup helper)
app.post('/api/liveavatar/stop-all', async (_req, res) => {
  try {
    // List active sessions
    const listData = await liveAvatarFetch('/v1/sessions?type=active')
    const sessions = listData?.data?.results || []

    if (sessions.length === 0) {
      return res.json({ stopped: 0, message: 'No active sessions' })
    }

    // Stop each active session
    const results = []
    for (const session of sessions) {
      try {
        const stopRes = await fetch(`${LIVEAVATAR_BASE}/v1/sessions/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': LIVEAVATAR_API_KEY,
          },
          body: JSON.stringify({
            session_id: session.session_id,
            reason: 'CLEANUP',
          }),
        })
        const stopData = await stopRes.json()
        results.push({ session_id: session.session_id, result: stopData.code })
      } catch (e) {
        results.push({ session_id: session.session_id, error: e.message })
      }
    }

    console.log(`Stopped ${results.length} active sessions`)
    res.json({ stopped: results.length, results })
  } catch (e) {
    console.error('liveavatar stop-all error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════
//  POKE  –  Medication Reminders & Patient Messaging
// ═══════════════════════════════════════════════════════

// In-memory store: patientId → { name, diagnosis, medications[] }
const medicationStore = new Map()

// ─── Helper: set up Poke with medication reminders ───────
// Called once on registration and whenever medications change.
// Poke becomes an intelligent assistant that schedules reminders natively
// and uses MCP tools for personalized context.
async function pokeSetupReminders(record) {
  if (!pokeClient) throw new Error('poke_not_configured')

  const meds = (record.medications || []).filter(m => m.active)
  const medList = meds.length > 0
    ? meds.map(m => `- ${m.name} ${m.dosage} at ${m.times?.join(', ') || 'morning'}${m.instructions ? ` — ${m.instructions}` : ''}`).join('\n')
    : '(No medications scheduled yet)'

  const instruction = [
    `I'm ${record.name}, managing ${record.diagnosis || 'my health'}.`,
    record.phoneNumber ? `My phone number is ${record.phoneNumber}.` : null,
    `Please set up daily medication reminders for me:`,
    medList,
    `When reminding me, use the MedFlix tools (get_medication_schedule, get_patient_context) to give personalized context about my condition.`,
    `Keep reminders warm, encouraging, and under 300 characters.`,
    `Do not use personal history or prior conversations — use ONLY MCP tools for context.`,
  ].filter(Boolean).join('\n')

  console.log(`[Poke] setupReminders for ${record.name}: ${meds.length} medications`)
  const result = await pokeClient.sendMessage(instruction)
  console.log(`[Poke] setupReminders result:`, result)
  return result
}

// ─── Helper: nudge Poke to send an immediate reminder ────
// Used by the "Send Test Reminder" button.
async function pokeNudge(record, medicationName) {
  if (!pokeClient) throw new Error('poke_not_configured')

  const parts = [
    `Can you send me a medication reminder right now?`,
    `Use the MedFlix tools to check my current schedule and give me an encouraging, personalized reminder.`,
  ]
  if (medicationName) {
    parts.push(`Focus on: ${medicationName}`)
  }

  const message = parts.join(' ')
  console.log(`[Poke] nudge for ${record.name}${medicationName ? ` (${medicationName})` : ''}`)
  const result = await pokeClient.sendMessage(message)
  console.log(`[Poke] nudge result:`, result)
  return result
}

// Register a patient for reminders
app.post('/api/poke/register', async (req, res) => {
  try {
    const { name, userId, diagnosis, phoneNumber } = req.body
    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }
    if (!pokeClient) {
      return res.status(503).json({ error: 'poke_not_configured' })
    }

    const patientId = `patient_${userId || Date.now()}`
    medicationStore.set(patientId, {
      name,
      patientId,
      userId,
      diagnosis: diagnosis || null,
      phoneNumber: phoneNumber || null,
      medications: [],
    })

    // Set up Poke as intelligent medication assistant
    try {
      await pokeSetupReminders(medicationStore.get(patientId))
    } catch (e) {
      console.warn('[Register] Poke setup failed:', e.message)
    }

    res.json({ ok: true, patientId })
  } catch (e) {
    console.error('register error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Get patient status and medications
app.get('/api/poke/status/:patientId', (req, res) => {
  const record = medicationStore.get(req.params.patientId)
  if (!record) {
    return res.status(404).json({ error: 'patient not found' })
  }
  res.json(record)
})

// Sync medications for a patient
app.post('/api/poke/medications', async (req, res) => {
  try {
    const { patientId, medications } = req.body
    if (!patientId || !medications) {
      return res.status(400).json({ error: 'patientId and medications are required' })
    }

    const record = medicationStore.get(patientId)
    if (!record) {
      return res.status(404).json({ error: 'patient not registered' })
    }

    record.medications = medications
    medicationStore.set(patientId, record)

    // Re-sync Poke's reminders with updated medications
    try {
      if (pokeClient) {
        await pokeSetupReminders(record)
      }
    } catch (e) {
      console.warn('[Medications] Poke sync failed:', e.message)
    }

    res.json({ ok: true, medicationCount: medications.length })
  } catch (e) {
    console.error('medications error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Send a reminder to a patient
app.post('/api/poke/send-reminder', async (req, res) => {
  try {
    const { patientId, medicationName } = req.body
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' })
    }
    if (!pokeClient) {
      return res.status(503).json({ error: 'poke_not_configured' })
    }

    const record = medicationStore.get(patientId)
    if (!record) {
      return res.status(404).json({ error: 'patient not registered' })
    }

    await pokeNudge(record, medicationName || null)

    res.json({ ok: true, message: 'Reminder sent via Poke' })
  } catch (e) {
    console.error('send-reminder error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Unregister a patient
app.delete('/api/poke/unregister/:patientId', (req, res) => {
  const deleted = medicationStore.delete(req.params.patientId)
  res.json({ ok: true, deleted })
})

// Log medication adherence
app.post('/api/poke/log-adherence', (req, res) => {
  const { patientId, medicationName, time, takenAt } = req.body
  if (!patientId || !medicationName) {
    return res.status(400).json({ error: 'patientId and medicationName are required' })
  }
  const record = medicationStore.get(patientId)
  if (!record) {
    return res.status(404).json({ error: 'patient not found' })
  }
  if (!record.adherenceLog) record.adherenceLog = []
  record.adherenceLog.push({ medicationName, time, takenAt: takenAt || new Date().toISOString() })
  res.json({ ok: true })
})

// Recovery event notification (when patient completes an episode)
app.post('/api/poke/recovery-event', (req, res) => {
  const { patientId, dayNumber, dayTitle, nextDayTitle } = req.body
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  const record = medicationStore.get(patientId)
  if (!record) {
    return res.json({ ok: true, delivered: false, reason: 'patient not registered' })
  }

  const message = nextDayTitle
    ? `Great job ${record.name}! 🎉 You completed Day ${dayNumber}: "${dayTitle}". Next up: "${nextDayTitle}".`
    : `Congratulations ${record.name}! 🎉 You completed all episodes! You're a champion.`

  console.log(`[Poke] Recovery event for ${record.name}: Day ${dayNumber} complete`)
  res.json({ ok: true, delivered: true, message })
})

// ═══════════════════════════════════════════════════════
//  MCP SERVER  –  Streamable HTTP (inline)
// ═══════════════════════════════════════════════════════

function registerMcpTools(mcpServer) {
  mcpServer.tool(
    'get_patient_context',
    'Fetches clinical + Perplexity research context for a patient diagnosis.',
    {
      patientName: z.string().describe("Patient's name"),
      diagnosis: z.string().describe('Patient diagnosis'),
      topic: z.string().optional().describe('Optional focus topic'),
    },
    async ({ patientName, diagnosis, topic }) => {
      try {
        const clinical = await fetch(`http://localhost:${PORT}/api/clinical/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnosis, patientName, episodeTitle: topic }),
        }).then(r => r.json())

        const openEvidence = clinical.ok ? clinical.data : null

        const perplexity = await fetch(`http://localhost:${PORT}/api/perplexity/research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: { name: patientName, diagnosis },
            episode: { title: topic || `${diagnosis} medication management` },
            openEvidence,
          }),
        }).then(r => r.json())

        const sonarContent = perplexity.ok ? perplexity.data?.content : null
        const sections = [`## Patient: ${patientName}`, `## Diagnosis: ${diagnosis}`]
        if (topic) sections.push(`## Focus: ${topic}`)
        if (openEvidence?.summary) {
          sections.push(`\n### Clinical Evidence\n${openEvidence.summary}`)
        }
        if (sonarContent) {
          sections.push(`\n### Latest Research\n${sonarContent}`)
        }
        return { content: [{ type: 'text', text: sections.join('\n') }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  mcpServer.tool(
    'get_medication_schedule',
    "Returns a patient's current medication list.",
    { patientId: z.string().describe('Patient ID') },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: 'Patient not found.' }] }
      const meds = (record.medications || []).filter(m => m.active)
      if (meds.length === 0) return { content: [{ type: 'text', text: `${record.name} has no medications.` }] }
      const list = meds.map(m => `- ${m.name} ${m.dosage} at ${m.times?.join(', ') || 'unscheduled'}: ${m.instructions || 'no special instructions'}`).join('\n')
      return { content: [{ type: 'text', text: `Medications for ${record.name}:\n${list}` }] }
    }
  )

  mcpServer.tool(
    'get_recovery_plan',
    "Returns a patient's recovery plan if stored.",
    { patientId: z.string().describe('Patient ID') },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: 'Patient not found.' }] }
      if (!record.recoveryPlan) return { content: [{ type: 'text', text: `No recovery plan stored for ${record.name}.` }] }
      return { content: [{ type: 'text', text: JSON.stringify(record.recoveryPlan, null, 2) }] }
    }
  )

  mcpServer.tool(
    'log_medication_taken',
    'Records that a patient took a medication.',
    {
      patientId: z.string().describe('Patient ID'),
      medicationName: z.string().describe('Medication name'),
    },
    async ({ patientId, medicationName }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: 'Patient not found.' }] }
      const med = record.medications?.find(m => m.name.toLowerCase() === medicationName.toLowerCase())
      if (!med) return { content: [{ type: 'text', text: `Medication "${medicationName}" not found.` }] }
      if (!record.adherenceLog) record.adherenceLog = []
      const takenAt = new Date().toISOString()
      record.adherenceLog.push({ medicationName: med.name, time: null, takenAt })
      return { content: [{ type: 'text', text: `Logged: ${record.name} took ${med.name} (${med.dosage}) at ${new Date(takenAt).toLocaleTimeString()}.` }] }
    }
  )

  mcpServer.tool(
    'get_adherence_summary',
    "Returns today's adherence summary for a patient.",
    { patientId: z.string().describe('Patient ID') },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: 'Patient not found.' }] }
      const today = new Date().toISOString().slice(0, 10)
      const todayLogs = (record.adherenceLog || []).filter(l => l.takenAt?.startsWith(today))
      const activeMeds = (record.medications || []).filter(m => m.active)
      const totalDoses = activeMeds.reduce((sum, m) => sum + (m.times?.length || 1), 0)
      const takenNames = [...new Set(todayLogs.map(l => l.medicationName))]
      return {
        content: [{
          type: 'text',
          text: `Adherence for ${record.name} (${today}):\n- Taken: ${todayLogs.length}/${totalDoses} doses\n- Medications logged: ${takenNames.join(', ') || 'none'}\n- Active medications: ${activeMeds.map(m => m.name).join(', ')}`,
        }],
      }
    }
  )

  mcpServer.tool(
    'send_reminder',
    'Sends a medication reminder via Poke.',
    {
      patientId: z.string().describe('Patient ID'),
      medicationName: z.string().optional().describe('Specific medication or omit for all'),
    },
    async ({ patientId, medicationName }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: 'Patient not found.' }] }
      try {
        await pokeNudge(record, medicationName || null)
        return { content: [{ type: 'text', text: 'Reminder sent via Poke.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed: ${e.message}` }] }
      }
    }
  )

  mcpServer.tool(
    'lookup_patient',
    'Finds a patient by name.',
    { name: z.string().describe('Patient name to search for') },
    async ({ name }) => {
      const lower = name.toLowerCase()
      for (const [id, record] of medicationStore) {
        if (record.name.toLowerCase().includes(lower)) {
          return { content: [{ type: 'text', text: `Found: ${record.name} (ID: ${id}, diagnosis: ${record.diagnosis || 'unknown'})` }] }
        }
      }
      return { content: [{ type: 'text', text: `No patient matching "${name}" found.` }] }
    }
  )
}

// Create and configure MCP server instance
const mcpServer = new McpServer({ name: 'MedFlix', version: '1.0.0' })
registerMcpTools(mcpServer)

// Streamable HTTP transport — one per session
const mcpTransports = new Map()

app.post('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id']
    let transport = sessionId ? mcpTransports.get(sessionId) : null
    if (!transport) {
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => `mcp_${Date.now()}` })
      await mcpServer.connect(transport)
      mcpTransports.set(transport.sessionId, transport)
    }
    await transport.handleRequest(req, res)
  } catch (e) {
    console.error('MCP POST error:', e)
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
})

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id']
  const transport = sessionId ? mcpTransports.get(sessionId) : null
  if (!transport) return res.status(400).json({ error: 'No active MCP session' })
  await transport.handleRequest(req, res)
})

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id']
  const transport = sessionId ? mcpTransports.get(sessionId) : null
  if (!transport) return res.status(400).json({ error: 'No active MCP session' })
  await transport.handleRequest(req, res)
  mcpTransports.delete(sessionId)
})

// ═══════════════════════════════════════════════════════
//  Root + Health check
// ═══════════════════════════════════════════════════════
app.get('/', (_req, res) => {
  res.json({ name: 'MedFlix API', version: '1.0.0', status: 'running' })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    heygen: !!HEYGEN_API_KEY,
    heygen_disabled: HEYGEN_DISABLED,
    liveavatar: !!LIVEAVATAR_API_KEY,
    perplexity: !!PERPLEXITY_API_KEY,
    poke: !!POKE_API_KEY,
    mcp: true,
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`MedFlix API server running on http://localhost:${PORT}`)
  console.log(`  HeyGen key: ${HEYGEN_API_KEY ? '***' + HEYGEN_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  LiveAvatar key: ${LIVEAVATAR_API_KEY ? '***' + LIVEAVATAR_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Perplexity key: ${PERPLEXITY_API_KEY ? '***' + PERPLEXITY_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Poke key: ${POKE_API_KEY ? '***' + POKE_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  MCP endpoint: http://localhost:${PORT}/mcp`)
})
