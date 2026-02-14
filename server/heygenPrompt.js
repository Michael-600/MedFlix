function compactJson(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function buildPerplexityDeepResearchPrompt({ patient, episode, openEvidence }) {
  const patientName = patient?.name || 'the patient'
  const diagnosis = patient?.diagnosis || 'the condition'
  const age = patient?.age ? `Age: ${patient.age}` : null
  const sex = patient?.sex ? `Sex: ${patient.sex}` : null
  const procedure = patient?.procedure ? `Procedure: ${patient.procedure}` : null

  const episodeTitle = episode?.title || episode?.episodeTitle || 'the episode'
  const episodeDescription = episode?.description || null

  const evidenceSummary = openEvidence?.summary || null
  const evidenceSources = Array.isArray(openEvidence?.sources) ? openEvidence.sources.slice(0, 12) : []

  const patientLines = [
    `Name: ${patientName}`,
    age,
    sex,
    `Diagnosis: ${diagnosis}`,
    procedure,
  ].filter(Boolean)

  const evidenceLines = [
    evidenceSummary ? `Summary: ${evidenceSummary}` : null,
    evidenceSources.length
      ? `Signals: ${evidenceSources
          .map((s) => (s?.detail ? `${s.label}: ${s.detail}` : null))
          .filter(Boolean)
          .slice(0, 10)
          .join(' • ')}`
      : null,
  ].filter(Boolean)

  return [
    {
      role: 'system',
      content:
        'You are a clinical research assistant. Use web search to find high-quality, up-to-date clinical guidance and evidence. ' +
        'Write in clear patient-friendly language. Do not invent facts; if uncertain, say so. Avoid providing emergency/critical directives beyond general “seek care” guidance.',
    },
    {
      role: 'user',
      content:
        `Create "Research Notes" to help write a short, empathetic patient education video.\n\n` +
        `Patient context:\n- ${patientLines.join('\n- ')}\n\n` +
        `Episode focus:\n- Title: ${episodeTitle}` +
        (episodeDescription ? `\n- Description: ${episodeDescription}` : '') +
        `\n\nOpenEvidence context (from our clinical evidence tool):\n` +
        (evidenceLines.length ? `- ${evidenceLines.join('\n- ')}` : '- None provided') +
        `\n\nOutput format:\n` +
        `1) Key takeaways (5-8 bullets)\n` +
        `2) Practical actions (5-8 bullets)\n` +
        `3) Red flags / when to contact care team (3-6 bullets)\n` +
        `4) Questions to ask clinician (3-6 bullets)\n` +
        `5) Sources (3-6 lines with publication/site name + URL)\n`,
    },
  ]
}

export function buildHeyGenPrompt({
  basePrompt,
  patient,
  episode,
  openEvidence,
  sonarResearch,
}) {
  const patientName = patient?.name || 'Patient'
  const diagnosis = patient?.diagnosis || 'their condition'
  const episodeTitle = episode?.title || episode?.episodeTitle || null

  const evidenceSummary = openEvidence?.summary || null
  const researchNotes = sonarResearch?.content || null

  const sections = []
  sections.push(basePrompt || '')
  sections.push(
    `\n\nPATIENT CONTEXT:\n` +
      `- Name: ${patientName}\n` +
      `- Diagnosis: ${diagnosis}\n` +
      (patient?.procedure ? `- Procedure: ${patient.procedure}\n` : '') +
      (patient?.age ? `- Age: ${patient.age}\n` : '') +
      (patient?.sex ? `- Sex: ${patient.sex}\n` : '') +
      (episodeTitle ? `- Episode: ${episodeTitle}\n` : '')
  )

  if (evidenceSummary) {
    sections.push(`\nOPENEVIDENCE SUMMARY:\n${evidenceSummary}\n`)
  }

  if (researchNotes) {
    sections.push(`\nPERPLEXITY SONAR RESEARCH NOTES:\n${researchNotes}\n`)
  }

  sections.push(
    `\nVIDEO SCRIPT REQUIREMENTS:\n` +
      `- Length: 30–45 seconds.\n` +
      `- Tone: reassuring, concise, medically accurate, patient-friendly.\n` +
      `- Avoid jargon; define terms briefly.\n` +
      `- Give clear next steps; include a brief "when to contact your care team" line.\n` +
      `- Do not include URLs or citations in the spoken script.\n`
  )

  return sections.filter(Boolean).join('\n')
}

export function safePreview(value, limit = 4000) {
  const str = typeof value === 'string' ? value : compactJson(value)
  if (str.length <= limit) return str
  return `${str.slice(0, limit)}…`
}

