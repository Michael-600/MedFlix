import { z } from 'zod'

export function registerGetPatientContextTool(server, { api }) {
  server.tool(
    'get_patient_context',
    'Fetches clinical trial evidence from ClinicalTrials.gov and latest medical research from Perplexity Sonar for a patient\'s diagnosis. Use this to understand the patient\'s condition before crafting reminders or answering questions.',
    {
      patientName: z.string().describe('The patient\'s name'),
      diagnosis: z.string().describe('The patient\'s diagnosis, e.g. "Type 2 Diabetes"'),
      topic: z.string().optional().describe('Optional focus topic, e.g. "medication adherence" or "post-surgery recovery"'),
    },
    async ({ patientName, diagnosis, topic }) => {
      try {
        const clinical = await api('/api/clinical/search', {
          diagnosis,
          patientName,
          episodeTitle: topic || undefined,
        })

        const openEvidence = clinical.ok ? clinical.data : null

        const perplexity = await api('/api/perplexity/research', {
          patient: { name: patientName, diagnosis },
          episode: { title: topic || `${diagnosis} medication management` },
          openEvidence,
        })

        const sonarContent = perplexity.ok ? perplexity.data?.content : null

        const sections = []
        sections.push(`## Patient: ${patientName}`)
        sections.push(`## Diagnosis: ${diagnosis}`)
        if (topic) sections.push(`## Focus: ${topic}`)

        if (openEvidence?.summary) {
          sections.push(`\n### Clinical Evidence (ClinicalTrials.gov)\n${openEvidence.summary}`)
          if (openEvidence.sources?.length) {
            const srcLines = openEvidence.sources.map(s => `- ${s.label}: ${s.detail}`).join('\n')
            sections.push(srcLines)
          }
        } else {
          sections.push('\n### Clinical Evidence\nNo matching clinical trials found.')
        }

        if (sonarContent) {
          sections.push(`\n### Latest Medical Research (Perplexity Sonar)\n${sonarContent}`)
        } else {
          sections.push('\n### Latest Medical Research\nPerplexity research not available.')
        }

        return { content: [{ type: 'text', text: sections.join('\n') }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error fetching patient context: ${e.message}` }] }
      }
    }
  )
}

