import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import twilio from 'twilio'
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

// ─── Twilio init (SMS delivery) ─────────────────────────
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const twilioClient = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

// ─── Poke client + webhook state ────────────────────────
const pokeClient = POKE_API_KEY ? new Poke({ apiKey: POKE_API_KEY }) : null
let pokeWebhookUrl = null
let pokeWebhookToken = null

// ─── Pending MCP callback requests ─────────────────────
const pendingRequests = new Map() // requestId → { resolve, timer, createdAt }

// Safety net: sweep stale pending requests every 60s
setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of pendingRequests) {
    if (now - entry.createdAt > 90_000) {
      entry.resolve(null)
      clearTimeout(entry.timer)
      pendingRequests.delete(id)
      console.warn(`[Poke] Swept stale pending request ${id}`)
    }
  }
}, 60_000)

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
//  MEDICATION REMINDERS  –  Perplexity-crafted, Twilio-delivered
//  Perplexity Sonar = AI that crafts personalized messages using
//                     OpenEvidence clinical data + web research
//  Twilio           = SMS delivery to patient's phone
//  Poke MCP         = patients can text back and get AI answers
// ═══════════════════════════════════════════════════════

// In-memory store: patientId → { name, phoneNumber, diagnosis, medications[] }
const medicationStore = new Map()

// ─── Helper: normalize phone to E.164 ──────────────────
function normalizePhone(phone) {
  if (!phone) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return phone.startsWith('+') ? phone : `+${digits}`
}

// ─── Helper: send SMS via Twilio ────────────────────────
// Twilio trial accounts prepend ~42 chars ("Sent from your Twilio trial account - ")
// and may reject messages exceeding 1600 total chars. Truncate to be safe.
const SMS_MAX_BODY = 320

async function sendSms(to, body) {
  if (!twilioClient) throw new Error('twilio_not_configured')
  const trimmed = body.length > SMS_MAX_BODY
    ? body.slice(0, SMS_MAX_BODY - 3) + '...'
    : body
  if (trimmed !== body) console.warn(`[Twilio] Truncated SMS from ${body.length} to ${trimmed.length} chars`)
  const msg = await twilioClient.messages.create({
    body: trimmed,
    from: TWILIO_PHONE_NUMBER,
    to,
  })
  console.log(`[Twilio] SMS sent to ${to}: ${msg.sid}`)
  return msg
}

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

// ─── Helper: use Perplexity to craft a personalized SMS ─
async function craftReminder({ patientName, diagnosis, medication, context }) {
  if (!PERPLEXITY_API_KEY) return null
  try {
    const contextBlock = []
    if (context?.evidenceSummary) contextBlock.push(`Clinical evidence: ${context.evidenceSummary}`)
    if (context?.sonarContent) contextBlock.push(`Research: ${context.sonarContent.slice(0, 500)}`)

    const messages = [
      {
        role: 'system',
        content: 'You are a caring medical assistant that writes short SMS medication reminders. Write ONLY the message text — no quotes, no labels, no explanations. Keep it under 300 characters. Be warm and specific to the patient\'s condition.',
      },
      {
        role: 'user',
        content: [
          `Write a medication reminder SMS for ${patientName}.`,
          `Medication: ${medication.name} ${medication.dosage}.`,
          medication.instructions ? `Instructions: ${medication.instructions}.` : null,
          diagnosis ? `Diagnosis: ${diagnosis}.` : null,
          contextBlock.length ? `\nMedical context:\n${contextBlock.join('\n')}` : null,
          `\nWrite a short, personalized reminder that references their specific condition and why this medication matters. Under 300 chars. Just the message text.`,
        ].filter(Boolean).join(' '),
      },
    ]

    console.log('[Craft] Asking Perplexity to craft reminder...')
    const result = await perplexitySonarChat({
      apiKey: PERPLEXITY_API_KEY,
      model: 'sonar',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    })

    if (result.ok && result.data?.content) {
      // Strip any quotes Sonar might wrap the message in
      const crafted = result.data.content.replace(/^["']|["']$/g, '').trim()
      console.log('[Craft] Personalized reminder:', crafted)
      return crafted
    }
    return null
  } catch (e) {
    console.error('[Craft] failed:', e.message)
    return null
  }
}

// ─── Helper: build a fallback reminder (no Perplexity) ──
function buildFallbackReminder({ patientName, medication }) {
  const parts = [`Hi ${patientName}! Time to take your ${medication.name} (${medication.dosage}).`]
  if (medication.instructions) parts.push(medication.instructions + '.')
  parts.push('- MedFlix')
  return parts.join(' ')
}

// ─── Poke webhook setup ─────────────────────────────────
async function setupPokeWebhook() {
  if (!pokeClient) {
    console.log('[Poke] No API key — webhook not created')
    return
  }
  try {
    const webhook = await pokeClient.createWebhook({
      condition: 'When MedFlix sends patient data for SMS crafting',
      action: [
        'You are MedFlix\'s compassionate medication assistant. You help patients manage their recovery with warmth, respect, and medical accuracy.',
        '',
        '## Your Personality',
        '- Warm, encouraging, and never condescending',
        '- Address patients by first name',
        '- Acknowledge their journey and challenges',
        '- Never dismiss concerns — validate, then guide',
        '- Use simple language, avoid medical jargon unless explaining it',
        '- End with encouragement or a gentle reminder they\'re not alone',
        '',
        '## Context Available in Webhook Data',
        '- patientName, diagnosis: Who they are and what they\'re managing',
        '- allMedications: Their full medication schedule with dosages and timing',
        '- recoveryProgress: Which day of their 7-day recovery plan they\'re on, what tasks they have today',
        '- medication: The specific medication this message is about (for reminders)',
        '- inboundMessage: What the patient texted (for replies)',
        '',
        '## MCP Tools Available (use for deeper research)',
        '- get_patient_context: Fetches clinical trial evidence + Perplexity research for their diagnosis',
        '- search_clinical_evidence: Searches ClinicalTrials.gov for specific medical questions',
        '- research_medical_topic: Gets latest medical guidance from web search',
        '- get_medication_schedule: Gets their full medication list from the system',
        '- get_recovery_plan: Gets their 7-day recovery calendar with progress',
        '',
        '## How to Respond by Purpose',
        '- "welcome": Welcome them warmly. Mention their diagnosis by name. Let them know they\'ll get personalized reminders and can text back anytime with questions.',
        '- "reminder": Remind them to take the specific medication. Mention WHY it matters for their condition. Reference their recovery day if available.',
        '- "reply": Answer their question thoughtfully. Use the webhook context + MCP tools to give an informed, caring response. If the question is outside your expertise, gently suggest they consult their care team.',
        '',
        '## Safety Rules',
        '- NEVER diagnose or change medication advice',
        '- ALWAYS suggest contacting their care team for concerning symptoms',
        '- If asked about side effects, provide general info and recommend discussing with their doctor',
        '- For emergencies, tell them to call 911 or go to the nearest ER immediately',
        '',
        '## Message Format',
        '- Keep SMS under 280 characters (hard limit imposed by carrier)',
        '- No markdown, no bullet points — plain text only',
        '- Sign off with "- MedFlix" only for welcome messages',
        '',
        '## Final Step',
        'After crafting your message, ALWAYS call deliver_crafted_message with the requestId from the data and your message text.',
      ].join('\n'),
    })
    pokeWebhookUrl = webhook.webhookUrl
    pokeWebhookToken = webhook.webhookToken
    console.log(`[Poke] Webhook created: triggerId=${webhook.triggerId}`)
  } catch (e) {
    console.error('[Poke] Failed to create webhook:', e.message)
  }
}

// ─── Poke-crafted SMS helper ─────────────────────────────
async function pokeCraft({ purpose, patientName, diagnosis, medication, inboundMessage, phoneNumber }) {
  if (!pokeClient || !pokeWebhookUrl) return null

  const requestId = randomUUID()

  // Build rich context from medicationStore
  let record = null
  for (const [, r] of medicationStore) {
    if (r.phoneNumber === phoneNumber || r.name === patientName) { record = r; break }
  }

  const medsContext = record?.medications?.filter(m => m.active)
    .map(m => `${m.name} ${m.dosage} at ${m.times?.join(', ')} — ${m.instructions || 'no special instructions'}`)
    .join('; ') || 'none'

  const plan = record?.recoveryPlan
  let recoveryContext = 'No recovery plan available'
  if (plan?.days) {
    const completed = plan.days.filter(d => d.completed).length
    const current = plan.days.find(d => d.unlocked && !d.completed) || plan.days[plan.days.length - 1]
    const checklist = current?.checklist?.map(c => `${c.checked ? '✓' : '○'} ${c.text}`).join(', ') || ''
    recoveryContext = `Day ${current?.day || '?'}/${plan.totalDays || 7}: "${current?.title}" — ${completed} days completed. Today's tasks: ${checklist}`
  }

  try {
    const promise = new Promise((resolve) => {
      const timer = setTimeout(() => {
        pendingRequests.delete(requestId)
        console.warn(`[Poke] pokeCraft timed out (30s) for ${requestId} — is MCP tunnel running? Try: npx poke tunnel http://localhost:${PORT}/mcp --name "MedFlix"`)
        resolve(null)
      }, 30_000)

      pendingRequests.set(requestId, { resolve, timer, createdAt: Date.now() })
    })

    console.log(`[Poke] Sending webhook for ${purpose}: requestId=${requestId}, meds=${medsContext.slice(0, 80)}, recovery=${recoveryContext.slice(0, 80)}`)
    await pokeClient.sendWebhook({
      webhookUrl: pokeWebhookUrl,
      webhookToken: pokeWebhookToken,
      data: {
        requestId,
        purpose,
        patientName,
        diagnosis: diagnosis || 'unknown',
        medication: medication ? `${medication.name} ${medication.dosage}` : undefined,
        allMedications: medsContext,
        recoveryProgress: recoveryContext,
        inboundMessage: inboundMessage || undefined,
        phoneNumber: phoneNumber || undefined,
      },
    })

    return await promise
  } catch (e) {
    console.error(`[Poke] pokeCraft error:`, e.message)
    pendingRequests.delete(requestId)
    return null
  }
}

// Reminder interval – check every 60s if any medication is due
setInterval(async () => {
  if (!twilioClient) return
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  for (const [patientId, record] of medicationStore) {
    if (!record.medications?.length) continue
    for (const med of record.medications) {
      if (!med.active || !med.times?.includes(currentTime)) continue

      try {
        // Poke-first → Perplexity fallback → template fallback
        let smsBody = await pokeCraft({
          purpose: 'reminder',
          patientName: record.name,
          diagnosis: record.diagnosis,
          medication: med,
          phoneNumber: record.phoneNumber,
        })
        if (!smsBody) {
          const context = await getPatientContext(record.name, record.diagnosis)
          smsBody = await craftReminder({
            patientName: record.name,
            diagnosis: record.diagnosis,
            medication: med,
            context,
          })
        }
        smsBody = smsBody || buildFallbackReminder({ patientName: record.name, medication: med })
        await sendSms(record.phoneNumber, smsBody)
      } catch (err) {
        console.error(`[Reminder] failed for ${patientId}/${med.name}:`, err.message)
      }
    }
  }
}, 60_000)

// Register a patient for reminders
app.post('/api/poke/register', async (req, res) => {
  try {
    const { name, phoneNumber: rawPhone, userId, diagnosis } = req.body
    if (!name || !rawPhone) {
      return res.status(400).json({ error: 'name and phoneNumber are required' })
    }
    if (!twilioClient) {
      return res.status(503).json({ error: 'twilio_not_configured' })
    }

    const phoneNumber = normalizePhone(rawPhone)
    const patientId = `patient_${userId || Date.now()}`
    medicationStore.set(patientId, {
      name,
      phoneNumber,
      patientId,
      userId,
      diagnosis: diagnosis || null,
      medications: [],
    })

    // Poke-first → Perplexity fallback → template welcome
    let welcomeMsg = await pokeCraft({
      purpose: 'welcome',
      patientName: name,
      diagnosis: diagnosis || 'general',
      phoneNumber,
    })
    if (!welcomeMsg && PERPLEXITY_API_KEY && diagnosis) {
      console.log('[Register] Crafting personalized welcome via Perplexity...')
      const context = await getPatientContext(name, diagnosis)
      const result = await perplexitySonarChat({
        apiKey: PERPLEXITY_API_KEY,
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You write short, warm SMS messages for patients. Write ONLY the message text. Under 300 characters.' },
          { role: 'user', content: `Write a welcome SMS for ${name} who just signed up for MedFlix medication reminders. Diagnosis: ${diagnosis}. ${context?.evidenceSummary ? `Context: ${context.evidenceSummary}` : ''} Welcome them, mention their condition by name, and let them know they'll get personalized reminders. Under 300 chars. Just the message.` },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })
      if (result.ok && result.data?.content) {
        welcomeMsg = result.data.content.replace(/^["']|["']$/g, '').trim()
        console.log('[Register] Crafted welcome:', welcomeMsg)
      }
    }
    welcomeMsg = welcomeMsg || `Welcome to MedFlix, ${name}! You'll receive personalized medication reminders for your ${diagnosis || 'treatment'}. - MedFlix`

    await sendSms(phoneNumber, welcomeMsg)

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
    if (!twilioClient) {
      return res.status(503).json({ error: 'twilio_not_configured' })
    }

    const record = medicationStore.get(patientId)
    if (!record) {
      return res.status(404).json({ error: 'patient not registered' })
    }

    // Pick target medication(s)
    let targetMeds
    if (medicationName) {
      const med = record.medications.find(m => m.name === medicationName)
      targetMeds = med ? [med] : [{ name: medicationName, dosage: '', instructions: '' }]
    } else {
      targetMeds = record.medications.filter(m => m.active)
    }

    // Poke-first → Perplexity fallback → template fallback
    const sentMessages = []
    for (const med of targetMeds.length ? targetMeds : [{ name: 'medications', dosage: '', instructions: '' }]) {
      let smsBody = await pokeCraft({
        purpose: 'reminder',
        patientName: record.name,
        diagnosis: record.diagnosis,
        medication: med,
        phoneNumber: record.phoneNumber,
      })
      if (!smsBody) {
        const context = await getPatientContext(record.name, record.diagnosis)
        smsBody = await craftReminder({
          patientName: record.name,
          diagnosis: record.diagnosis,
          medication: med,
          context,
        })
      }
      smsBody = smsBody || buildFallbackReminder({ patientName: record.name, medication: med })
      await sendSms(record.phoneNumber, smsBody)
      sentMessages.push(smsBody)
    }

    res.json({ ok: true, messages: sentMessages, usedPerplexity: !!PERPLEXITY_API_KEY })
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

// Remove patient from reminders
app.delete('/api/poke/unregister/:patientId', (req, res) => {
  const deleted = medicationStore.delete(req.params.patientId)
  res.json({ ok: true, deleted })
})

// ═══════════════════════════════════════════════════════
//  MCP SERVER  –  Streamable HTTP for Poke agent
// ═══════════════════════════════════════════════════════

function registerMcpTools(server) {
  // Tool 1: deliver_crafted_message — resolves a pending pokeCraft() Promise
  server.tool(
    'deliver_crafted_message',
    'Delivers a crafted SMS message back to MedFlix. Call this after researching and crafting a personalized message for the patient. The requestId comes from the webhook data.',
    {
      requestId: z.string().describe('The requestId from the webhook data'),
      message: z.string().describe('The crafted SMS message text (under 300 chars)'),
    },
    async ({ requestId, message }) => {
      const pending = pendingRequests.get(requestId)
      if (!pending) {
        return { content: [{ type: 'text', text: `No pending request found for ${requestId} — it may have timed out.` }] }
      }
      clearTimeout(pending.timer)
      pendingRequests.delete(requestId)
      pending.resolve(message)
      console.log(`[MCP] deliver_crafted_message resolved ${requestId}: ${message.slice(0, 80)}...`)
      return { content: [{ type: 'text', text: `Message delivered for request ${requestId}.` }] }
    }
  )

  // Tool 2: get_patient_context — calls getPatientContext() directly
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

  // Tool 6: log_medication_taken — reads medicationStore directly
  server.tool(
    'log_medication_taken',
    'Records that the patient has taken a specific medication.',
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
      const timestamp = new Date().toLocaleTimeString()
      return { content: [{ type: 'text', text: `Logged: ${record.name} took ${med.name} (${med.dosage}) at ${timestamp}.` }] }
    }
  )

  // Tool 7: send_reminder — pokeCraft → craftReminder → sendSms
  server.tool(
    'send_reminder',
    'Triggers a medication reminder for a registered patient via SMS.',
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
        let targetMeds
        if (medicationName) {
          const med = record.medications.find(m => m.name === medicationName)
          targetMeds = med ? [med] : [{ name: medicationName, dosage: '', instructions: '' }]
        } else {
          targetMeds = record.medications.filter(m => m.active)
        }
        const sent = []
        for (const med of targetMeds.length ? targetMeds : [{ name: 'medications', dosage: '', instructions: '' }]) {
          let smsBody = await pokeCraft({
            purpose: 'reminder',
            patientName: record.name,
            diagnosis: record.diagnosis,
            medication: med,
            phoneNumber: record.phoneNumber,
          })
          if (!smsBody) {
            const context = await getPatientContext(record.name, record.diagnosis)
            smsBody = await craftReminder({
              patientName: record.name,
              diagnosis: record.diagnosis,
              medication: med,
              context,
            })
          }
          smsBody = smsBody || buildFallbackReminder({ patientName: record.name, medication: med })
          await sendSms(record.phoneNumber, smsBody)
          sent.push(smsBody)
        }
        return { content: [{ type: 'text', text: `Sent ${sent.length} reminder(s) to ${record.name}.` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )

  // Tool 8: lookup_patient_by_phone — scans medicationStore by phone
  server.tool(
    'lookup_patient_by_phone',
    'Finds a registered patient by their phone number. Useful when handling inbound SMS.',
    {
      phoneNumber: z.string().describe('Phone number in E.164 format, e.g. +14155551234'),
    },
    async ({ phoneNumber }) => {
      for (const [patientId, record] of medicationStore) {
        if (record.phoneNumber === phoneNumber) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ patientId, name: record.name, diagnosis: record.diagnosis, phoneNumber: record.phoneNumber }),
            }],
          }
        }
      }
      return { content: [{ type: 'text', text: `No patient found with phone ${phoneNumber}.` }] }
    }
  )

  // Tool 9: send_sms — calls sendSms() directly
  server.tool(
    'send_sms',
    'Sends an SMS message to a phone number via Twilio.',
    {
      to: z.string().describe('Recipient phone number in E.164 format'),
      body: z.string().describe('The SMS message text'),
    },
    async ({ to, body }) => {
      try {
        const msg = await sendSms(to, body)
        return { content: [{ type: 'text', text: `SMS sent: ${msg.sid}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to send SMS: ${e.message}` }] }
      }
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
//  TWILIO WEBHOOK  –  Inbound SMS handling
// ═══════════════════════════════════════════════════════

app.post('/api/twilio/webhook', async (req, res) => {
  // Respond immediately with empty TwiML so Twilio doesn't retry
  res.type('text/xml').send('<Response></Response>')

  const from = req.body?.From
  const body = req.body?.Body
  if (!from || !body) return

  console.log(`[Twilio] Inbound SMS from ${from}: ${body}`)

  // Lookup patient by phone number
  let patient = null
  for (const [, record] of medicationStore) {
    if (record.phoneNumber === from) {
      patient = record
      break
    }
  }

  if (!patient) {
    console.log(`[Twilio] Unknown sender ${from} — no patient registered`)
    return
  }

  try {
    // Poke-first → Perplexity fallback → template reply
    let reply = await pokeCraft({
      purpose: 'reply',
      patientName: patient.name,
      diagnosis: patient.diagnosis,
      inboundMessage: body,
      phoneNumber: from,
    })

    if (!reply && PERPLEXITY_API_KEY) {
      const context = await getPatientContext(patient.name, patient.diagnosis)
      const medsInfo = patient.medications?.filter(m => m.active)
        .map(m => `${m.name} ${m.dosage}`).join(', ') || ''
      const plan = patient.recoveryPlan
      const recoveryInfo = plan?.days
        ? `Recovery day ${(plan.days.find(d => d.unlocked && !d.completed) || plan.days[plan.days.length - 1])?.day || '?'}/${plan.totalDays || 7}.`
        : ''
      const result = await perplexitySonarChat({
        apiKey: PERPLEXITY_API_KEY,
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a compassionate medical assistant replying to a patient\'s SMS. Be warm, respectful, and helpful. Use simple language. If the question is about symptoms or concerns, validate their feelings first, then provide guidance. Always suggest consulting their care team for serious concerns. Write ONLY the reply text. Under 280 characters.' },
          { role: 'user', content: `Patient ${patient.name} (diagnosis: ${patient.diagnosis}) texted: "${body}". ${medsInfo ? `Medications: ${medsInfo}.` : ''} ${recoveryInfo} ${context?.evidenceSummary ? `Medical context: ${context.evidenceSummary}` : ''} Reply with empathy and care. Under 280 chars. Just the message.` },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })
      if (result.ok && result.data?.content) {
        reply = result.data.content.replace(/^["']|["']$/g, '').trim()
      }
    }

    reply = reply || `Hi ${patient.name}, thank you for reaching out! I want to make sure you get the best answer — please share this question with your care team at your next visit. We're here for you! - MedFlix`

    await sendSms(from, reply)
    console.log(`[Twilio] Reply sent to ${from}: ${reply.slice(0, 80)}...`)
  } catch (e) {
    console.error(`[Twilio] Failed to reply to ${from}:`, e.message)
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
    poke_webhook: !!pokeWebhookUrl,
    mcp: true,
    twilio: !!twilioClient,
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, async () => {
  console.log(`MedFlix API server running on http://localhost:${PORT}`)
  console.log(`  HeyGen key: ${HEYGEN_API_KEY ? '***' + HEYGEN_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  LiveAvatar key: ${LIVEAVATAR_API_KEY ? '***' + LIVEAVATAR_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Perplexity key: ${PERPLEXITY_API_KEY ? '***' + PERPLEXITY_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Poke key: ${POKE_API_KEY ? '***' + POKE_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Twilio SID: ${TWILIO_ACCOUNT_SID ? '***' + TWILIO_ACCOUNT_SID.slice(-6) : 'MISSING'}`)
  console.log(`  Twilio phone: ${TWILIO_PHONE_NUMBER || 'MISSING'}`)

  // Set up Poke webhook (non-blocking — server is already listening)
  await setupPokeWebhook()

  console.log(`  Poke webhook: ${pokeWebhookUrl ? 'ACTIVE' : 'NOT SET'}`)
  console.log(`  MCP endpoint: http://localhost:${PORT}/mcp`)
  console.log(`  Twilio webhook: POST http://localhost:${PORT}/api/twilio/webhook`)
  if (pokeClient) {
    console.log(`  Connect MCP to Poke: npx poke tunnel http://localhost:${PORT}/mcp --name "MedFlix"`)
  }
})
