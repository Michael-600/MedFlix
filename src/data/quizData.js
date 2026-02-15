/**
 * Quiz Data — Kids' Health Questions
 *
 * 2-3 simple questions per episode, adapted per condition.
 * Each question has a fun emoji "picture", short text, and 2 options.
 * Correct answer unlocks the battle card for that episode.
 */

// ═══════════════════════════════════════════════════════
//  BATTLE CARD DEFINITIONS (shared across all conditions)
// ═══════════════════════════════════════════════════════

export const battleCards = [
  {
    episode: 1,
    name: 'Captain Welcome',
    emoji: '🦸',
    power: 'Friendship',
    stars: 5,
    fact: 'Every health hero starts here!',
    color: 'from-blue-400 to-cyan-400',
    border: 'border-blue-400',
  },
  {
    episode: 2,
    name: 'Dr. Owl',
    emoji: '🦉',
    power: 'Knowledge',
    stars: 5,
    fact: 'Knowing is half the battle!',
    color: 'from-purple-400 to-indigo-400',
    border: 'border-purple-400',
  },
  {
    episode: 3,
    name: 'Super Shield',
    emoji: '🛡️',
    power: 'Protection',
    stars: 5,
    fact: 'Medicine keeps you strong!',
    color: 'from-green-400 to-emerald-400',
    border: 'border-green-400',
  },
  {
    episode: 4,
    name: 'Time Turtle',
    emoji: '🐢',
    power: 'Patience',
    stars: 4,
    fact: 'Getting better takes time!',
    color: 'from-yellow-400 to-amber-400',
    border: 'border-yellow-400',
  },
  {
    episode: 5,
    name: 'Veggie Fox',
    emoji: '🦊',
    power: 'Energy',
    stars: 5,
    fact: 'Healthy food = superpowers!',
    color: 'from-orange-400 to-red-400',
    border: 'border-orange-400',
  },
  {
    episode: 6,
    name: 'Alert Eagle',
    emoji: '🦅',
    power: 'Awareness',
    stars: 5,
    fact: 'Always tell a grown-up!',
    color: 'from-red-400 to-pink-400',
    border: 'border-red-400',
  },
  {
    episode: 7,
    name: 'Star Champion',
    emoji: '⭐',
    power: 'ALL POWERS',
    stars: 5,
    fact: "You're a Health Hero!",
    color: 'from-yellow-300 to-pink-400',
    border: 'border-yellow-300',
  },
]

// ═══════════════════════════════════════════════════════
//  QUIZ QUESTIONS BY CONDITION
// ═══════════════════════════════════════════════════════

/** Default questions work for any condition */
const defaultQuestions = {
  1: [
    {
      question: 'What is this special show about?',
      options: [
        { text: 'Learning about YOUR health!', emoji: '🌟', correct: true },
        { text: 'Cooking pizza', emoji: '🍕', correct: false },
      ],
    },
    {
      question: 'Who made this show just for you?',
      options: [
        { text: 'Your doctor and care team!', emoji: '👩‍⚕️', correct: true },
        { text: 'A dinosaur', emoji: '🦕', correct: false },
      ],
    },
  ],
  4: [
    {
      question: 'Does getting better happen right away?',
      options: [
        { text: 'No — it takes a little time!', emoji: '🐢', correct: true },
        { text: 'Yes — instantly!', emoji: '⚡', correct: false },
      ],
    },
    {
      question: 'What should you do every day?',
      options: [
        { text: 'Take my medicine on time!', emoji: '⏰', correct: true },
        { text: 'Skip it if I feel okay', emoji: '🙈', correct: false },
      ],
    },
  ],
  5: [
    {
      question: 'Which one gives you superpowers?',
      options: [
        { text: 'Fruits and veggies!', emoji: '🥦', correct: true },
        { text: 'Only candy', emoji: '🍭', correct: false },
      ],
    },
    {
      question: 'How much sleep do health heroes need?',
      options: [
        { text: 'Lots! A good night of sleep!', emoji: '😴', correct: true },
        { text: 'Just 2 hours', emoji: '👀', correct: false },
      ],
    },
  ],
  7: [
    {
      question: 'Are you a Health Hero?',
      options: [
        { text: 'YES I AM! 💪', emoji: '🦸', correct: true },
        { text: 'Not sure...', emoji: '🤔', correct: false },
      ],
    },
    {
      question: 'What do you do if you have questions?',
      options: [
        { text: 'Ask a grown-up or my doctor!', emoji: '🙋', correct: true },
        { text: 'Keep it a secret', emoji: '🤫', correct: false },
      ],
    },
  ],
}

/** Asthma-specific questions */
const asthmaQuestions = {
  ...defaultQuestions,
  2: [
    {
      question: 'What happens with asthma?',
      options: [
        { text: 'Breathing gets hard sometimes', emoji: '🫁', correct: true },
        { text: 'Your feet get bigger', emoji: '🦶', correct: false },
      ],
    },
    {
      question: 'Can you still play and have fun with asthma?',
      options: [
        { text: 'YES! Absolutely!', emoji: '⭐', correct: true },
        { text: 'No, never', emoji: '😢', correct: false },
      ],
    },
  ],
  3: [
    {
      question: 'Which one helps you breathe better?',
      options: [
        { text: 'My inhaler with the spacer!', emoji: '💨', correct: true },
        { text: 'A teddy bear', emoji: '🧸', correct: false },
      ],
    },
    {
      question: 'When do you use the rescue inhaler?',
      options: [
        { text: 'When coughing or breathing is hard', emoji: '😤', correct: true },
        { text: 'Only on Tuesdays', emoji: '📅', correct: false },
      ],
    },
  ],
  6: [
    {
      question: 'Breathing is really hard — what do you do?',
      options: [
        { text: 'Tell a grown-up RIGHT AWAY!', emoji: '🗣️', correct: true },
        { text: 'Keep playing and ignore it', emoji: '🏃', correct: false },
      ],
    },
    {
      question: 'What is an "Uh Oh" sign for asthma?',
      options: [
        { text: 'Coughing a lot and wheezing', emoji: '😰', correct: true },
        { text: 'Feeling hungry', emoji: '🍎', correct: false },
      ],
    },
  ],
}

/** Ear infection-specific questions */
const earInfectionQuestions = {
  ...defaultQuestions,
  2: [
    {
      question: 'What is an ear infection?',
      options: [
        { text: 'Germs making your ear hurt', emoji: '👂', correct: true },
        { text: 'A game you play', emoji: '🎮', correct: false },
      ],
    },
    {
      question: 'Will the ear owie go away?',
      options: [
        { text: 'Yes! Medicine will help!', emoji: '✨', correct: true },
        { text: 'No, never', emoji: '😭', correct: false },
      ],
    },
  ],
  3: [
    {
      question: 'What does the pink medicine do?',
      options: [
        { text: 'Fights the ear germs!', emoji: '⚔️', correct: true },
        { text: 'Makes you fly', emoji: '🦅', correct: false },
      ],
    },
    {
      question: 'When do you STOP taking the medicine?',
      options: [
        { text: 'Only when ALL of it is gone!', emoji: '🏁', correct: true },
        { text: 'When I feel a little better', emoji: '🤷', correct: false },
      ],
    },
  ],
  6: [
    {
      question: 'Ears hurt MORE than before — what do you do?',
      options: [
        { text: 'Tell a grown-up right away!', emoji: '🗣️', correct: true },
        { text: 'Put a sticker on it', emoji: '⭐', correct: false },
      ],
    },
    {
      question: "What if you get a fever?",
      options: [
        { text: 'Tell Mom or Dad!', emoji: '🤒', correct: true },
        { text: 'Go play outside', emoji: '☀️', correct: false },
      ],
    },
  ],
}

/** Childhood cancer (leukemia) specific questions */
const cancerQuestions = {
  ...defaultQuestions,
  2: [
    {
      question: 'What is leukemia?',
      options: [
        { text: 'Bad cells in your blood that doctors can fight!', emoji: '🩸', correct: true },
        { text: 'A type of bug bite', emoji: '🐛', correct: false },
      ],
    },
    {
      question: 'Can kids with leukemia get better?',
      options: [
        { text: 'YES! Doctors are really good at fighting it!', emoji: '💪', correct: true },
        { text: 'No, never', emoji: '😢', correct: false },
      ],
    },
  ],
  3: [
    {
      question: 'What does chemo medicine do?',
      options: [
        { text: 'Fights the bad cells in your blood!', emoji: '⚔️', correct: true },
        { text: 'Makes you taller', emoji: '📏', correct: false },
      ],
    },
    {
      question: 'Feeling tired after treatment is...',
      options: [
        { text: 'Totally normal! Your body is healing!', emoji: '😴', correct: true },
        { text: 'Something to worry about', emoji: '😰', correct: false },
      ],
    },
  ],
  6: [
    {
      question: 'You get a fever during treatment — what do you do?',
      options: [
        { text: 'Tell a grown-up RIGHT AWAY!', emoji: '🤒', correct: true },
        { text: 'Wait and see if it goes away', emoji: '⏳', correct: false },
      ],
    },
    {
      question: 'You notice a big bruise you did not get from playing — what do you do?',
      options: [
        { text: 'Show a grown-up!', emoji: '🗣️', correct: true },
        { text: 'Hide it', emoji: '🙈', correct: false },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

/**
 * Get quiz questions for a given episode and condition.
 * Falls back to default questions if no condition-specific ones exist.
 */
export function getQuizQuestions(episodeNumber, diagnosis = '') {
  const dx = (diagnosis || '').toLowerCase()
  let bank = defaultQuestions

  if (dx.includes('asthma')) bank = asthmaQuestions
  else if (dx.includes('ear') || dx.includes('otitis')) bank = earInfectionQuestions
  else if (dx.includes('leukemia') || dx.includes('cancer') || dx.includes('c91')) bank = cancerQuestions

  return bank[episodeNumber] || defaultQuestions[episodeNumber] || []
}

/**
 * Get the battle card for a given episode number (1-7).
 */
export function getBattleCard(episodeNumber) {
  return battleCards.find((c) => c.episode === episodeNumber) || null
}
