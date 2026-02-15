/**
 * Patient Database — Children's Edition
 *
 * Three kid patient profiles for the MedFlix demo.
 * Ages 3-9, common childhood conditions.
 * Doctors create content for each child live during the demo.
 */

// ═══════════════════════════════════════════════════════
//  PATIENT 1: Lily Chen — Asthma (age 4)
// ═══════════════════════════════════════════════════════

const lilyChen = {
  id: 'pt-001',
  name: 'Lily Chen',
  age: 4,
  sex: 'Female',
  emoji: '🌸',
  avatar: '🧒🏻',
  diagnosis: 'Childhood Asthma',
  diagnosisCode: 'J45.20',
  diagnosisDate: '2026-01-10',
  procedure: 'Asthma action plan + daily controller medication',
  allergies: ['Dust mites', 'Pollen', 'Cat dander'],
  medications: [
    {
      name: 'Albuterol Inhaler',
      genericName: 'albuterol sulfate',
      dose: '2 puffs',
      frequency: 'as needed (rescue)',
      route: 'inhaler with spacer',
      purpose: 'Quick relief when breathing is hard',
      instructions: 'Use with spacer and mask. Shake well. 2 puffs when coughing or wheezing.',
    },
    {
      name: 'Flovent',
      genericName: 'fluticasone propionate',
      dose: '44mcg, 1 puff',
      frequency: 'twice daily',
      route: 'inhaler with spacer',
      purpose: 'Daily controller to prevent asthma flare-ups',
      instructions: 'Use every morning and bedtime with spacer. Rinse mouth after.',
    },
  ],
  vitals: {
    weight: '35 lbs',
    height: '3\'4"',
    heartRate: '100 bpm',
    oxygenSaturation: '98%',
    peakFlow: '120 L/min',
  },
  conditions: ['Allergic rhinitis', 'Eczema'],
  lifestyle: {
    school: 'Sunshine Preschool',
    activities: 'Dancing, playing with dolls, painting',
    sleepHours: '11 hours/night',
    diet: 'Picky eater, loves pasta and fruit',
  },
  careTeam: [
    { name: 'Dr. Maya Patel', role: 'Pediatrician', specialty: 'General Pediatrics' },
    { name: 'Dr. Kevin Okafor', role: 'Pediatric Pulmonologist', specialty: 'Asthma & Allergies' },
    { name: 'Nurse Jenny', role: 'School Nurse', specialty: 'Asthma Management' },
  ],
  emergencyContact: {
    name: 'Wei Chen',
    relation: 'Mom',
    phone: '(555) 123-4567',
  },
  insurance: {
    provider: 'United Healthcare',
    planType: 'PPO',
    memberId: 'UHC-3347891',
  },
  goals: [
    'Learn to use inhaler with spacer and grown-up help',
    'Know when to tell a grown-up breathing is hard',
    'Take daily puffs every morning and bedtime',
    'Stay active and play without being scared of asthma',
  ],
}

// ═══════════════════════════════════════════════════════
//  PATIENT 2: Noah Martinez — Ear Infection (age 6)
// ═══════════════════════════════════════════════════════

const noahMartinez = {
  id: 'pt-002',
  name: 'Noah Martinez',
  age: 6,
  sex: 'Male',
  emoji: '⚡',
  avatar: '👦🏽',
  diagnosis: 'Acute Otitis Media (Ear Infection)',
  diagnosisCode: 'H66.90',
  diagnosisDate: '2026-02-05',
  procedure: 'Antibiotic therapy + symptom management',
  allergies: ['None known'],
  medications: [
    {
      name: 'Amoxicillin',
      genericName: 'amoxicillin',
      dose: '250mg/5mL',
      frequency: 'twice daily for 10 days',
      route: 'oral liquid',
      purpose: 'Fights the germs causing the ear infection',
      instructions: 'Take the pink medicine with food. Finish ALL of it even if ears feel better!',
    },
    {
      name: "Children's Tylenol",
      genericName: 'acetaminophen',
      dose: '160mg/5mL',
      frequency: 'every 4-6 hours as needed',
      route: 'oral liquid',
      purpose: 'Helps with ear pain and fever',
      instructions: 'Give when ears hurt or fever is above 100.4°F. Do not give more than 5 doses in 24 hours.',
    },
  ],
  vitals: {
    weight: '48 lbs',
    height: '3\'10"',
    temperature: '100.8°F',
    heartRate: '95 bpm',
    oxygenSaturation: '99%',
  },
  conditions: ['Recurrent ear infections (3rd episode)'],
  lifestyle: {
    school: 'Lincoln Elementary, 1st Grade',
    activities: 'Soccer, building with LEGOs, dinosaurs',
    sleepHours: '10 hours/night',
    diet: 'Good eater, loves chicken nuggets and grapes',
  },
  careTeam: [
    { name: 'Dr. Maya Patel', role: 'Pediatrician', specialty: 'General Pediatrics' },
    { name: 'Dr. Samira Hassan', role: 'ENT Specialist', specialty: 'Pediatric Ear/Nose/Throat' },
    { name: 'Maria Lopez, RN', role: 'Nurse', specialty: 'Pediatric Care' },
  ],
  emergencyContact: {
    name: 'Carlos Martinez',
    relation: 'Dad',
    phone: '(555) 987-6543',
  },
  insurance: {
    provider: 'Cigna',
    planType: 'HMO',
    memberId: 'CIG-5521934',
  },
  goals: [
    'Take ALL the pink medicine for 10 days — even when feeling better',
    'Learn that medicine makes the ear germs go away',
    'Know to tell a grown-up when ears hurt more',
    'Stay cozy and rest while getting better',
  ],
}

// ═══════════════════════════════════════════════════════
//  PATIENT 3: Zara Thompson — Childhood Cancer (age 10)
// ═══════════════════════════════════════════════════════

const zaraThompson = {
  id: 'pt-003',
  name: 'Zara Thompson',
  age: 10,
  sex: 'Female',
  emoji: '🦋',
  avatar: '👧🏾',
  diagnosis: 'Acute Lymphoblastic Leukemia (ALL)',
  diagnosisCode: 'C91.0',
  diagnosisDate: '2026-01-20',
  procedure: 'Chemotherapy treatment plan (Induction phase)',
  allergies: ['Sulfa drugs'],
  medications: [
    {
      name: 'Vincristine',
      genericName: 'vincristine sulfate',
      dose: '1.5mg/m²',
      frequency: 'once weekly (IV at clinic)',
      route: 'intravenous',
      purpose: 'Chemo medicine that fights the bad cells in your blood',
      instructions: 'Given at the hospital by the nurse. You might feel a little tired after — that is totally normal!',
    },
    {
      name: 'Prednisone',
      genericName: 'prednisone',
      dose: '40mg/m²',
      frequency: 'daily for 28 days',
      route: 'oral tablet',
      purpose: 'Helps your body fight the bad cells and reduces swelling',
      instructions: 'Take with food every morning. It might make you extra hungry and a little moody — that is the medicine working!',
    },
    {
      name: 'Ondansetron',
      genericName: 'ondansetron',
      dose: '4mg',
      frequency: 'as needed before/after chemo',
      route: 'oral dissolving tablet',
      purpose: 'Stops your tummy from feeling sick after treatment',
      instructions: 'Put the tablet on your tongue — it dissolves like magic! Take it before chemo and whenever your tummy feels yucky.',
    },
  ],
  vitals: {
    weight: '65 lbs',
    height: '4\'6"',
    heartRate: '90 bpm',
    oxygenSaturation: '98%',
    whiteBloodCellCount: '2,500/μL (low — being monitored)',
  },
  conditions: ['Neutropenia (low white blood cells)', 'Fatigue', 'Mild anemia'],
  lifestyle: {
    school: 'Oakwood Elementary, 5th Grade (attending virtually during treatment)',
    activities: 'Drawing, reading Harry Potter, video calls with friends, gentle walks',
    sleepHours: '10-11 hours/night (needs extra rest)',
    diet: 'High-protein foods to stay strong. Loves pasta, smoothies, and grilled cheese.',
  },
  careTeam: [
    { name: 'Dr. Maya Patel', role: 'Pediatrician', specialty: 'General Pediatrics' },
    { name: 'Dr. James Okonkwo', role: 'Pediatric Oncologist', specialty: 'Childhood Leukemia' },
    { name: 'Nurse Tanya', role: 'Oncology Nurse', specialty: 'Pediatric Chemo Administration' },
    { name: 'Ms. Sarah, CCLS', role: 'Child Life Specialist', specialty: 'Emotional Support & Play Therapy' },
  ],
  emergencyContact: {
    name: 'Keisha Thompson',
    relation: 'Mom',
    phone: '(555) 456-7890',
  },
  insurance: {
    provider: 'Blue Cross Blue Shield',
    planType: 'PPO',
    memberId: 'BCB-8834521',
  },
  goals: [
    'Understand what leukemia is and why treatment helps — in a way that is not scary',
    'Know that chemo is fighting the bad cells and that feeling tired is normal',
    'Learn when to tell a grown-up if something feels wrong (fever, bruising, bleeding)',
    'Stay brave and positive — YOU are stronger than you think!',
  ],
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

/** All patients in the database */
export const allPatients = [lilyChen, noahMartinez, zaraThompson]

/** Default / first patient (backward compat) */
export const samplePatient = lilyChen

/** Look up a patient by ID */
export function getPatientById(id) {
  return allPatients.find((p) => p.id === id) || null
}

/**
 * Compact patient summary for API calls and prompt building.
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
    vitals: patient.vitals || {},
    goals: patient.goals,
    careTeam: (patient.careTeam || []).map((c) => ({ name: c.name, role: c.role })),
  }
}
