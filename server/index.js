import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Poke } from 'poke'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getPerplexityKey, perplexitySonarChat } from './perplexitySonar.js'
import { buildHeyGenPrompt, buildPerplexityDeepResearchPrompt, safePreview } from './heygenPrompt.js'
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

// Generate video via Video Agent (prompt → video)
app.post('/api/heygen/generate-video', async (req, res) => {
  try {
    const {
      prompt: basePrompt,
      avatar_id,
      duration_sec,
      orientation,
      patient,
      episode,
      openEvidence,
      use_sonar,
      sonar_model,
      sonar_search_recency_filter,
    } = req.body

    let sonar = null
    if (use_sonar && PERPLEXITY_API_KEY) {
      const sonarMessages = buildPerplexityDeepResearchPrompt({
        patient,
        episode,
        openEvidence,
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
      openEvidence,
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
      is_sandbox,
    } = req.body

    const payload = {
      mode: 'FULL',
      avatar_id: avatar_id || 'fc9c1f9f-bc99-4fd9-a6b2-8b4b5669a046', // Ann Doctor Sitting
      is_sandbox: is_sandbox ?? false,
      video_settings: {
        quality: 'high',
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
//  CLINICAL + PERPLEXITY  –  Shared context endpoints
// ═══════════════════════════════════════════════════════

// Search ClinicalTrials.gov for a diagnosis / topic
app.post('/api/clinical/search', async (req, res) => {
  try {
    const { diagnosis, episodeTitle, dayTitle, patientName, query, pageSize } = req.body
    if (!diagnosis && !query) {
      return res.status(400).json({ error: 'diagnosis or query is required' })
    }
    const result = await searchClinicalData({ diagnosis, episodeTitle, dayTitle, patientName, query, pageSize })
    res.json(result)
  } catch (e) {
    console.error('clinical search error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Run a Perplexity Sonar research query for a patient
app.post('/api/perplexity/research', async (req, res) => {
  if (!PERPLEXITY_API_KEY) {
    return res.status(503).json({ ok: false, error: 'perplexity_not_configured' })
  }
  try {
    const { patient, episode, openEvidence, model, search_recency_filter } = req.body
    if (!patient?.diagnosis) {
      return res.status(400).json({ error: 'patient.diagnosis is required' })
    }

    const messages = buildPerplexityDeepResearchPrompt({ patient, episode, openEvidence })
    const cacheKey = JSON.stringify({ model: model || 'sonar', search_recency_filter: search_recency_filter || 'month', messages })

    const cached = getCachedSonar(cacheKey)
    if (cached) {
      return res.json({ ok: true, data: cached, cached: true })
    }

    const result = await perplexitySonarChat({
      apiKey: PERPLEXITY_API_KEY,
      model: model || 'sonar',
      messages,
      search_recency_filter: search_recency_filter || 'month',
    })

    if (result.ok) {
      setCachedSonar(cacheKey, result.data)
    }
    res.json(result)
  } catch (e) {
    console.error('perplexity research error:', e)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════
//  MEDICATION REMINDERS  –  Poke-powered messaging
//  Poke agent = crafts & delivers messages via iMessage/Telegram/SMS
//  MCP tools  = provide patient context to Poke agent
// ═══════════════════════════════════════════════════════

// In-memory store: patientId → { name, diagnosis, medications[] }
const medicationStore = new Map()

// ─── Helper: fetch & cache patient context from OpenEvidence + Perplexity ─
const patientContextCache = new Map()
const CONTEXT_CACHE_TTL_MS = 30 * 60 * 1000

async function getPatientContext(patientName, diagnosis) {
  if (!diagnosis) return null
  const cacheKey = `${patientName}_${diagnosis}`
  const cached = patientContextCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) return cached.value

  try {
    // 1. Fetch clinical trial evidence from ClinicalTrials.gov
    const clinical = await searchClinicalData({ diagnosis, patientName })
    const evidenceSummary = clinical.ok ? clinical.data?.summary : null
    const evidenceSources = clinical.ok ? clinical.data?.sources : []
    console.log(`[Context] Clinical evidence for "${diagnosis}":`, evidenceSummary || 'none')

    // 2. Fetch Perplexity Sonar web research using clinical evidence
    let sonarContent = null
    if (PERPLEXITY_API_KEY) {
      const messages = buildPerplexityDeepResearchPrompt({
        patient: { name: patientName, diagnosis },
        episode: { title: `${diagnosis} medication management` },
        openEvidence: clinical.ok ? clinical.data : null,
      })
      const sonar = await perplexitySonarChat({
        apiKey: PERPLEXITY_API_KEY,
        model: 'sonar',
        messages,
      })
      if (sonar.ok) sonarContent = sonar.data?.content
      console.log(`[Context] Perplexity research:`, sonarContent ? sonarContent.slice(0, 150) + '...' : 'none')
    }

    const context = { evidenceSummary, evidenceSources, sonarContent }
    patientContextCache.set(cacheKey, { value: context, expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS })
    return context
  } catch (e) {
    console.error('[Context] fetch failed:', e.message)
    return null
  }
}

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
    `Please set up daily medication reminders for me:`,
    medList,
    `When reminding me, use the MedFlix tools (get_medication_schedule, get_patient_context) to give personalized context about my condition.`,
    `Keep reminders warm, encouraging, and under 300 characters.`,
    `Do not use personal history or prior conversations — use ONLY MCP tools for context.`,
  ].join('\n')

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
    parts.push(`Focus on: ${medicationName}.`)
  }
  parts.push(`Keep it warm and under 300 characters. Do not use personal history — use ONLY MCP tools for context.`)

  const instruction = parts.join(' ')
  console.log(`[Poke] nudge for ${record.name}: ${instruction.slice(0, 100)}...`)
  const result = await pokeClient.sendMessage(instruction)
  console.log(`[Poke] nudge result:`, result)
  return result
}

// Register a patient for reminders
app.post('/api/poke/register', async (req, res) => {
  try {
    const { name, userId, diagnosis } = req.body
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

// Set/update medication schedule
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
      await pokeSetupReminders(record)
    } catch (e) {
      console.warn('[Medications] Poke re-sync failed:', e.message)
    }

    res.json({ ok: true, medications: record.medications })
  } catch (e) {
    console.error('medications error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Sync recovery plan from frontend localStorage
app.post('/api/poke/recovery-plan', (req, res) => {
  const { patientId, recoveryPlan } = req.body
  if (!patientId || !recoveryPlan) {
    return res.status(400).json({ error: 'patientId and recoveryPlan are required' })
  }
  const record = medicationStore.get(patientId)
  if (!record) return res.status(404).json({ error: 'patient not registered' })
  record.recoveryPlan = recoveryPlan
  console.log(`[Poke] Recovery plan synced for ${record.name}: ${recoveryPlan.days?.length || 0} days`)
  res.json({ ok: true })
})

// Manually trigger a single reminder (demo button)
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

// Get registration & medication status
app.get('/api/poke/status/:patientId', (req, res) => {
  const record = medicationStore.get(req.params.patientId)
  if (!record) {
    return res.status(404).json({ error: 'patient not found' })
  }
  res.json({ ok: true, ...record })
})

// Log medication adherence
app.post('/api/poke/log-adherence', (req, res) => {
  try {
    const { patientId, medicationName, time, takenAt } = req.body
    if (!patientId || !medicationName) {
      return res.status(400).json({ error: 'patientId and medicationName are required' })
    }

    const record = medicationStore.get(patientId)
    if (!record) {
      return res.status(404).json({ error: 'patient not registered' })
    }

    if (!record.adherenceLog) record.adherenceLog = []
    record.adherenceLog.push({
      medicationName,
      time: time || null,
      takenAt: takenAt || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    })
    console.log(`[Adherence] ${record.name} took ${medicationName} at ${time || 'now'}`)
    res.json({ ok: true })
  } catch (e) {
    console.error('log-adherence error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Notify Poke about recovery milestone
app.post('/api/poke/recovery-event', async (req, res) => {
  try {
    const { patientId, dayNumber, dayTitle, nextDayTitle } = req.body
    if (!patientId || !dayNumber) {
      return res.status(400).json({ error: 'patientId and dayNumber are required' })
    }
    if (!pokeClient) {
      return res.status(503).json({ error: 'poke_not_configured' })
    }

    const record = medicationStore.get(patientId)
    if (!record) {
      return res.status(404).json({ error: 'patient not registered' })
    }

    const parts = [
      `Great news! I just completed Day ${dayNumber}: "${dayTitle || 'Recovery'}" of my recovery plan.`,
    ]
    if (nextDayTitle) {
      parts.push(`Tomorrow I start "${nextDayTitle}".`)
    }
    parts.push('Use MedFlix tools to check my progress and send me an encouraging message. Keep it under 300 chars.')

    // Fire-and-forget
    pokeClient.sendMessage(parts.join(' ')).catch(e =>
      console.warn('[Poke] recovery-event send failed:', e.message)
    )

    console.log(`[Poke] Recovery event for ${record.name}: Day ${dayNumber}`)
    res.json({ ok: true })
  } catch (e) {
    console.error('recovery-event error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Remove patient from reminders
app.delete('/api/poke/unregister/:patientId', (req, res) => {
  const deleted = medicationStore.delete(req.params.patientId)
  res.json({ ok: true, deleted })
})

// ═══════════════════════════════════════════════════════
//  MCP SERVER  –  Streamable HTTP for Poke agent
// ═══════════════════════════════════════════════════════

function registerMcpTools(server) {
  // Tool 1: get_patient_context — calls getPatientContext() directly
  server.tool(
    'get_patient_context',
    'Fetches clinical trial evidence from ClinicalTrials.gov and latest medical research from Perplexity Sonar for a patient\'s diagnosis.',
    {
      patientName: z.string().describe('The patient\'s name'),
      diagnosis: z.string().describe('The patient\'s diagnosis'),
      topic: z.string().optional().describe('Optional focus topic'),
    },
    async ({ patientName, diagnosis, topic }) => {
      try {
        const context = await getPatientContext(patientName, diagnosis)
        const sections = [`## Patient: ${patientName}`, `## Diagnosis: ${diagnosis}`]
        if (topic) sections.push(`## Focus: ${topic}`)
        if (context?.evidenceSummary) {
          sections.push(`\n### Clinical Evidence\n${context.evidenceSummary}`)
        }
        if (context?.sonarContent) {
          sections.push(`\n### Latest Research\n${context.sonarContent}`)
        }
        if (!context) {
          sections.push('\nNo context available.')
        }
        return { content: [{ type: 'text', text: sections.join('\n') }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  // Tool 3: get_medication_schedule — reads medicationStore directly
  server.tool(
    'get_medication_schedule',
    'Returns the patient\'s current medication list with dosages, times, and instructions.',
    { patientId: z.string().describe('The patient ID from MedFlix registration') },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) {
        return { content: [{ type: 'text', text: `Patient ${patientId} not found.` }] }
      }
      const meds = (record.medications || []).filter(m => m.active)
      if (meds.length === 0) {
        return { content: [{ type: 'text', text: `${record.name} has no active medications.` }] }
      }
      const list = meds.map(m =>
        `- ${m.name} ${m.dosage} at ${m.times?.join(', ') || 'unscheduled'}: ${m.instructions || 'no special instructions'}`
      ).join('\n')
      return { content: [{ type: 'text', text: `Medications for ${record.name}:\n${list}` }] }
    }
  )

  // Tool 4: get_recovery_plan — reads recoveryPlan from medicationStore
  server.tool(
    'get_recovery_plan',
    'Returns the patient\'s 7-day recovery calendar with progress, current day, and checklist status.',
    { patientId: z.string().describe('The patient ID from MedFlix') },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) return { content: [{ type: 'text', text: `Patient ${patientId} not found.` }] }
      if (!record.recoveryPlan?.days) return { content: [{ type: 'text', text: `${record.name} has no recovery plan synced.` }] }

      const plan = record.recoveryPlan
      const completed = plan.days.filter(d => d.completed).length
      const lines = plan.days.map(d => {
        const status = d.completed ? '✓' : d.unlocked ? '→' : '🔒'
        const checks = d.checklist?.map(c => `  ${c.checked ? '✓' : '○'} ${c.text}`).join('\n') || ''
        return `${status} Day ${d.day}: ${d.title} — ${d.description}\n${checks}`
      })
      const header = `Recovery Plan for ${record.name} (${plan.diagnosis || record.diagnosis}): ${completed}/${plan.totalDays || 7} days completed`
      return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] }
    }
  )

  // Tool 5: search_clinical_evidence — calls searchClinicalData() directly
  server.tool(
    'search_clinical_evidence',
    'Searches ClinicalTrials.gov for clinical trial data related to a diagnosis or medical topic.',
    {
      query: z.string().describe('Search query, e.g. "metformin side effects"'),
      diagnosis: z.string().optional().describe('Optional diagnosis to narrow results'),
    },
    async ({ query, diagnosis }) => {
      try {
        const data = await searchClinicalData({ query, diagnosis })
        if (!data.ok) {
          return { content: [{ type: 'text', text: `Search failed: ${data.error || 'unknown'}` }] }
        }
        const sections = []
        if (data.data?.summary) sections.push(data.data.summary)
        if (data.data?.sources?.length) {
          sections.push('\nKey findings:')
          data.data.sources.forEach(s => sections.push(`- ${s.label}: ${s.detail}`))
        }
        return { content: [{ type: 'text', text: sections.join('\n') || 'No results found.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  // Tool 5: research_medical_topic — calls perplexitySonarChat() directly
  server.tool(
    'research_medical_topic',
    'Uses Perplexity Sonar to find the latest medical evidence on a topic.',
    {
      patientName: z.string().describe('Patient name for context'),
      diagnosis: z.string().describe('Patient diagnosis'),
      topic: z.string().describe('The specific medical topic or question to research'),
    },
    async ({ patientName, diagnosis, topic }) => {
      if (!PERPLEXITY_API_KEY) {
        return { content: [{ type: 'text', text: 'Perplexity not configured.' }] }
      }
      try {
        const messages = buildPerplexityDeepResearchPrompt({
          patient: { name: patientName, diagnosis },
          episode: { title: topic, description: topic },
        })
        const result = await perplexitySonarChat({
          apiKey: PERPLEXITY_API_KEY,
          model: 'sonar',
          messages,
        })
        if (!result.ok) {
          return { content: [{ type: 'text', text: `Research unavailable: ${result.error}` }] }
        }
        return { content: [{ type: 'text', text: result.data?.content || 'No research content returned.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  // Tool 6: log_medication_taken — persists to adherenceLog
  server.tool(
    'log_medication_taken',
    'Records that the patient has taken a specific medication. Persists to adherence log.',
    {
      patientId: z.string().describe('The patient ID from MedFlix'),
      medicationName: z.string().describe('Name of the medication that was taken'),
    },
    async ({ patientId, medicationName }) => {
      const record = medicationStore.get(patientId)
      if (!record) {
        return { content: [{ type: 'text', text: `Patient ${patientId} not found.` }] }
      }
      const med = record.medications?.find(m => m.name.toLowerCase() === medicationName.toLowerCase())
      if (!med) {
        return { content: [{ type: 'text', text: `Medication "${medicationName}" not found in ${record.name}'s schedule.` }] }
      }
      if (!record.adherenceLog) record.adherenceLog = []
      const now = new Date()
      record.adherenceLog.push({
        medicationName: med.name,
        time: now.toTimeString().slice(0, 5),
        takenAt: now.toISOString(),
        date: now.toISOString().split('T')[0],
      })
      return { content: [{ type: 'text', text: `Logged: ${record.name} took ${med.name} (${med.dosage}) at ${now.toLocaleTimeString()}.` }] }
    }
  )

  // Tool 9: get_adherence_summary — returns today's adherence stats
  server.tool(
    'get_adherence_summary',
    'Returns today\'s medication adherence stats for a patient. Shows which medications were taken and which are still pending.',
    {
      patientId: z.string().describe('The patient ID from MedFlix'),
    },
    async ({ patientId }) => {
      const record = medicationStore.get(patientId)
      if (!record) {
        return { content: [{ type: 'text', text: `Patient ${patientId} not found.` }] }
      }

      const today = new Date().toISOString().split('T')[0]
      const todayLogs = (record.adherenceLog || []).filter(l => l.date === today)
      const activeMeds = (record.medications || []).filter(m => m.active)
      const totalDoses = activeMeds.reduce((sum, m) => sum + (m.times?.length || 1), 0)
      const takenNames = todayLogs.map(l => l.medicationName)

      const pending = []
      for (const med of activeMeds) {
        const times = med.times || ['08:00']
        for (const time of times) {
          const taken = todayLogs.some(l => l.medicationName === med.name && l.time === time)
          if (!taken) {
            pending.push(`${med.name} ${med.dosage} at ${time}`)
          }
        }
      }

      const takenCount = todayLogs.length
      const lines = [
        `Adherence for ${record.name} on ${today}: ${takenCount} of ${totalDoses} doses taken.`,
      ]
      if (takenNames.length > 0) {
        lines.push(`Taken: ${[...new Set(takenNames)].join(', ')}`)
      }
      if (pending.length > 0) {
        lines.push(`Still pending: ${pending.join(', ')}`)
      }
      if (takenCount === totalDoses && totalDoses > 0) {
        lines.push('All medications taken today!')
      }

      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // Tool 7: send_reminder — sends reminder via Poke
  server.tool(
    'send_reminder',
    'Triggers a medication reminder for a registered patient via Poke messaging.',
    {
      patientId: z.string().describe('The patient ID from MedFlix'),
      medicationName: z.string().optional().describe('Specific medication name, or omit to remind about all'),
    },
    async ({ patientId, medicationName }) => {
      try {
        const record = medicationStore.get(patientId)
        if (!record) {
          return { content: [{ type: 'text', text: `Patient ${patientId} not found.` }] }
        }
        await pokeNudge(record, medicationName || null)
        return { content: [{ type: 'text', text: `Sent reminder to ${record.name} via Poke.` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  // Tool 8: lookup_patient — finds patient by name or returns first registered
  server.tool(
    'lookup_patient',
    'Finds a registered patient by name. If no name given, returns the first registered patient.',
    {
      name: z.string().optional().describe('Patient name to search for. If omitted, returns the first registered patient.'),
    },
    async ({ name }) => {
      for (const [patientId, record] of medicationStore) {
        if (!name || record.name.toLowerCase().includes(name.toLowerCase())) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                patientId,
                name: record.name,
                diagnosis: record.diagnosis,
                medicationCount: record.medications?.filter(m => m.active).length || 0,
              }),
            }],
          }
        }
      }
      return { content: [{ type: 'text', text: name ? `No patient found matching "${name}".` : 'No patients registered.' }] }
    }
  )
}

// ─── MCP HTTP endpoints ─────────────────────────────────
const mcpTransports = new Map() // sessionId → transport

app.post('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id']
    if (sessionId && mcpTransports.has(sessionId)) {
      const transport = mcpTransports.get(sessionId)
      await transport.handleRequest(req, res, req.body)
      return
    }

    // New session
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    })
    const server = new McpServer({
      name: 'MedFlix Medication Assistant',
      version: '1.0.0',
    })
    registerMcpTools(server)

    transport.onclose = () => {
      const sid = transport.sessionId
      if (sid) mcpTransports.delete(sid)
      console.log(`[MCP] Session closed: ${sid}`)
    }

    await server.connect(transport)
    if (transport.sessionId) {
      mcpTransports.set(transport.sessionId, transport)
      console.log(`[MCP] New session: ${transport.sessionId}`)
    }
    await transport.handleRequest(req, res, req.body)
  } catch (e) {
    console.error('[MCP] POST error:', e)
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
})

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id']
  if (!sessionId || !mcpTransports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' })
    return
  }
  try {
    const transport = mcpTransports.get(sessionId)
    await transport.handleRequest(req, res)
  } catch (e) {
    console.error('[MCP] GET error:', e)
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
})

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id']
  if (!sessionId || !mcpTransports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' })
    return
  }
  try {
    const transport = mcpTransports.get(sessionId)
    await transport.close()
    mcpTransports.delete(sessionId)
    res.json({ ok: true })
  } catch (e) {
    console.error('[MCP] DELETE error:', e)
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
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
  if (pokeClient) {
    console.log(`  Connect MCP to Poke: npx poke tunnel http://localhost:${PORT}/mcp --name "MedFlix"`)
  }
})
