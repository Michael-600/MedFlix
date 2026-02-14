import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import twilio from 'twilio'
import { getPerplexityKey, perplexitySonarChat } from './perplexitySonar.js'
import { buildHeyGenPrompt, buildPerplexityDeepResearchPrompt, safePreview } from './heygenPrompt.js'
import { searchClinicalData } from './clinicalSearch.js'

const app = express()
app.use(cors())
app.use(express.json())

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

// ─── Helper: send SMS via Twilio ────────────────────────
async function sendSms(to, body) {
  if (!twilioClient) throw new Error('twilio_not_configured')
  const msg = await twilioClient.messages.create({
    body,
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
        const context = await getPatientContext(record.name, record.diagnosis)
        const crafted = await craftReminder({
          patientName: record.name,
          diagnosis: record.diagnosis,
          medication: med,
          context,
        })
        const smsBody = crafted || buildFallbackReminder({ patientName: record.name, medication: med })
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
    const { name, phoneNumber, userId, diagnosis } = req.body
    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'name and phoneNumber are required' })
    }
    if (!twilioClient) {
      return res.status(503).json({ error: 'twilio_not_configured' })
    }

    const patientId = `patient_${userId || Date.now()}`
    medicationStore.set(patientId, {
      name,
      phoneNumber,
      patientId,
      userId,
      diagnosis: diagnosis || null,
      medications: [],
    })

    // Craft personalized welcome via Perplexity + OpenEvidence, deliver with Twilio
    let welcomeMsg
    if (PERPLEXITY_API_KEY && diagnosis) {
      console.log('[Register] Crafting personalized welcome...')
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

    // Get OpenEvidence + Perplexity context, then craft personalized messages
    const context = await getPatientContext(record.name, record.diagnosis)

    const sentMessages = []
    for (const med of targetMeds.length ? targetMeds : [{ name: 'medications', dosage: '', instructions: '' }]) {
      const crafted = await craftReminder({
        patientName: record.name,
        diagnosis: record.diagnosis,
        medication: med,
        context,
      })
      const smsBody = crafted || buildFallbackReminder({ patientName: record.name, medication: med })
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
    twilio: !!twilioClient,
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`MedFlix API server running on http://localhost:${PORT}`)
  console.log(`  HeyGen key: ${HEYGEN_API_KEY ? '***' + HEYGEN_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  LiveAvatar key: ${LIVEAVATAR_API_KEY ? '***' + LIVEAVATAR_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Perplexity key: ${PERPLEXITY_API_KEY ? '***' + PERPLEXITY_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Poke key: ${POKE_API_KEY ? '***' + POKE_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Twilio SID: ${TWILIO_ACCOUNT_SID ? '***' + TWILIO_ACCOUNT_SID.slice(-6) : 'MISSING'}`)
  console.log(`  Twilio phone: ${TWILIO_PHONE_NUMBER || 'MISSING'}`)
})
