import { z } from 'zod'

export function registerSendReminderTool(server, { api }) {
  server.tool(
    'send_reminder',
    'Triggers a medication reminder for a registered patient via Poke (SMS/iMessage/WhatsApp). Optionally targets a specific medication.',
    {
      patientId: z.string().describe('The patient ID from MedFlix'),
      medicationName: z.string().optional().describe('Specific medication name, or omit to remind about all'),
    },
    async ({ patientId, medicationName }) => {
      try {
        const data = await api('/api/poke/send-reminder', { patientId, medicationName })
        if (data.error) {
          return { content: [{ type: 'text', text: `Failed to send: ${data.error}` }] }
        }
        return { content: [{ type: 'text', text: data.message || 'Reminder sent successfully.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] }
      }
    }
  )
}

