import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getPerplexityKey, perplexitySonarChat } from './perplexitySonar.js'
import { buildHeyGenPrompt, buildPerplexityDeepResearchPrompt, safePreview } from './heygenPrompt.js'
import { buildEpisodeContext, gatherClinicalData, clearContextCache } from './contextEngine.js'

const app = express()
app.use(cors())
app.use(express.json())

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY
const PERPLEXITY_API_KEY = getPerplexityKey()
const HEYGEN_DISABLED =
  String(process.env.HEYGEN_DISABLED || '').toLowerCase() === 'true' ||
  String(process.env.DISABLE_HEYGEN || '').toLowerCase() === 'true'
const HEYGEN_BASE = 'https://api.heygen.com'
const LIVEAVATAR_BASE = 'https://api.liveavatar.com'

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
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`MedFlix API server running on http://localhost:${PORT}`)
  console.log(`  HeyGen key: ${HEYGEN_API_KEY ? '***' + HEYGEN_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  LiveAvatar key: ${LIVEAVATAR_API_KEY ? '***' + LIVEAVATAR_API_KEY.slice(-6) : 'MISSING'}`)
  console.log(`  Perplexity key: ${PERPLEXITY_API_KEY ? '***' + PERPLEXITY_API_KEY.slice(-6) : 'MISSING'}`)
})
