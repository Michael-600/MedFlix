const CLINICAL_TRIALS_API_URL =
  'https://clinicaltrials.gov/api/v2/studies'

const DEFAULT_INSTRUCTION = 'Tailor the script to the patient.'

const buildQueryTerm = ({ diagnosis, episodeTitle, dayTitle }) => {
  const base = [diagnosis, episodeTitle || dayTitle].filter(Boolean).join(' ')
  return base || 'patient education'
}

const buildFallbackTerms = ({ diagnosis }, primaryTerm) => {
  const terms = []
  if (diagnosis && diagnosis !== primaryTerm) {
    terms.push(diagnosis)
  }
  if (!terms.includes('patient education')) {
    terms.push('patient education')
  }
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
    detailedDescription: description?.detailedDescription || null,
    interventions: (interventionsModule?.interventions || [])
      .map((item) => item?.name || item?.description || item?.type)
      .filter(Boolean),
    primaryOutcomes: (outcomesModule?.primaryOutcomes || []).map((item) => ({
      measure: item?.measure || null,
      timeFrame: item?.timeFrame || null,
      description: item?.description || null,
    })),
    secondaryOutcomes: (outcomesModule?.secondaryOutcomes || []).map((item) => ({
      measure: item?.measure || null,
      timeFrame: item?.timeFrame || null,
      description: item?.description || null,
    })),
  }
}

const summarizeStudies = ({ studies, context }) => {
  const { patientName, diagnosis, episodeTitle, dayTitle } = context
  const name = patientName || 'the patient'
  const topic = diagnosis || 'your care plan'
  const title = episodeTitle || dayTitle || 'today\'s episode'

  if (!studies.length) {
    return {
      script: `Hi ${name}, in ${title} we\'ll focus on what ${topic} means for you and the steps ahead. We\'ll break the plan into clear, manageable actions so you know exactly what to expect. If anything feels unclear, pause and review the key points before moving on. You\'re not alone in this, and your care team is here to help you succeed.`,
      summary: 'Clinical data highlight: no matching clinical studies were found for this exact topic, so we focused on general patient education best practices.',
      sources: [],
    }
  }

  const topStudies = studies.slice(0, 3)
  const conditionTerms = topStudies
    .flatMap((study) => study.conditions || [])
    .filter(Boolean)
    .slice(0, 4)
  const interventionTerms = topStudies
    .flatMap((study) => study.interventions || [])
    .filter(Boolean)
    .slice(0, 3)
  const primaryOutcomeTerms = topStudies
    .flatMap((study) => study.primaryOutcomes || [])
    .map((item) => item?.measure)
    .filter(Boolean)
    .slice(0, 3)

  const highlightParts = []
  if (conditionTerms.length) highlightParts.push(`conditions: ${conditionTerms.join(', ')}`)
  if (interventionTerms.length) highlightParts.push(`interventions: ${interventionTerms.join(', ')}`)
  if (primaryOutcomeTerms.length) highlightParts.push(`primary outcomes: ${primaryOutcomeTerms.join(', ')}`)
  const highlight = highlightParts.join(' • ')

  return {
    script: `Hi ${name}, in ${title} we\'ll focus on what ${topic} means for you and the steps ahead. We\'ll walk through the most important actions you can take and why they matter. I\'ll connect each step back to your goals, so you feel confident and informed. If anything feels unclear, pause and review the key points before moving on. Remember, your care team is here to support you throughout this process.`,
    summary: `Clinical data highlight: ${highlight || 'recent studies focus on patient education and care planning.'}`,
    sources: topStudies
      .flatMap((study) => [
        ...(study.conditions || []).map((condition) => ({ label: 'Condition', detail: condition })),
        ...(study.interventions || []).map((intervention) => ({ label: 'Intervention', detail: intervention })),
        ...(study.primaryOutcomes || []).map((outcome) => ({
          label: 'Primary Outcome',
          detail: outcome?.measure || 'Outcome measure',
        })),
      ])
      .filter((entry) => entry?.detail),
  }
}

export async function searchClinicalData({
  patientName,
  diagnosis,
  episodeTitle,
  dayTitle,
  dayDescription,
  query,
  instruction = DEFAULT_INSTRUCTION,
  pageSize = 5,
}) {
  const fetchStudies = async (term) => {
    const params = new URLSearchParams({
      'query.term': term,
      pageSize: `${pageSize}`,
      countTotal: 'true',
    })

    const url = `${CLINICAL_TRIALS_API_URL}?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return { ok: false, error: `http_${response.status}`, detail, term }
    }

    const json = await response.json().catch(() => null)
    const rawStudies = Array.isArray(json?.studies) ? json.studies : []
    const studies = rawStudies.map(normalizeStudy)

    return { ok: true, studies, raw: json, term }
  }

  const primaryTerm = query || buildQueryTerm({ diagnosis, episodeTitle, dayTitle })
  let result = await fetchStudies(primaryTerm)
  let lastError = null

  if (!result.ok) {
    return result
  }

  if (result.studies.length === 0 && !query) {
    const fallbackTerms = buildFallbackTerms({ diagnosis }, primaryTerm)
    for (const fallbackTerm of fallbackTerms) {
      const fallbackResult = await fetchStudies(fallbackTerm)
      if (!fallbackResult.ok) {
        lastError = fallbackResult
        continue
      }
      result = fallbackResult
      if (fallbackResult.studies.length > 0) {
        break
      }
    }
  }

  if (!result.ok && lastError) {
    return lastError
  }

  const data = summarizeStudies({
    studies: result.studies,
    context: {
      patientName,
      diagnosis,
      episodeTitle,
      dayTitle,
      dayDescription,
      instruction,
    },
  })

  return {
    ok: true,
    data,
    raw: {
      studies: result.studies,
      term: result.term,
    },
  }
}
