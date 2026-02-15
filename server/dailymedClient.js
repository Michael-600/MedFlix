/**
 * DailyMed API Client
 *
 * Fetches Structured Product Labeling (SPL) data from the
 * National Library of Medicine's DailyMed service.
 *
 * Endpoints used:
 *   - SPL search:  https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json
 *   - SPL detail:  https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setId}.json
 */

const BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2'
const TIMEOUT_MS = 12_000

// ── helpers ──────────────────────────────────────────────────────

async function fetchJSON(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function truncate(text, limit = 2000) {
  if (!text || typeof text !== 'string') return text
  return text.length > limit ? text.slice(0, limit) + '…' : text
}

// ── SPL search ───────────────────────────────────────────────────

/**
 * Search DailyMed for SPL entries matching a drug name.
 *
 * @param {string} drugName – generic or brand name
 * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
 */
export async function fetchDrugLabel(drugName) {
  if (!drugName) return { ok: false, error: 'missing drugName' }

  const term = encodeURIComponent(drugName.toLowerCase())
  const searchUrl = `${BASE_URL}/spls.json?drug_name=${term}&pagesize=1`

  const searchJson = await fetchJSON(searchUrl)
  const spls = searchJson?.data
  if (!Array.isArray(spls) || spls.length === 0) {
    return { ok: false, error: `no DailyMed SPL found for "${drugName}"` }
  }

  const setId = spls[0]?.setid
  if (!setId) {
    return { ok: false, error: `no setId in DailyMed response for "${drugName}"` }
  }

  // Fetch full SPL detail
  const detailUrl = `${BASE_URL}/spls/${setId}.json`
  const detailJson = await fetchJSON(detailUrl)

  if (!detailJson) {
    // Fall back to the minimal search result
    return {
      ok: true,
      data: {
        drugName,
        setId,
        title: spls[0]?.title || null,
        published: spls[0]?.published_date || null,
        sections: [],
      },
    }
  }

  // Extract key sections from SPL
  const sections = []
  const labelSections = detailJson?.data?.sections || detailJson?.sections || []
  for (const section of labelSections) {
    if (!section?.name || !section?.text) continue
    sections.push({
      name: section.name,
      text: truncate(section.text, 1500),
    })
  }

  return {
    ok: true,
    data: {
      drugName,
      setId,
      title: detailJson?.data?.title || spls[0]?.title || null,
      published: detailJson?.data?.published_date || spls[0]?.published_date || null,
      sections,
    },
  }
}

// ── batch ────────────────────────────────────────────────────────

/**
 * Fetch DailyMed labels for every medication in the list.
 * Runs all calls in parallel.
 *
 * @param {Array<{ name: string, genericName?: string }>} medications
 * @returns {Promise<object[]>}
 */
export async function fetchAllDrugLabels(medications = []) {
  const results = await Promise.all(
    medications.map(async (med) => {
      const searchName = med.genericName || med.name
      const result = await fetchDrugLabel(searchName)
      return {
        medication: med.name,
        genericName: searchName,
        label: result.ok ? result.data : null,
        error: result.ok ? null : result.error,
      }
    })
  )
  return results
}
