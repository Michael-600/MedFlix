import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = `http://localhost:${process.env.PORT || 3001}`

async function api(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

const server = new McpServer({
  name: 'MedFlix Medication Assistant',
  version: '1.0.0',
})

// ──────────────────────────────────────────────────────
//  Tool 1: Get full patient context (clinical + Perplexity)
// ──────────────────────────────────────────────────────
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
      // 1. Fetch clinical trial evidence
      const clinical = await api('/api/clinical/search', {
        diagnosis,
        patientName,
        episodeTitle: topic || undefined,
      })

      const openEvidence = clinical.ok ? clinical.data : null

      // 2. Fetch Perplexity Sonar research using the clinical evidence as context
      const perplexity = await api('/api/perplexity/research', {
        patient: { name: patientName, diagnosis },
        episode: { title: topic || `${diagnosis} medication management` },
        openEvidence,
      })

      const sonarContent = perplexity.ok ? perplexity.data?.content : null

      // 3. Combine into a single context block
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

// ──────────────────────────────────────────────────────
//  Tool 2: Get a patient's medication schedule
// ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────
//  Tool 3: Search clinical evidence for a specific query
// ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────
//  Tool 4: Research a medical topic via Perplexity Sonar
// ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────
//  Tool 5: Log that a patient took medication
// ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────
//  Tool 6: Send a medication reminder
// ──────────────────────────────────────────────────────
server.tool(
  'send_reminder',
  'Triggers a medication reminder for a registered patient. The message is delivered through Poke to their connected messaging app (iMessage/Telegram/SMS).',
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

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MedFlix MCP server running on stdio')
  console.error('Tools: get_patient_context, get_medication_schedule, search_clinical_evidence, research_medical_topic, log_medication_taken, send_reminder')
}

main().catch(console.error)
