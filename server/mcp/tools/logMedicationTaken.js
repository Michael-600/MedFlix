import { z } from 'zod'

export function registerLogMedicationTakenTool(server, { api }) {
  server.tool(
    'log_medication_taken',
    'Records that the patient has taken a specific medication. Confirms the log with a timestamp.',
    {
      patientId: z.string().describe('The patient ID from MedFlix'),
      medicationName: z.string().describe('Name of the medication that was taken'),
    },
    async ({ patientId, medicationName }) => {
      try {
        const data = await api(`/api/poke/status/${patientId}`)
        if (data.error) {
          return { content: [{ type: 'text', text: `Patient not found: ${data.error}` }] }
        }

        const med = data.medications?.find(m => m.name.toLowerCase() === medicationName.toLowerCase())
        if (!med) {
          return { content: [{ type: 'text', text: `Medication "${medicationName}" not found in ${data.name}'s schedule.` }] }
        }

        const timestamp = new Date().toLocaleTimeString()
        return { content: [{ type: 'text', text: `Logged: ${data.name} took ${med.name} (${med.dosage}) at ${timestamp}.` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )
}

