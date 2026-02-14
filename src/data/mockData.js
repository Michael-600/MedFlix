export const visualStyles = [
  {
    id: 'friends',
    name: 'Friends',
    subtitle: 'Live-action sitcom',
    description: 'Live-action sitcom aesthetic. Warm, bright color palette with cozy interior lighting from practical lamps and natural windows. Soft, even lighting reminiscent of multi-camera TV setup. Natural skin tones, realistic human features and expressions, conversational body language. Modern 90s-2000s style with contemporary casual wardrobe. Ambient: light background chatter, everyday room tone. Shot on film with slight warmth. No harsh shadows, no cold tones.',
    color: '#00d4aa',
    preview: '🎬',
  },
  {
    id: 'zootopia',
    name: 'Zootopia',
    subtitle: 'Disney 3D animation',
    description: 'Disney 3D animation style with vibrant, saturated colors and smooth character models. Expressive anthropomorphic characters with detailed fur/skin textures. Bright, optimistic lighting with soft shadows. Clean environments with rich detail. Cinematic camera angles with depth of field effects.',
    color: '#3b82f6',
    preview: '🦊',
  },
  {
    id: 'anime',
    name: 'Anime',
    subtitle: 'Japanese 2D animation',
    description: 'Japanese anime aesthetic with clean line art and cel-shaded coloring. Expressive character designs with large, detailed eyes. Dynamic action poses and emotional expressions. Soft gradients and atmospheric lighting. Cherry blossom and nature motifs for medical settings.',
    color: '#ec4899',
    preview: '🌸',
  },
  {
    id: 'the-office',
    name: 'The Office',
    subtitle: 'Mockumentary',
    description: 'Mockumentary style with handheld camera feel and natural office lighting. Documentary-style talking head interviews. Realistic settings with fluorescent office lighting. Deadpan humor delivery with direct-to-camera moments. Casual, everyday wardrobe and relatable environments.',
    color: '#f59e0b',
    preview: '📋',
  },
  {
    id: 'pixar',
    name: 'Pixar',
    subtitle: '3D animation',
    description: 'Pixar-quality 3D animation with incredible attention to detail in textures and lighting. Heartwarming character designs with exaggerated proportions. Rich, cinematic color grading with volumetric lighting. Emotionally resonant storytelling through visual cues.',
    color: '#8b5cf6',
    preview: '🎪',
  },
  {
    id: 'spider-verse',
    name: 'Spider-Verse',
    subtitle: 'Comic book animation',
    description: 'Bold comic book animation with halftone dots, Ben-Day dots, and thick ink outlines. Dynamic panel compositions and split-screen storytelling. Vibrant pop art colors with dramatic contrast. Kinetic energy in every frame with motion blur effects.',
    color: '#ef4444',
    preview: '🕷️',
  },
  {
    id: 'south-park',
    name: 'South Park',
    subtitle: 'Cutout animation',
    description: 'Simple cutout animation with flat geometric shapes and bold outlines. Minimalist character designs with exaggerated expressions. Bright, primary color palette. Paper-craft aesthetic with simple backgrounds. Direct, blunt delivery style.',
    color: '#f97316',
    preview: '📄',
  },
  {
    id: 'custom',
    name: 'Custom',
    subtitle: 'Your own style',
    description: '',
    color: '#6b7280',
    preview: '✨',
  },
]

export const defaultRecoveryPlan = {
  patientName: '',
  diagnosis: 'Type 2 Diabetes',
  startDate: new Date().toISOString().split('T')[0],
  totalDays: 7,
  days: [
    {
      day: 1,
      title: 'Your Diagnosis',
      description: 'Understanding your diagnosis and treatment plan',
      completed: false,
      unlocked: true,
      checklist: [
        { id: 'c1-1', text: 'Review diagnosis with care team', checked: false },
        { id: 'c1-2', text: 'Understand treatment options', checked: false },
        { id: 'c1-3', text: 'Ask questions about next steps', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 1: Understanding Your Journey',
    },
    {
      day: 2,
      title: 'Care at Home',
      description: 'Managing medications and recognizing warning signs',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c2-1', text: 'Review medication schedule', checked: false },
        { id: 'c2-2', text: 'Learn warning signs to watch for', checked: false },
        { id: 'c2-3', text: 'Set up home care supplies', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 2: Your Home Care Guide',
    },
    {
      day: 3,
      title: 'Increased Activity',
      description: 'Gradually increasing daily activity levels while monitoring your response',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c3-1', text: 'Complete morning stretching routine', checked: false },
        { id: 'c3-2', text: 'Take a 10-minute walk', checked: false },
        { id: 'c3-3', text: 'Log activity and symptoms', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 3: Moving Forward',
    },
    {
      day: 4,
      title: 'Strengthening Exercises',
      description: 'Introduction to gentle strengthening and range of motion exercises',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c4-1', text: 'Watch exercise demonstration video', checked: false },
        { id: 'c4-2', text: 'Complete beginner exercise set', checked: false },
        { id: 'c4-3', text: 'Record any discomfort or limitations', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 4: Building Strength',
    },
    {
      day: 5,
      title: 'Routine Stabilization',
      description: 'Establishing a sustainable daily routine for ongoing recovery',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c5-1', text: 'Create a daily schedule', checked: false },
        { id: 'c5-2', text: 'Practice relaxation techniques', checked: false },
        { id: 'c5-3', text: 'Review nutrition guidelines', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 5: Finding Your Rhythm',
    },
    {
      day: 6,
      title: 'Increased Endurance',
      description: 'Building stamina and confidence in daily activities',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c6-1', text: 'Extend walking to 20 minutes', checked: false },
        { id: 'c6-2', text: 'Practice independence in daily tasks', checked: false },
        { id: 'c6-3', text: 'Discuss progress with care team', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 6: Going the Distance',
    },
    {
      day: 7,
      title: 'Active Recovery',
      description: 'Final assessment and preparation for continued progress',
      completed: false,
      unlocked: false,
      checklist: [
        { id: 'c7-1', text: 'Complete final assessment', checked: false },
        { id: 'c7-2', text: 'Review all progress made', checked: false },
        { id: 'c7-3', text: 'Set goals for next phase', checked: false },
      ],
      videoUrl: null,
      episodeTitle: 'Episode 7: Your New Beginning',
    },
  ],
}

export const defaultMedications = {
  'Type 2 Diabetes': [
    { name: 'Metformin', dosage: '500mg', frequency: 'twice_daily', times: ['08:00', '20:00'], instructions: 'Take with food' },
    { name: 'Glipizide', dosage: '5mg', frequency: 'once_daily', times: ['08:00'], instructions: 'Take 30 min before breakfast' },
  ],
  'Breast Cancer - Stage II': [
    { name: 'Tamoxifen', dosage: '20mg', frequency: 'once_daily', times: ['09:00'], instructions: 'Take at the same time each day' },
    { name: 'Ondansetron', dosage: '8mg', frequency: 'twice_daily', times: ['08:00', '20:00'], instructions: 'Take 30 min before meals if nauseous' },
  ],
  'Knee Replacement Recovery': [
    { name: 'Acetaminophen', dosage: '500mg', frequency: 'three_times_daily', times: ['08:00', '14:00', '20:00'], instructions: 'Take with water' },
    { name: 'Enoxaparin', dosage: '40mg', frequency: 'once_daily', times: ['09:00'], instructions: 'Inject subcutaneously as directed' },
  ],
  'Cardiac Bypass Recovery': [
    { name: 'Aspirin', dosage: '81mg', frequency: 'once_daily', times: ['08:00'], instructions: 'Take with food' },
    { name: 'Metoprolol', dosage: '25mg', frequency: 'twice_daily', times: ['08:00', '20:00'], instructions: 'Do not stop abruptly' },
    { name: 'Atorvastatin', dosage: '40mg', frequency: 'once_daily', times: ['21:00'], instructions: 'Take at bedtime' },
  ],
  'Chronic Back Pain Management': [
    { name: 'Ibuprofen', dosage: '400mg', frequency: 'three_times_daily', times: ['08:00', '14:00', '20:00'], instructions: 'Take with food' },
    { name: 'Cyclobenzaprine', dosage: '10mg', frequency: 'once_daily', times: ['21:00'], instructions: 'Take at bedtime, may cause drowsiness' },
  ],
  'Post-Stroke Rehabilitation': [
    { name: 'Clopidogrel', dosage: '75mg', frequency: 'once_daily', times: ['08:00'], instructions: 'Take at the same time each day' },
    { name: 'Lisinopril', dosage: '10mg', frequency: 'once_daily', times: ['08:00'], instructions: 'Monitor blood pressure regularly' },
    { name: 'Atorvastatin', dosage: '80mg', frequency: 'once_daily', times: ['21:00'], instructions: 'Take at bedtime' },
  ],
}

export const sampleDiagnoses = [
  'Breast Cancer - Stage II',
  'Type 2 Diabetes',
  'Knee Replacement Recovery',
  'Cardiac Bypass Recovery',
  'Chronic Back Pain Management',
  'Post-Stroke Rehabilitation',
]

export const aiAssistantGreeting = `Hello! I'm your MedFlix AI assistant. I'm here to help you understand your recovery plan and answer questions about your treatment. 

You can ask me things like:
- "What should I expect on Day 3?"
- "Explain my medications"
- "What are the warning signs I should watch for?"
- "How can I manage pain at home?"

How can I help you today?`

export const aiResponses = {
  medications: "Based on your recovery plan, it's important to take all prescribed medications on schedule. Common medications after your procedure may include pain management, anti-inflammatory drugs, and preventive antibiotics. Always take medications with food unless directed otherwise, and never skip doses without consulting your doctor. If you experience side effects like nausea, dizziness, or unusual symptoms, contact your care team immediately.",
  pain: "Pain management is a crucial part of your recovery. Here are some strategies:\n\n1. **Take medications on schedule** - Don't wait until pain is severe\n2. **Use ice/heat therapy** as recommended by your care team\n3. **Practice deep breathing** and relaxation techniques\n4. **Gentle movement** can help reduce stiffness\n5. **Keep a pain journal** to track patterns\n\nIf pain becomes unmanageable or suddenly worsens, contact your healthcare provider immediately.",
  warning: "Watch for these warning signs that require immediate medical attention:\n\n- **Fever** above 101°F (38.3°C)\n- **Increased swelling** or redness at the surgical site\n- **Difficulty breathing** or chest pain\n- **Severe or worsening pain** not controlled by medications\n- **Signs of infection**: warmth, drainage, or red streaks\n- **Numbness or tingling** in extremities\n\nWhen in doubt, always err on the side of caution and contact your care team.",
  exercise: "During your recovery, exercise should be gradual and guided:\n\n**Week 1**: Focus on gentle walking and breathing exercises\n**Week 2**: Add light stretching and range of motion\n**Week 3+**: Gradually increase activity as tolerated\n\nAlways:\n- Start slowly and listen to your body\n- Stop if you feel sharp pain\n- Stay hydrated\n- Follow your physical therapist's guidelines\n- Track your progress",
  diet: "Good nutrition supports healing. General guidelines:\n\n- **Protein-rich foods** help tissue repair (lean meats, beans, eggs)\n- **Fruits and vegetables** provide essential vitamins\n- **Stay hydrated** - aim for 8 glasses of water daily\n- **Fiber-rich foods** help prevent constipation from medications\n- **Avoid alcohol** while on medications\n- **Small, frequent meals** if appetite is low",
  default: "That's a great question about your recovery. While I can provide general guidance, please remember to always consult your healthcare team for advice specific to your condition. Your care team has the most complete picture of your health and can give you the most accurate recommendations.\n\nIs there anything specific about your recovery plan I can help clarify?",
}
