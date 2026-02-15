import { z } from 'zod'

export function registerResearchMedicalTopicTool(server, { api }) {
  server.tool(
    'research_medical_topic',
    'Uses Perplexity Sonar (web-search AI) to find the latest medical evidence on a topic. Returns key takeaways, practical actions, red flags, and questions for clinicians. Use when a patient asks a medical question.',
    {
      patientName: z.string().describe('Patient name for context'),
      diagnosis: z.string().describe('Patient diagnosis'),
      topic: z.string().describe('The specific medical topic or question to research'),
    },
    async ({ patientName, diagnosis, topic }) => {
      try {
        const data = await api('/api/perplexity/research', {
          patient: { name: patientName, diagnosis },
          episode: { title: topic, description: topic },
        })
        if (!data.ok) {
          return { content: [{ type: 'text', text: `Research unavailable: ${data.error}` }] }
        }

        return { content: [{ type: 'text', text: data.data?.content || 'No research content returned.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )
}

