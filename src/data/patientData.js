/**
 * Patient Database
 *
 * Three fully detailed patient profiles for the MedFlix demo.
 * Each patient has a different condition, medications, care team, and goals.
 * During the hackathon demo, the doctor creates content for each patient live.
 */

// ═══════════════════════════════════════════════════════
//  PATIENT 1: Marcus Thompson — Type 2 Diabetes
// ═══════════════════════════════════════════════════════

const marcusThompson = {
  id: 'pt-001',
  name: 'Marcus Thompson',
  age: 54,
  sex: 'Male',
  diagnosis: 'Type 2 Diabetes Mellitus',
  diagnosisCode: 'E11.9',
  diagnosisDate: '2026-01-15',
  procedure: 'Lifestyle modification + Metformin initiation',
  allergies: ['Penicillin', 'Sulfa drugs'],
  medications: [
    {
      name: 'Metformin',
      genericName: 'metformin hydrochloride',
      dose: '500mg',
      frequency: 'twice daily',
      route: 'oral',
      purpose: 'Blood sugar control',
      instructions: 'Take with meals to reduce stomach upset',
    },
    {
      name: 'Lisinopril',
      genericName: 'lisinopril',
      dose: '10mg',
      frequency: 'once daily',
      route: 'oral',
      purpose: 'Blood pressure management',
      instructions: 'Take in the morning; report persistent cough',
    },
    {
      name: 'Atorvastatin',
      genericName: 'atorvastatin calcium',
      dose: '20mg',
      frequency: 'once daily',
      route: 'oral',
      purpose: 'Cholesterol reduction',
      instructions: 'Take in the evening; avoid grapefruit',
    },
  ],
  vitals: {
    bloodPressure: '138/86 mmHg',
    fastingGlucose: '210 mg/dL',
    hba1c: '8.2%',
    bmi: 31.4,
    weight: '218 lbs',
    height: '5\'10"',
    heartRate: '78 bpm',
  },
  conditions: ['Hypertension', 'Hyperlipidemia', 'Obesity'],
  lifestyle: {
    smokingStatus: 'Former smoker (quit 2019)',
    alcoholUse: 'Social (1-2 drinks/week)',
    exerciseLevel: 'Sedentary',
    diet: 'Standard American diet, high carbohydrate',
  },
  careTeam: [
    { name: 'Dr. Sarah Chen', role: 'Primary Care Physician', specialty: 'Internal Medicine' },
    { name: 'Maria Lopez, RN', role: 'Care Coordinator', specialty: 'Diabetes Education' },
    { name: 'James Park, PharmD', role: 'Clinical Pharmacist', specialty: 'Medication Management' },
  ],
  emergencyContact: {
    name: 'Linda Thompson',
    relation: 'Spouse',
    phone: '(555) 234-5678',
  },
  insurance: {
    provider: 'Blue Cross Blue Shield',
    planType: 'PPO',
    memberId: 'BCB-9948271',
  },
  goals: [
    'Reduce HbA1c to below 7.0% within 6 months',
    'Lose 15 lbs through diet and exercise',
    'Establish consistent daily walking routine (30 min/day)',
    'Master blood glucose self-monitoring',
    'Understand medication regimen and adherence',
  ],
}

// ═══════════════════════════════════════════════════════
//  PATIENT 2: Sarah Williams — Post-Knee Replacement
// ═══════════════════════════════════════════════════════

const sarahWilliams = {
  id: 'pt-002',
  name: 'Sarah Williams',
  age: 67,
  sex: 'Female',
  diagnosis: 'Post Total Knee Arthroplasty (Right Knee)',
  diagnosisCode: 'Z96.651',
  diagnosisDate: '2026-02-01',
  procedure: 'Right total knee replacement + post-operative rehabilitation',
  allergies: ['Codeine', 'Latex'],
  medications: [
    {
      name: 'Celecoxib',
      genericName: 'celecoxib',
      dose: '200mg',
      frequency: 'twice daily',
      route: 'oral',
      purpose: 'Anti-inflammatory pain relief',
      instructions: 'Take with food; stop if stomach pain or black stools occur',
    },
    {
      name: 'Acetaminophen',
      genericName: 'acetaminophen',
      dose: '1000mg',
      frequency: 'every 6 hours as needed',
      route: 'oral',
      purpose: 'Pain management',
      instructions: 'Do not exceed 3000mg/day; avoid with alcohol',
    },
    {
      name: 'Enoxaparin',
      genericName: 'enoxaparin sodium',
      dose: '40mg',
      frequency: 'once daily',
      route: 'subcutaneous injection',
      purpose: 'Blood clot prevention',
      instructions: 'Inject into abdomen; rotate injection sites; for 14 days post-surgery',
    },
    {
      name: 'Amlodipine',
      genericName: 'amlodipine besylate',
      dose: '5mg',
      frequency: 'once daily',
      route: 'oral',
      purpose: 'Blood pressure control',
      instructions: 'Take at the same time each day; report ankle swelling',
    },
  ],
  vitals: {
    bloodPressure: '142/88 mmHg',
    heartRate: '72 bpm',
    bmi: 28.6,
    weight: '168 lbs',
    height: '5\'5"',
    temperature: '98.4°F',
    oxygenSaturation: '97%',
  },
  conditions: ['Osteoarthritis', 'Hypertension', 'Osteoporosis'],
  lifestyle: {
    smokingStatus: 'Never smoker',
    alcoholUse: 'Occasional (wine with dinner)',
    exerciseLevel: 'Limited due to knee pain (pre-surgery)',
    diet: 'Mediterranean-style, calcium-rich',
  },
  careTeam: [
    { name: 'Dr. Michael Torres', role: 'Orthopedic Surgeon', specialty: 'Joint Replacement' },
    { name: 'Dr. Sarah Chen', role: 'Primary Care Physician', specialty: 'Internal Medicine' },
    { name: 'Karen White, PT', role: 'Physical Therapist', specialty: 'Post-Surgical Rehabilitation' },
    { name: 'James Park, PharmD', role: 'Clinical Pharmacist', specialty: 'Pain Management' },
  ],
  emergencyContact: {
    name: 'Robert Williams',
    relation: 'Husband',
    phone: '(555) 876-5432',
  },
  insurance: {
    provider: 'Medicare Advantage',
    planType: 'HMO',
    memberId: 'MA-4421876',
  },
  goals: [
    'Walk independently without a walker within 4 weeks',
    'Achieve 120 degrees knee flexion within 6 weeks',
    'Return to gardening and light activities within 8 weeks',
    'Complete all physical therapy sessions (3x/week for 6 weeks)',
    'Manage pain effectively with minimal narcotic use',
  ],
}

// ═══════════════════════════════════════════════════════
//  PATIENT 3: James Rivera — Chronic Heart Failure
// ═══════════════════════════════════════════════════════

const jamesRivera = {
  id: 'pt-003',
  name: 'James Rivera',
  age: 45,
  sex: 'Male',
  diagnosis: 'Heart Failure with Reduced Ejection Fraction (HFrEF), NYHA Class II',
  diagnosisCode: 'I50.20',
  diagnosisDate: '2025-11-20',
  procedure: 'Guideline-directed medical therapy + cardiac rehabilitation',
  allergies: ['ACE inhibitors (cough)', 'Shellfish'],
  medications: [
    {
      name: 'Sacubitril/Valsartan',
      genericName: 'sacubitril/valsartan',
      dose: '49/51mg',
      frequency: 'twice daily',
      route: 'oral',
      purpose: 'Heart failure management (ARNI)',
      instructions: 'Take with or without food; do not use with ACE inhibitors; report dizziness',
    },
    {
      name: 'Carvedilol',
      genericName: 'carvedilol',
      dose: '12.5mg',
      frequency: 'twice daily',
      route: 'oral',
      purpose: 'Heart rate and blood pressure control (beta-blocker)',
      instructions: 'Take with food; do not stop abruptly; report excessive fatigue or wheezing',
    },
    {
      name: 'Spironolactone',
      genericName: 'spironolactone',
      dose: '25mg',
      frequency: 'once daily',
      route: 'oral',
      purpose: 'Reduce fluid retention and cardiac remodeling',
      instructions: 'Monitor potassium levels; report muscle weakness or irregular heartbeat',
    },
    {
      name: 'Furosemide',
      genericName: 'furosemide',
      dose: '40mg',
      frequency: 'once daily (morning)',
      route: 'oral',
      purpose: 'Diuretic for fluid management',
      instructions: 'Take in the morning to avoid nighttime urination; weigh yourself daily',
    },
    {
      name: 'Dapagliflozin',
      genericName: 'dapagliflozin',
      dose: '10mg',
      frequency: 'once daily',
      route: 'oral',
      purpose: 'Heart failure outcomes improvement (SGLT2 inhibitor)',
      instructions: 'Stay hydrated; report signs of urinary tract infection',
    },
  ],
  vitals: {
    bloodPressure: '118/72 mmHg',
    heartRate: '68 bpm',
    ejectionFraction: '32%',
    bmi: 26.8,
    weight: '185 lbs',
    height: '5\'11"',
    bnp: '450 pg/mL',
    oxygenSaturation: '95%',
  },
  conditions: ['Dilated Cardiomyopathy', 'Atrial Fibrillation', 'Mild Renal Impairment'],
  lifestyle: {
    smokingStatus: 'Never smoker',
    alcoholUse: 'None (advised to abstain)',
    exerciseLevel: 'Light activity (cardiac rehab 2x/week)',
    diet: 'Low-sodium (<2000mg/day), fluid-restricted (2L/day)',
  },
  careTeam: [
    { name: 'Dr. Anika Patel', role: 'Cardiologist', specialty: 'Heart Failure & Transplant' },
    { name: 'Dr. Sarah Chen', role: 'Primary Care Physician', specialty: 'Internal Medicine' },
    { name: 'Lisa Nguyen, RN', role: 'Heart Failure Nurse Specialist', specialty: 'Cardiac Care Coordination' },
    { name: 'James Park, PharmD', role: 'Clinical Pharmacist', specialty: 'Cardiovascular Pharmacotherapy' },
    { name: 'David Kim, RD', role: 'Registered Dietitian', specialty: 'Cardiac Nutrition' },
  ],
  emergencyContact: {
    name: 'Maria Rivera',
    relation: 'Wife',
    phone: '(555) 345-6789',
  },
  insurance: {
    provider: 'Aetna',
    planType: 'PPO',
    memberId: 'AET-7738421',
  },
  goals: [
    'Maintain daily weight within 2 lbs of dry weight (183 lbs)',
    'Adhere to sodium restriction (<2000mg/day)',
    'Complete cardiac rehabilitation program (12 weeks)',
    'Improve ejection fraction to above 35% within 6 months',
    'Recognize and respond to worsening heart failure symptoms within 24 hours',
  ],
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

/** All patients in the database */
export const allPatients = [marcusThompson, sarahWilliams, jamesRivera]

/** Default / first patient (backward compat) */
export const samplePatient = marcusThompson

/** Look up a patient by ID */
export function getPatientById(id) {
  return allPatients.find((p) => p.id === id) || null
}

/**
 * Compact patient summary for API calls and prompt building.
 * Strips sensitive fields and keeps only what the AI needs.
 */
export function getPatientContext(patient = samplePatient) {
  return {
    name: patient.name,
    age: patient.age,
    sex: patient.sex,
    diagnosis: patient.diagnosis,
    diagnosisCode: patient.diagnosisCode,
    procedure: patient.procedure,
    conditions: patient.conditions,
    allergies: patient.allergies,
    medications: (patient.medications || []).map((m) => ({
      name: m.name,
      genericName: m.genericName,
      dose: m.dose,
      frequency: m.frequency,
      purpose: m.purpose,
    })),
    vitals: {
      hba1c: patient.vitals?.hba1c,
      bmi: patient.vitals?.bmi,
      bloodPressure: patient.vitals?.bloodPressure,
      ejectionFraction: patient.vitals?.ejectionFraction,
    },
    goals: patient.goals,
    careTeam: (patient.careTeam || []).map((c) => ({ name: c.name, role: c.role })),
  }
}
