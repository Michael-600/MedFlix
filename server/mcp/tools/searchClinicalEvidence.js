import { z } from 'zod'

export function registerSearchClinicalEvidenceTool(server, { api }) {
  server.tool(
    'search_clinical_evidence',
    'Searches ClinicalTrials.gov for clinical trial data related to a diagnosis or medical topic. Use when a patient asks about specific treatments, side effects, or clinical outcomes.',
    {
      query: z.string().describe('Search query, e.g. "metformin side effects" or "knee replacement recovery exercises"'),
      diagnosis: z.string().optional().describe('Optional diagnosis to narrow results'),
    },
    async ({ query, diagnosis }) => {
      try {
        const data = await api('/api/clinical/search', { query, diagnosis })
        if (!data.ok) {
          return { content: [{ type: 'text', text: `Search failed: ${data.error}` }] }
        }

        const sections = []
        if (data.data?.summary) sections.push(data.data.summary)
        if (data.data?.sources?.length) {
          sections.push('\nKey findings:')
          data.data.sources.forEach(s => sections.push(`- ${s.label}: ${s.detail}`))
        }
        if (data.raw?.studies?.length) {
          sections.push(`\n(Based on ${data.raw.studies.length} studies, search term: "${data.raw.term}")`)
        }

        return { content: [{ type: 'text', text: sections.join('\n') || 'No results found.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )
}

