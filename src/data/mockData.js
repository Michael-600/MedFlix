export const visualStyles = [
  {
    id: 'friends',
    name: 'Friends',
    subtitle: 'Live-action sitcom',
    description: 'Live-action sitcom aesthetic. Warm, bright color palette with cozy interior lighting from practical lamps and natural windows. Soft, even lighting reminiscent of multi-camera TV setup. Natural skin tones, realistic human features and expressions, conversational body language. Modern 90s-2000s style with contemporary casual wardrobe. Ambient: light background chatter, everyday room tone. Shot on film with slight warmth. No harsh shadows, no cold tones.',
    color: '#9333ea',
    icon: 'Video',
    image: '/images/friends-cast.png',
    emoji: '🎬',
  },
  {
    id: 'zootopia',
    name: 'Zootopia',
    subtitle: 'Disney 3D animation',
    description: 'Disney 3D animation style with vibrant, saturated colors and smooth character models. Expressive anthropomorphic characters with detailed fur/skin textures. Bright, optimistic lighting with soft shadows. Clean environments with rich detail. Cinematic camera angles with depth of field effects.',
    color: '#3b82f6',
    icon: 'Sparkles',
    image: '/images/zootopia.png',
    emoji: '🦊',
  },
  {
    id: 'anime',
    name: 'Anime',
    subtitle: 'Japanese 2D animation',
    description: 'Japanese anime aesthetic with clean line art and cel-shaded coloring. Expressive character designs with large, detailed eyes. Dynamic action poses and emotional expressions. Soft gradients and atmospheric lighting. Cherry blossom and nature motifs for medical settings.',
    color: '#ec4899',
    icon: 'Palette',
    image: '/images/anime.png',
    emoji: '🎨',
  },
  {
    id: 'the-office',
    name: 'The Office',
    subtitle: 'Mockumentary',
    description: 'Mockumentary style with handheld camera feel and natural office lighting. Documentary-style talking head interviews. Realistic settings with fluorescent office lighting. Deadpan humor delivery with direct-to-camera moments. Casual, everyday wardrobe and relatable environments.',
    color: '#f59e0b',
    icon: 'Camera',
    image: '/images/the-office.png',
    emoji: '📷',
  },
  {
    id: 'pixar',
    name: 'Pixar',
    subtitle: '3D animation',
    description: 'Pixar-quality 3D animation with incredible attention to detail in textures and lighting. Heartwarming character designs with exaggerated proportions. Rich, cinematic color grading with volumetric lighting. Emotionally resonant storytelling through visual cues.',
    color: '#8b5cf6',
    icon: 'Film',
    image: '/images/pixar.png',
    emoji: '💡',
  },
  {
    id: 'spider-verse',
    name: 'Spider-Verse',
    subtitle: 'Comic book animation',
    description: 'Bold comic book animation with halftone dots, Ben-Day dots, and thick ink outlines. Dynamic panel compositions and split-screen storytelling. Vibrant pop art colors with dramatic contrast. Kinetic energy in every frame with motion blur effects.',
    color: '#ef4444',
    icon: 'Zap',
    image: '/images/spider-verse.png',
    emoji: '⚡',
  },
  {
    id: 'south-park',
    name: 'South Park',
    subtitle: 'Cutout animation',
    description: 'Simple cutout animation with flat geometric shapes and bold outlines. Minimalist character designs with exaggerated expressions. Bright, primary color palette. Paper-craft aesthetic with simple backgrounds. Direct, blunt delivery style.',
    color: '#f97316',
    icon: 'FileText',
    image: '/images/south-park.png',
    emoji: '✂️',
  },
  {
    id: 'custom',
    name: 'Custom',
    subtitle: 'Your own style',
    description: '',
    color: '#6b7280',
    icon: 'Settings',
    image: null,
    emoji: '⚙️',
  },
]

export const defaultRecoveryPlan = {
  patientName: '',
  diagnosis: 'Childhood Asthma',
  startDate: new Date().toISOString().split('T')[0],
  totalDays: 7,
  days: [
    {
      day: 1,
      title: 'Hi There!',
      description: 'Meet your Health Buddy and learn what this special show is about!',
      completed: false,
      unlocked: true,
      keyTakeaways: [
        'This is YOUR special health show!',
        'Your doctor made it just for you',
        '7 fun episodes with collector cards!',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 1: Hi There!',
    },
    {
      day: 2,
      title: "What's Happening?",
      description: 'Learn about what\'s going on with your body — in a fun, easy way!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'Your body needs a little extra help right now',
        'Lots of kids go through this — you are not alone!',
        'Your doctor has an awesome plan to help',
      ],
      videoUrl: null,
      episodeTitle: "Episode 2: What's Happening?",
    },
    {
      day: 3,
      title: 'Your Super Medicine!',
      description: 'Each medicine is like a superpower! Learn what they do!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'Each medicine has a special superpower',
        'ALWAYS ask a grown-up to help with medicine',
        'Your doctor picked these just for you',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 3: Your Super Medicine!',
    },
    {
      day: 4,
      title: 'What Happens Next?',
      description: 'Find out what to expect — day by day, you will feel better!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'Give your body a little time',
        'Things WILL get better!',
        'Keep taking your medicine even when you feel good',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 4: What Happens Next?',
    },
    {
      day: 5,
      title: 'Healthy Habits!',
      description: 'Fun things you can do every day to be your strongest self!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'Healthy food gives you superpowers!',
        'Being active is awesome for your body',
        'Sleep is your body\'s superpower time!',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 5: Healthy Habits!',
    },
    {
      day: 6,
      title: 'Uh Oh Moments!',
      description: 'Learn when to tell a grown-up that something doesn\'t feel right!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'BIG Uh Oh: Tell a grown-up RIGHT AWAY!',
        'Telling a grown-up is the BRAVEST thing',
        'You are NEVER in trouble for asking for help',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 6: Uh Oh Moments!',
    },
    {
      day: 7,
      title: 'You Did It!',
      description: 'Celebrate! You are a Health Hero! Look at everything you learned!',
      completed: false,
      unlocked: false,
      keyTakeaways: [
        'You completed ALL 7 episodes!',
        'You are a certified Health Hero!',
        'Your care team believes in you!',
      ],
      videoUrl: null,
      episodeTitle: 'Episode 7: You Did It!',
    },
  ],
}

export const defaultMedications = {
  'Childhood Asthma': [
    { name: 'Albuterol Inhaler', dosage: '2 puffs', frequency: 'as_needed', times: [], instructions: 'Use with spacer when coughing or wheezing' },
    { name: 'Flovent', dosage: '1 puff', frequency: 'twice_daily', times: ['08:00', '20:00'], instructions: 'Morning and bedtime with spacer. Rinse mouth after.' },
  ],
  'Ear Infection': [
    { name: 'Amoxicillin', dosage: '250mg/5mL', frequency: 'twice_daily', times: ['08:00', '20:00'], instructions: 'Take the pink medicine with food. Finish ALL of it!' },
    { name: "Children's Tylenol", dosage: '160mg/5mL', frequency: 'as_needed', times: [], instructions: 'Give when ears hurt or fever is above 100.4°F' },
  ],
  'Childhood Leukemia': [
    { name: 'Vincristine', dosage: '1.5mg/m²', frequency: 'weekly', times: ['Hospital visit'], instructions: 'Given at the hospital by the nurse. Rest afterward!' },
    { name: 'Prednisone', dosage: '40mg/m²', frequency: 'once_daily', times: ['08:00'], instructions: 'Take with breakfast every morning' },
    { name: 'Ondansetron', dosage: '4mg', frequency: 'as_needed', times: [], instructions: 'Dissolving tablet before/after chemo for tummy sickness' },
  ],
}

export const aiAssistantGreeting = `Hey there, Health Hero! 🌟 I'm your Health Buddy and I'm SO happy you're here!

You can ask me stuff like:
- "What does my medicine do?"
- "Can I still play and have fun?"
- "What are Uh Oh Moments?"
- "What yummy foods can I eat?"

What do you want to know? I love questions! 🎉`

export const aiResponses = {
  medications: "Your medicines are like SUPERPOWERS! 🛡️ Each one does something special to help your body. Your doctor picked them just for you! Remember — ALWAYS ask a grown-up when it's time to take medicine. Never take it by yourself. And if something feels funny after taking medicine, tell a grown-up right away!",
  pain: "Ouch! I'm sorry something hurts! 😟 Here's what to do:\n\n1. **Tell a grown-up** right away — they'll know how to help!\n2. If your doctor gave you pain medicine, a grown-up can help you take it\n3. Try to rest and get comfy\n4. Put a warm blanket on if it helps\n5. Take slow, deep breaths — in through your nose, out through your mouth\n\nRemember — it's ALWAYS brave to tell someone when something hurts! 💪",
  warning: "These are your **Uh Oh Moments** — times to tell a grown-up RIGHT AWAY! 🚨\n\n- If breathing gets really hard\n- If something hurts WAY more than usual\n- If you feel really dizzy or sick\n- If you get a high fever\n- If you ate something and your body feels funny\n\nTelling a grown-up is the **BRAVEST** thing you can do! You're NEVER in trouble for asking for help! 💛",
  exercise: "You can ABSOLUTELY still play and have fun! 🎉\n\n- **Running, jumping, dancing** — go for it!\n- If you start feeling tired or funny, take a break\n- **Drink water** when you play hard\n- Tell a grown-up if anything feels wrong\n- Some days you might need to rest more — and that's OKAY!\n\nYour body is amazing and it wants to move! Just listen to it and have FUN! 🏃",
  diet: "There are SO many yummy foods for you! 🍎\n\n- **Fruits** — strawberries, bananas, grapes, oranges\n- **Veggies** — carrots, broccoli (try them with dip!)\n- **Protein** — chicken, eggs, mac & cheese\n- **Drinks** — water is the BEST! Milk is great too!\n\nHealthy food gives you **superpowers** to fight germs and stay strong! 🦸 If you have food allergies, always ask a grown-up before trying something new!",
  default: "That's a GREAT question! 🌟 I think you should ask your doctor or a grown-up about that — they know the most about YOUR specific health. But I'm super proud of you for being curious and asking questions! That's what Health Heroes do! 💪\n\nWant to ask me something else? I'm all ears! 😊",
}
