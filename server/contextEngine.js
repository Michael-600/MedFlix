/**
 * Context Engine
 *
 * Orchestrates clinical data gathering from OpenFDA, DailyMed, and
 * ClinicalTrials.gov, then synthesizes the results through Perplexity
 * Sonar into structured, patient-friendly episode scripts.
 *
 * Output: a context object with { greeting, mainContent, closing, sources }
 * that can be fed directly into HeyGen's structured video API.
 */

import { fetchAllDrugInfo } from './openfdaClient.js'
import { fetchAllDrugLabels } from './dailymedClient.js'
import { perplexitySonarChat, getPerplexityKey } from './perplexitySonar.js'
import { buildHardcodedEpisode } from './episodeScripts.js'

// ── in-memory cache (same pattern as sonar cache in index.js) ───

const contextCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getCached(key) {
  const item = contextCache.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    contextCache.delete(key)
    return null
  }
  return item.value
}

function setCache(key, value) {
  contextCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

export function clearContextCache() {
  contextCache.clear()
  console.log('[ContextEngine] Cache cleared')
}

// ── clinical data aggregation ────────────────────────────────────

/**
 * Gather raw clinical data from OpenFDA + DailyMed in parallel.
 *
 * @param {{ medications: Array }} patient
 * @returns {Promise<{ fdaDrugData: object[], dailyMedLabels: object[] }>}
 */
export async function gatherClinicalData(patient) {
  const meds = patient.medications || []
  if (meds.length === 0) {
    return { fdaDrugData: [], dailyMedLabels: [] }
  }

  const [fdaDrugData, dailyMedLabels] = await Promise.all([
    fetchAllDrugInfo(meds),
    fetchAllDrugLabels(meds),
  ])

  return { fdaDrugData, dailyMedLabels }
}

// ── Perplexity synthesis ─────────────────────────────────────────

function buildSynthesisPrompt({ patient, episode, fdaDrugData, dailyMedLabels }) {
  const medSummaries = (fdaDrugData || [])
    .filter((d) => d.label)
    .map((d) => {
      const l = d.label
      const parts = [`Drug: ${d.medication} (${d.genericName})`]
      if (l.indications) parts.push(`  Indications: ${l.indications.slice(0, 400)}`)
      if (l.warnings) parts.push(`  Warnings: ${l.warnings.slice(0, 400)}`)
      if (l.adverseReactions) parts.push(`  Adverse reactions: ${l.adverseReactions.slice(0, 300)}`)
      if (l.patientCounseling) parts.push(`  Patient counseling: ${l.patientCounseling.slice(0, 300)}`)
      if (l.drugInteractions) parts.push(`  Drug interactions: ${l.drugInteractions.slice(0, 300)}`)
      if (d.adverseEvents?.length) {
        const top = d.adverseEvents.slice(0, 5).map((e) => e.reaction).join(', ')
        parts.push(`  Top reported adverse events: ${top}`)
      }
      return parts.join('\n')
    })
    .join('\n\n')

  const dailyMedSummaries = (dailyMedLabels || [])
    .filter((d) => d.label?.sections?.length)
    .map((d) => {
      const sectionNames = d.label.sections.map((s) => s.name).join(', ')
      return `DailyMed – ${d.medication}: sections available: ${sectionNames}`
    })
    .join('\n')

  const patientContext = [
    `Patient: ${patient.name}, ${patient.age}yo ${patient.sex}`,
    `Diagnosis: ${patient.diagnosis}`,
    patient.conditions?.length ? `Comorbidities: ${patient.conditions.join(', ')}` : null,
    patient.procedure ? `Procedure/plan: ${patient.procedure}` : null,
    patient.allergies?.length ? `Allergies: ${patient.allergies.join(', ')}` : null,
    patient.goals?.length ? `Goals: ${patient.goals.join('; ')}` : null,
  ].filter(Boolean).join('\n')

  const doctorName = patient.careTeam?.[0]?.name || 'your doctor'

  // Build medication context string for the prompt
  const medContext = (patient.medications || [])
    .map((m) => `${m.name} ${m.dose} ${m.frequency} (${m.purpose})`)
    .join('; ')
  const condContext = (patient.conditions || []).join(', ')
  const goalContext = (patient.goals || []).slice(0, 3).join('; ')

  const systemPrompt = `You are a medical education scriptwriter. You write DETAILED, FACTUAL scripts for patient education videos. You use ONLY the clinical data provided (from OpenFDA and DailyMed) — NEVER invent medical facts.

You are writing a script for a video about: "${episode.title}" for patient ${patient.name} (${patient.age}yo ${patient.sex}, diagnosed with ${patient.diagnosis}).
${medContext ? `Their doctor-prescribed medications: ${medContext}.` : ''}
${condContext ? `Comorbidities: ${condContext}.` : ''}
${goalContext ? `Health goals: ${goalContext}.` : ''}

Your output MUST be valid JSON with exactly these fields:
{
  "scenes": [
    {
      "script": "What the presenter SAYS in this scene (3-5 sentences, ~40-60 words). Must be factual, specific to this patient, reference real data from the FDA/DailyMed sections below.",
      "visual": "EXACT description of what the viewer SEES on screen. Describe specific: text overlays with exact wording, diagrams with exact labels, icons with names, charts with exact values from the patient data. NO vague descriptions."
    }
  ],
  "keyPoints": ["specific actionable point 1", "specific actionable point 2", "specific actionable point 3", "specific actionable point 4"],
  "sources": ["FDA OpenFDA Drug Labels", "DailyMed NLM"]
}

SCENE STRUCTURE (you MUST output exactly 5-7 scenes):
- Scene 1: GREETING — Welcome the patient by first name, introduce the topic. ~30 words.
- Scene 2-5: MAIN CONTENT — Each scene covers ONE specific subtopic with FACTS from the clinical data. Each scene ~50-60 words. Use the actual drug names, actual dosages, actual side effects from the FDA data provided.
- Scene 6 (or 7): CLOSING — Recap key points, encourage them to contact their care team. ~30 words.

TOTAL script across all scenes: 300-400 words (this produces a ~50-60 second video).

CRITICAL RULES:
1. You are a health education guide, NOT the doctor. Say "your doctor prescribed" / "${doctorName} recommended" — NEVER "I prescribed"
2. ONLY use medical facts from the FDA/DailyMed data provided below. If the data doesn't cover something, say "ask your care team about..."
3. Reference the patient's SPECIFIC medications by name and dose
4. Reference the patient's SPECIFIC condition by name
5. Each "visual" MUST contain exact text, exact numbers, exact labels — e.g., "Text overlay: 'Metformin 500mg — Take twice daily with meals'. Pill icon with morning/evening clock."
6. NEVER use vague visuals like "medical background" or "health imagery" — describe exactly what is shown
7. For the patient's condition, use real pathophysiology explanations (simplified) from the data — NOT generic "vital energy" or wellness talk`

  const userPrompt = [
    `=== PATIENT PROFILE ===`,
    patientContext,
    ``,
    `=== EPISODE TOPIC ===`,
    `Title: ${episode.title}`,
    `Description: ${episode.description}`,
    ``,
    `=== FDA DRUG DATA (from OpenFDA — USE THIS DATA in your script) ===`,
    medSummaries || '(no FDA data available — focus on condition education)',
    ``,
    `=== DAILYMED LABEL DATA (USE THIS DATA in your script) ===`,
    dailyMedSummaries || '(no DailyMed data available)',
    ``,
    `IMPORTANT: Write 5-7 scenes totaling 300-400 words. Each scene must reference SPECIFIC facts from the FDA/DailyMed data above (drug names, dosages, side effects, warnings). Each visual must describe EXACTLY what text, numbers, and icons appear on screen. Output valid JSON only — no markdown, no explanation outside the JSON.`,
  ].join('\n')

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * Build a complete episode context: gather clinical data + synthesize
 * through Perplexity into structured scene scripts.
 *
 * @param {{ patient: object, episode: { title: string, description: string } }} params
 * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
 */
export async function buildEpisodeContext({ patient, episode, episodeNumber }) {
  // Cache key based on patient diagnosis + episode title
  const cacheKey = JSON.stringify({
    diagnosis: patient.diagnosis,
    meds: (patient.medications || []).map((m) => m.name).sort(),
    episodeTitle: episode.title,
    episodeNumber: episodeNumber || 0,
  })

  const cached = getCached(cacheKey)
  if (cached) {
    console.log(`[ContextEngine] Cache hit for "${episode.title}"`)
    return { ok: true, data: cached, fromCache: true }
  }

  console.log(`[ContextEngine] Building context for "${episode.title}" (episode ${episodeNumber || '?'})...`)

  // Step 1: Gather clinical data in parallel (needed for both hardcoded and Perplexity paths)
  let clinicalData = { fdaDrugData: [], dailyMedLabels: [] }
  try {
    clinicalData = await gatherClinicalData(patient)
    console.log(`[ContextEngine] FDA data: ${clinicalData.fdaDrugData.filter((d) => d.label).length} labels found`)
    console.log(`[ContextEngine] DailyMed data: ${clinicalData.dailyMedLabels.filter((d) => d.label).length} labels found`)
  } catch (e) {
    console.warn('[ContextEngine] Clinical data fetch failed (continuing):', e.message)
  }

  // Step 2: Use HARDCODED episode builders (episodes 1-7)
  // These produce deterministic, topic-locked scenes that never bleed into other episodes.
  const epNum = parseInt(episodeNumber, 10)
  if (epNum >= 1 && epNum <= 7) {
    console.log(`[ContextEngine] Using hardcoded builder for episode ${epNum}`)
    const hardcoded = buildHardcodedEpisode(epNum, patient, clinicalData)

    const scenes = hardcoded.scenes || []
    const greeting = scenes[0]?.script || ''
    const closing = scenes[scenes.length - 1]?.script || ''
    const mainContent = scenes.slice(1, -1).map((s) => s.script).join(' ')

    const totalWords = scenes.reduce((n, s) => n + (s.script || '').split(/\s+/).length, 0)
    console.log(`[ContextEngine] "${episode.title}": ${scenes.length} scenes, ${totalWords} words (hardcoded)`)

    const result = {
      scenes,
      greeting,
      mainContent,
      closing,
      keyPoints: hardcoded.keyPoints || [],
      sources: hardcoded.sources || [],
      clinicalData: {
        fdaDrugsFound: clinicalData.fdaDrugData.filter((d) => d.label).length,
        dailyMedFound: clinicalData.dailyMedLabels.filter((d) => d.label).length,
      },
      fromPerplexity: false,
      fromHardcoded: true,
    }

    setCache(cacheKey, result)
    return { ok: true, data: result }
  }

  // Step 3 (fallback for non-standard episodes): Synthesize through Perplexity Sonar
  const perplexityKey = getPerplexityKey()
  if (!perplexityKey) {
    const fallback = buildFallbackContext({ patient, episode, clinicalData })
    return { ok: true, data: fallback, fromPerplexity: false }
  }

  const messages = buildSynthesisPrompt({
    patient,
    episode,
    fdaDrugData: clinicalData.fdaDrugData,
    dailyMedLabels: clinicalData.dailyMedLabels,
  })

  const sonarResult = await perplexitySonarChat({
    apiKey: perplexityKey,
    model: 'sonar',
    messages,
    max_tokens: 2500,
    temperature: 0.2,
    search_recency_filter: 'month',
  })

  if (!sonarResult.ok) {
    console.warn(`[ContextEngine] Perplexity failed for "${episode.title}":`, sonarResult.error)
    const fallback = buildFallbackContext({ patient, episode, clinicalData })
    return { ok: true, data: fallback, fromPerplexity: false }
  }

  // Parse the JSON response from Perplexity
  let parsed
  try {
    const content = sonarResult.data.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
  } catch (e) {
    console.warn(`[ContextEngine] JSON parse failed for "${episode.title}", using raw content`)
    parsed = {
      scenes: [
        { script: `Hi ${patient.name}, let's talk about ${episode.title.toLowerCase()}.`, visual: `Welcome screen: "${patient.name}" in large text, episode title "${episode.title}" below. Warm blue gradient.` },
        { script: sonarResult.data.content, visual: `Educational content with key medical terms highlighted as text overlays.` },
        { script: `Remember, your care team is here for you. Don't hesitate to reach out with questions.`, visual: `Summary card with care team phone number and "Contact your care team" button.` },
      ],
      keyPoints: [],
      sources: [],
    }
  }

  // Normalize scenes
  let scenes = []
  if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
    scenes = parsed.scenes.map((s) => ({
      script: typeof s === 'string' ? s : (s.script || ''),
      visual: typeof s === 'string' ? '' : (s.visual || ''),
    }))
  } else {
    const g = typeof parsed.greeting === 'string' ? parsed.greeting : parsed.greeting?.script || ''
    const c = typeof parsed.closing === 'string' ? parsed.closing : parsed.closing?.script || ''
    const gv = typeof parsed.greeting === 'object' ? parsed.greeting?.visual || '' : ''
    const cv = typeof parsed.closing === 'object' ? parsed.closing?.visual || '' : ''
    scenes.push({ script: g || `Hi ${patient.name}, today we'll cover ${episode.title.toLowerCase()}.`, visual: gv })
    if (Array.isArray(parsed.mainContent)) {
      for (const s of parsed.mainContent) {
        scenes.push({ script: typeof s === 'string' ? s : s.script || '', visual: typeof s === 'string' ? '' : s.visual || '' })
      }
    } else if (typeof parsed.mainContent === 'string') {
      scenes.push({ script: parsed.mainContent, visual: '' })
    }
    scenes.push({ script: c || 'Your care team is here to support you.', visual: cv })
  }

  const greeting = scenes[0]?.script || ''
  const closing = scenes[scenes.length - 1]?.script || ''
  const mainContent = scenes.slice(1, -1).map((s) => s.script).join(' ')

  const totalWords = scenes.reduce((n, s) => n + (s.script || '').split(/\s+/).length, 0)
  console.log(`[ContextEngine] "${episode.title}": ${scenes.length} scenes, ${totalWords} words`)

  const result = {
    scenes,
    greeting,
    mainContent,
    closing,
    keyPoints: parsed.keyPoints || [],
    sources: parsed.sources || [],
    clinicalData: {
      fdaDrugsFound: clinicalData.fdaDrugData.filter((d) => d.label).length,
      dailyMedFound: clinicalData.dailyMedLabels.filter((d) => d.label).length,
    },
    fromPerplexity: true,
  }

  setCache(cacheKey, result)
  console.log(`[ContextEngine] Context built for "${episode.title}" (${result.mainContent.length} chars)`)

  return { ok: true, data: result }
}

// ── fallback (no Perplexity key) ─────────────────────────────────

function buildFallbackContext({ patient, episode, clinicalData }) {
  const name = patient.name || 'there'
  const medNames = (patient.medications || []).map((m) => m.name).join(', ')
  const doctorName = patient.careTeam?.[0]?.name || 'your doctor'

  // Extract useful bits from FDA data
  const warnings = (clinicalData.fdaDrugData || [])
    .filter((d) => d.label?.warnings)
    .map((d) => `${d.medication}: ${d.label.warnings.slice(0, 150)}`)
    .slice(0, 2)

  const meds = patient.medications || []

  // Build detailed fallback scenes
  const scenes = []

  // Scene 1: Greeting
  scenes.push({
    script: `Hi ${name}! Welcome to your care education series. Today we're going to help you understand ${episode.title.toLowerCase()}. ${doctorName} has put together a care plan specifically for you, and we're here to walk you through it step by step.`,
    visual: `Welcome screen: "${name}" in large friendly text. Below: episode title "${episode.title}". Doctor name "${doctorName}" with stethoscope icon. Warm blue gradient background.`,
  })

  // Scene 2-4: Medication details
  if (meds.length > 0) {
    for (const med of meds.slice(0, 3)) {
      const w = warnings.find((ww) => ww.includes(med.name))
      scenes.push({
        script: `${doctorName} has prescribed ${med.name} ${med.dose}, which you'll take ${med.frequency}. This medication is for ${med.purpose}. ${med.instructions ? `Remember: ${med.instructions}.` : ''} ${w ? `One important thing to know: ${w.split(': ')[1] || ''}` : 'Be sure to let your care team know if you notice any side effects.'}`,
        visual: `Medication card: "${med.name} ${med.dose}" in bold. Clock icon showing "${med.frequency}". Purpose: "${med.purpose}". ${med.instructions ? `Tip text: "${med.instructions}"` : ''} Pill bottle icon with label.`,
      })
    }
  } else {
    scenes.push({
      script: `Your doctor has designed a care plan specifically for your needs. This episode focuses on ${episode.description.toLowerCase()}.`,
      visual: `Care plan overview card with patient name and diagnosis. Checklist icon with key milestones.`,
    })
  }

  // Scene 5: Goals
  if (patient.goals?.length) {
    scenes.push({
      script: `One of the most important goals ${doctorName} has set with you is to ${patient.goals[0].toLowerCase()}. ${patient.goals[1] ? `You're also working toward: ${patient.goals[1].toLowerCase()}.` : ''} These are achievable targets, and your care team will help you track your progress.`,
      visual: `Goals dashboard: Goal 1: "${patient.goals[0]}" with target icon. ${patient.goals[1] ? `Goal 2: "${patient.goals[1]}" with progress bar.` : ''} Green checkmark indicators.`,
    })
  }

  // Scene 6: Closing
  scenes.push({
    script: `If you have any questions about what your doctor has recommended, don't hesitate to reach out to your care team. They're here to support you every step of the way. You're doing great by watching this — knowledge is a powerful part of your care.`,
    visual: `Summary card: "Your Care Team" with names listed. Phone icon with "Questions? Call your care team" banner. Animated checkmarks for each key takeaway.`,
  })

  const greeting = scenes[0]?.script || ''
  const closing = scenes[scenes.length - 1]?.script || ''
  const mainContent = scenes.slice(1, -1).map((s) => s.script).join(' ')

  return {
    scenes,
    greeting,
    mainContent,
    closing,
    keyPoints: [
      `Take medications as prescribed by your doctor`,
      `Monitor your symptoms daily`,
      `Contact your care team if anything concerns you`,
    ],
    sources: warnings.length
      ? warnings.map((w) => `FDA Drug Label: ${w}`)
      : ['FDA OpenFDA Drug Labels', 'DailyMed NLM Drug Information'],
    clinicalData: {
      fdaDrugsFound: (clinicalData.fdaDrugData || []).filter((d) => d.label).length,
      dailyMedFound: (clinicalData.dailyMedLabels || []).filter((d) => d.label).length,
    },
    fromPerplexity: false,
  }
}
