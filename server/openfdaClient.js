/**
 * OpenFDA API Client
 *
 * Fetches drug label information and adverse event data from the
 * FDA's open API. No API key required (rate-limited to ~240 req/min
 * without key, 120k/day with key).
 *
 * Endpoints used:
 *   - Drug Labels: https://api.fda.gov/drug/label.json
 *   - Adverse Events: https://api.fda.gov/drug/event.json
 */

const LABEL_URL = 'https://api.fda.gov/drug/label.json'
const EVENT_URL = 'https://api.fda.gov/drug/event.json'

const TIMEOUT_MS = 12_000

// ── helpers ──────────────────────────────────────────────────────

function truncate(text, limit = 2000) {
  if (!text || typeof text !== 'string') return text
  return text.length > limit ? text.slice(0, limit) + '…' : text
}

function firstString(value) {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

async function fetchJSON(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ── drug label ───────────────────────────────────────────────────

/**
 * Fetch structured drug label data for a single medication.
 *
 * @param {string} drugName – generic or brand name (e.g. "metformin")
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export async function fetchDrugLabel(drugName) {
  if (!drugName) return { ok: false, error: 'missing drugName' }

  const term = encodeURIComponent(drugName.toLowerCase())
  // Search generic_name first, fall back to brand_name
  const url = `${LABEL_URL}?search=(openfda.generic_name:"${term}")+OR+(openfda.brand_name:"${term}")&limit=1`

  const json = await fetchJSON(url)
  if (!json?.results?.length) {
    return { ok: false, error: `no label found for "${drugName}"` }
  }

  const label = json.results[0]

  return {
    ok: true,
    data: {
      drugName,
      brandName: firstString(label.openfda?.brand_name),
      genericName: firstString(label.openfda?.generic_name),
      manufacturer: firstString(label.openfda?.manufacturer_name),
      indications: truncate(firstString(label.indications_and_usage)),
      dosage: truncate(firstString(label.dosage_and_administration)),
      warnings: truncate(firstString(label.warnings)),
      warningsAndPrecautions: truncate(firstString(label.warnings_and_precautions)),
      adverseReactions: truncate(firstString(label.adverse_reactions)),
      drugInteractions: truncate(firstString(label.drug_interactions)),
      patientCounseling: truncate(firstString(label.patient_counseling_information) || firstString(label.information_for_patients)),
      contraindications: truncate(firstString(label.contraindications)),
      overdosage: truncate(firstString(label.overdosage)),
    },
  }
}

// ── adverse events ───────────────────────────────────────────────

/**
 * Fetch the top adverse events reported for a drug.
 *
 * @param {string} drugName
 * @param {number} limit – number of top reactions to return
 * @returns {{ ok: boolean, data?: object[], error?: string }}
 */
export async function fetchAdverseEvents(drugName, limit = 10) {
  if (!drugName) return { ok: false, error: 'missing drugName' }

  const term = encodeURIComponent(drugName.toLowerCase())
  const url = `${EVENT_URL}?search=patient.drug.openfda.generic_name:"${term}"&count=patient.reaction.reactionmeddrapt.exact&limit=${limit}`

  const json = await fetchJSON(url)
  if (!json?.results?.length) {
    return { ok: false, error: `no adverse events for "${drugName}"` }
  }

  return {
    ok: true,
    data: json.results.map((r) => ({
      reaction: r.term,
      count: r.count,
    })),
  }
}

// ── batch ────────────────────────────────────────────────────────

/**
 * Fetch label + adverse events for every medication in the list.
 * Runs all calls in parallel for speed.
 *
 * @param {Array<{ name: string, genericName?: string }>} medications
 * @returns {Promise<object[]>}
 */
export async function fetchAllDrugInfo(medications = []) {
  const results = await Promise.all(
    medications.map(async (med) => {
      const searchName = med.genericName || med.name
      const [labelResult, eventsResult] = await Promise.all([
        fetchDrugLabel(searchName),
        fetchAdverseEvents(searchName, 8),
      ])
      return {
        medication: med.name,
        genericName: searchName,
        label: labelResult.ok ? labelResult.data : null,
        adverseEvents: eventsResult.ok ? eventsResult.data : null,
      }
    })
  )
  return results
}
