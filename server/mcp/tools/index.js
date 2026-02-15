import { registerGetMedicationScheduleTool } from './getMedicationSchedule.js'
import { registerGetPatientContextTool } from './getPatientContext.js'
import { registerLogMedicationTakenTool } from './logMedicationTaken.js'
import { registerResearchMedicalTopicTool } from './researchMedicalTopic.js'
import { registerSearchClinicalEvidenceTool } from './searchClinicalEvidence.js'
import { registerSendReminderTool } from './sendReminder.js'

export const TOOL_NAMES = [
  'get_patient_context',
  'get_medication_schedule',
  'search_clinical_evidence',
  'research_medical_topic',
  'log_medication_taken',
  'send_reminder',
]

export function registerTools(server, deps) {
  registerGetPatientContextTool(server, deps)
  registerGetMedicationScheduleTool(server, deps)
  registerSearchClinicalEvidenceTool(server, deps)
  registerResearchMedicalTopicTool(server, deps)
  registerLogMedicationTakenTool(server, deps)
  registerSendReminderTool(server, deps)
}

