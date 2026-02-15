const CLINICAL_TRIALS_API_URL = 'https://clinicaltrials.gov/api/v2/studies'

const buildQueryTerm = ({ diagnosis, episodeTitle, dayTitle }) => {
  const base = [diagnosis, episodeTitle || dayTitle].filter(Boolean).join(' ')
  return base || 'patient education'
}

const buildFallbackTerms = ({ diagnosis }, primaryTerm) => {
  const terms = []
  if (diagnosis && diagnosis !== primaryTerm) terms.push(diagnosis)
  if (!terms.includes('patient education')) terms.push('patient education')
  return terms
}

const normalizeStudy = (study) => {
  const conditions = study?.protocolSection?.conditionsModule || {}
  const description = study?.protocolSection?.descriptionModule || {}
  const interventionsModule =
    study?.protocolSection?.armsInterventionsModule ||
    study?.protocolSection?.interventionsModule ||
    {}
  const outcomesModule = study?.protocolSection?.outcomesModule || {}

  return {
    conditions: conditions?.conditions || [],
    briefSummary: description?.briefSummary || null,
    interventions: (interventionsModule?.interventions || [])
      .map((item) => item?.name || item?.description || item?.type)
      .filter(Boolean),
    primaryOutcomes: (outcomesModule?.primaryOutcomes || []).map((item) => ({
      measure: item?.measure || null,
      timeFrame: item?.timeFrame || null,
    })),
  }
}

const summarizeStudies = ({ studies, context }) => {
  const { patientName, diagnosis, episodeTitle, dayTitle } = context
  const name = patientName || 'the patient'
  const topic = diagnosis || 'your care plan'

  if (!studies.length) {
    return {
      summary: 'No matching clinical studies found for this topic.',
      sources: [],
    }
  }

  const topStudies = studies.slice(0, 3)
  const conditionTerms = topStudies.flatMap((s) => s.conditions).filter(Boolean).slice(0, 4)
  const interventionTerms = topStudies.flatMap((s) => s.interventions).filter(Boolean).slice(0, 3)
  const primaryOutcomeTerms = topStudies.flatMap((s) => s.primaryOutcomes).map((o) => o?.measure).filter(Boolean).slice(0, 3)

  const parts = []
  if (conditionTerms.length) parts.push(`conditions: ${conditionTerms.join(', ')}`)
  if (interventionTerms.length) parts.push(`interventions: ${interventionTerms.join(', ')}`)
  if (primaryOutcomeTerms.length) parts.push(`primary outcomes: ${primaryOutcomeTerms.join(', ')}`)

  return {
    summary: `Clinical data highlight: ${parts.join(' • ') || 'recent studies focus on patient education.'}`,
    sources: topStudies.flatMap((s) => [
      ...(s.conditions || []).map((c) => ({ label: 'Condition', detail: c })),
      ...(s.interventions || []).map((i) => ({ label: 'Intervention', detail: i })),
      ...(s.primaryOutcomes || []).map((o) => ({ label: 'Primary Outcome', detail: o?.measure })),
    ]).filter((e) => e?.detail),
  }
}

export async function searchClinicalData({ diagnosis, episodeTitle, dayTitle, patientName, query, pageSize = 5 }) {
  const fetchStudies = async (term) => {
    const params = new URLSearchParams({ 'query.term': term, pageSize: `${pageSize}`, countTotal: 'true' })
    const res = await fetch(`${CLINICAL_TRIALS_API_URL}?${params}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return { ok: false, error: `http_${res.status}` }
    const json = await res.json().catch(() => null)
    return { ok: true, studies: (json?.studies || []).map(normalizeStudy), term }
  }

  const primaryTerm = query || buildQueryTerm({ diagnosis, episodeTitle, dayTitle })
  let result = await fetchStudies(primaryTerm)
  if (!result.ok) return result

  if (result.studies.length === 0 && !query) {
    for (const fb of buildFallbackTerms({ diagnosis }, primaryTerm)) {
      const fbResult = await fetchStudies(fb)
      if (fbResult.ok) { result = fbResult; if (fbResult.studies.length > 0) break }
    }
  }

  return {
    ok: true,
    data: summarizeStudies({ studies: result.studies, context: { patientName, diagnosis, episodeTitle, dayTitle } }),
    raw: { studies: result.studies, term: result.term },
  }
}
