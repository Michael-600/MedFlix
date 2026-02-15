import { z } from 'zod'

export function registerGetMedicationScheduleTool(server, { api }) {
  server.tool(
    'get_medication_schedule',
    'Returns the patient\'s current medication list with dosages, times, and instructions.',
    { patientId: z.string().describe('The patient ID from MedFlix registration') },
    async ({ patientId }) => {
      try {
        const data = await api(`/api/poke/status/${patientId}`)
        if (data.error) {
          return { content: [{ type: 'text', text: `Patient not found: ${data.error}` }] }
        }

        const meds = data.medications || []
        if (meds.length === 0) {
          return { content: [{ type: 'text', text: `${data.name} has no medications configured.` }] }
        }

        const list = meds
          .filter(m => m.active)
          .map(m => `- ${m.name} ${m.dosage} at ${m.times?.join(', ') || 'unscheduled'}: ${m.instructions || 'no special instructions'}`)
          .join('\n')

        return { content: [{ type: 'text', text: `Medications for ${data.name}:\n${list}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )
}

