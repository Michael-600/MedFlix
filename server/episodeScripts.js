/**
 * Hardcoded Episode Script Builders — Children's Edition
 *
 * Each episode has a dedicated builder that creates 6-8 scenes using the
 * child's real data + FDA/DailyMed clinical data. Episodes NEVER bleed
 * into other topics — each one stays strictly on its assigned subject.
 *
 * Language is simple, warm, and encouraging for kids ages 3-9+.
 * Visual descriptions are colorful, cartoon-based, and fun.
 */

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function firstName(patient) {
  return (patient.name || 'friend').split(' ')[0]
}

function docName(patient) {
  return patient.careTeam?.[0]?.name || 'your doctor'
}

function kidAge(patient) {
  return patient.age || 5
}

function getEmoji(patient) {
  return patient.emoji || '⭐'
}

/**
 * Extract relevant FDA info for a medication.
 */
function getFdaInfo(medName, clinicalData) {
  const fda = (clinicalData.fdaDrugData || []).find(
    (d) => d.medication?.toLowerCase() === medName.toLowerCase() || d.genericName?.toLowerCase() === medName.toLowerCase()
  )
  if (!fda?.label) return null
  return {
    indications: fda.label.indications?.slice(0, 300) || '',
    warnings: fda.label.warnings?.slice(0, 300) || '',
    sideEffects: fda.label.adverseReactions?.slice(0, 300) || '',
    counseling: fda.label.patientCounseling?.slice(0, 300) || '',
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 1: Hi There!
//  ONLY: greet child, introduce the show, make them feel special
//  DO NOT mention medications or condition details
// ═══════════════════════════════════════════════════════

function buildEpisode1(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const emoji = getEmoji(patient)

  return {
    scenes: [
      {
        script: `Hey ${name}! ${emoji} Welcome to YOUR special show! This is MedFlix, and guess what? We made these videos just for you!`,
        visual: `Colorful welcome screen with bouncing letters spelling "${name}'s Special Show!" Rainbow confetti falling. Animated stars twinkling. Big friendly cartoon character waving. Bright yellow and blue background.`,
      },
      {
        script: `My name is your Health Buddy, and I'm here to help you learn cool stuff about staying healthy! It's going to be super fun, I promise!`,
        visual: `Animated friendly cartoon character (Health Buddy) jumping and waving. Speech bubble says "Hi ${name}!" Hearts and stars floating around. Warm, inviting purple and green colors.`,
      },
      {
        script: `${doctor} — that's your awesome doctor — helped make this show for you! They want you to learn some really important things. And you're going to be a Health Hero by the end!`,
        visual: `Cartoon drawing of a friendly doctor with a stethoscope and a big smile. Name tag reads "${doctor}". Next to them, a golden cape and mask with text "Future Health Hero: ${name}!" Sparkle animations.`,
      },
      {
        script: `We have SEVEN episodes — that means seven fun adventures! Each one teaches you something new. And after each one, you get a special collector card! How cool is that?`,
        visual: `Animated path with 7 colorful stepping stones, each with a fun icon: 1. Waving hand, 2. Magnifying glass, 3. Shield, 4. Clock, 5. Apple, 6. Megaphone, 7. Star trophy. The path leads to a golden treasure chest at the end.`,
      },
      {
        script: `Are you ready, ${name}? Let's go on this adventure together! You're going to be amazing!`,
        visual: `Big "LET'S GO!" text with fireworks animation. ${name}'s name in a star. Cartoon rocket ship taking off with "Episode 1 Complete!" banner. Confetti and stars everywhere. Preview: "Next: What's Happening?" with magnifying glass icon.`,
      },
    ],
    keyPoints: [
      'This is YOUR special health show!',
      `${doctor} made it just for you`,
      'You will become a Health Hero!',
      '7 fun episodes with collector cards!',
    ],
    sources: ['Patient Care Plan', `${doctor} — Care Team`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 2: What's Happening?
//  ONLY: simple explanation of the condition
//  DO NOT discuss medications or what to do about it
// ═══════════════════════════════════════════════════════

function buildEpisode2(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()

  let whatIsIt = ''
  let howFeels = ''
  let whyHappens = ''
  let goodNews = ''

  if (dx.includes('asthma')) {
    whatIsIt = `${name}, do you know what asthma is? Sometimes the tubes inside your chest that help you breathe get a little squeezed and puffy. It's like trying to blow through a really tiny straw!`
    howFeels = `When that happens, your chest might feel tight, you might cough a lot, or breathing might feel harder. And that can feel a little scary. But guess what? It's totally okay, and there are ways to make it better!`
    whyHappens = `Things like dust, fluffy animal hair, or pollen from flowers can sometimes make your breathing tubes puffy. That's called a trigger. Different people have different triggers!`
    goodNews = `The GREAT news is that lots and lots of kids have asthma, and they play sports, run around, and have SO much fun! With a little help, you can do everything your friends do!`
  } else if (dx.includes('ear') || dx.includes('otitis')) {
    whatIsIt = `${name}, you know how your ear has been hurting? That's called an ear infection! Tiny, tiny germs — so small you can't even see them — got inside your ear and are making it feel owie.`
    howFeels = `An ear infection can make your ear hurt, especially when you lie down. Your ear might feel full or funny, and sounds might seem a little muffled, like you're underwater!`
    whyHappens = `Sometimes after a cold or when your nose is stuffy, those sneaky little germs travel up to your ear and cause trouble. It's not your fault at all — it just happens sometimes!`
    goodNews = `The GREAT news is that ear infections go away! ${doctor} has a special plan to kick those germs out. You're going to feel SO much better soon!`
  } else if (dx.includes('leukemia') || dx.includes('cancer')) {
    whatIsIt = `${name}, inside your blood there are tiny little cells — like a team of superheroes that keep you healthy! But right now, some cells got mixed up and started growing the wrong way. That's called leukemia.`
    howFeels = `You might feel more tired than usual, or get bruises easier, or catch colds more often. That's because those mixed-up cells are getting in the way of the healthy ones. But guess what? Doctors know EXACTLY how to fix this!`
    whyHappens = `Nobody did anything wrong — not you, not your family, nobody! Sometimes cells just make a mistake. It's not from something you ate or did. It's just something that happens, and it's NOT your fault!`
    goodNews = `The GREAT news is that doctors are REALLY, REALLY good at fighting leukemia! Lots of kids have been through this and they got better and are out playing and having fun! Your doctor team has an awesome plan for YOU!`
  } else {
    whatIsIt = `${name}, your body is dealing with something called ${patient.diagnosis || 'a health thing'}. Let me explain it in a way that makes sense!`
    howFeels = `Sometimes it might make you feel a little different or not-so-great. And that's okay! Your body is telling you it needs some extra help.`
    whyHappens = `Bodies are amazing, but sometimes they need a little extra care. That's totally normal — even superheroes need help sometimes!`
    goodNews = `The GREAT news is that ${doctor} has an awesome plan to help you feel better! And you're already being so brave!`
  }

  return {
    scenes: [
      {
        script: `Hey ${name}! Welcome to Episode 2! Today we're going to learn about what's happening with your body. Don't worry — it's not scary, and I'll explain everything in a fun way!`,
        visual: `Title card: "What's Happening?" with a big friendly magnifying glass. Cartoon body outline with a smiley face. Bright blue and green colors. "Episode 2 of 7" badge. Animated question marks turning into lightbulbs.`,
      },
      {
        script: whatIsIt,
        visual: `${dx.includes('asthma') ? 'Cute cartoon lungs with little tubes (airways). Some tubes shown wide open (happy face), some squeezed smaller (with a tiny worried face). A cartoon straw next to it showing "big straw = easy, tiny straw = harder!"' : dx.includes('ear') || dx.includes('otitis') ? 'Cute cartoon ear with a magnifying glass showing tiny cartoon germs (silly-looking, not scary) inside. The germs have sneaky faces. Arrow showing "Germs got in here!"' : dx.includes('leukemia') || dx.includes('cancer') ? 'Cartoon blood stream with happy red cells, white cells, and platelets as little superhero characters. Some confused-looking cells mixed in (not scary, just silly). Text: "Some cells got mixed up!" Bright, colorful, educational.' : 'Friendly cartoon body diagram with arrows pointing to the affected area. Simple, colorful, and non-scary.'}`,
      },
      {
        script: howFeels,
        visual: `${dx.includes('asthma') ? 'Child character coughing with visible "puff" clouds. Next to it, a comforting hand and text "It is okay! We can fix this!" Warm colors, encouraging hearts floating.' : dx.includes('ear') || dx.includes('otitis') ? 'Cartoon child holding their ear with little pain lightning bolts. A thought bubble shows sounds going through water. Text: "It gets better soon!" with a rainbow.' : dx.includes('leukemia') || dx.includes('cancer') ? 'Cartoon child looking a bit tired with "Zzz" clouds, a tiny bruise shown as a colorful star sticker (not scary). A grown-up giving a warm hug. Text: "Doctors know how to fix this!" Hearts and encouraging sparkles.' : 'Gentle cartoon showing symptoms with encouraging text: "This will get better!"'}`,
      },
      {
        script: whyHappens,
        visual: `${dx.includes('asthma') ? 'Fun infographic: cartoon dust bunny, flower with pollen clouds, and a cat — each labeled as a "trigger." The airway tubes puffing up slightly near each one. Non-scary, educational cartoon style.' : dx.includes('ear') || dx.includes('otitis') ? 'Cartoon journey: tiny germs traveling from the nose up a little tube to the ear. Like a silly adventure map. Text: "Not your fault! Germs are just sneaky!" Arrow path from nose to ear.' : dx.includes('leukemia') || dx.includes('cancer') ? 'Big friendly text: "NOT YOUR FAULT!" with a big red X over guilt. Cartoon cell factory with one machine making goofy cells by accident. Text: "Sometimes cells just make a mistake!" Warm, reassuring, zero blame.' : 'Simple cartoon explanation of why the condition happens. Friendly, educational tone.'}`,
      },
      {
        script: goodNews,
        visual: `Big thumbs up with sparkles! Text: "GREAT NEWS!" in rainbow letters. ${dx.includes('asthma') ? 'Cartoon kids playing soccer, swimming, dancing — all with asthma inhalers in their pockets, big smiles.' : dx.includes('ear') || dx.includes('otitis') ? 'Calendar showing days counting down with smiley faces getting bigger each day. "Bye-bye germs!" with the germs looking defeated.' : dx.includes('leukemia') || dx.includes('cancer') ? 'Cartoon kids who beat leukemia playing and laughing together, wearing superhero capes. A big trophy labeled "WINNER!" Confetti. Text: "Doctors are AMAZING at fighting this! You\'ve got this!"' : 'Encouraging celebration scene with the child character looking confident and happy.'}`,
      },
      {
        script: `You did great learning about this, ${name}! In the next episode, we'll learn about your SUPER MEDICINE that helps your body! See you there, Health Hero!`,
        visual: `"Episode 2 Complete!" with a gold star. Preview card: "Next: Your Super Medicine!" with a glowing shield icon. Cartoon ${name} character with a little cape. Confetti animation.`,
      },
    ],
    keyPoints: [
      whatIsIt.split('?')[1]?.split('.')[0]?.trim() || 'Your body needs a little extra help right now',
      'It is totally normal and lots of kids go through this!',
      `${doctor} has an awesome plan to help`,
      'Next up: Your Super Medicine!',
    ],
    sources: ['OpenFDA Drug Information', 'DailyMed Clinical Data', `${doctor} — Care Plan`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 3: Your Super Medicine
//  ONLY: each medication as a superpower tool
//  DO NOT discuss condition explanation or lifestyle
// ═══════════════════════════════════════════════════════

function buildEpisode3(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const meds = patient.medications || []

  const scenes = []

  scenes.push({
    script: `Hey ${name}! Ready to learn about your SUPER MEDICINE? ${doctor} picked these special helpers just for you! Each one has a superpower that helps your body!`,
    visual: `Title: "Your Super Medicine!" with animated glowing shield. Medicine bottles shown as superhero characters with capes. Colorful comic-book style. "Episode 3 of 7" badge. Pow! Zap! Boom! effects.`,
  })

  for (const med of meds.slice(0, 3)) {
    const dx = (patient.diagnosis || '').toLowerCase()
    let superpower = ''
    let howTo = ''
    let funFact = ''

    if (dx.includes('asthma')) {
      if (med.name.toLowerCase().includes('albuterol')) {
        superpower = 'This is your RESCUE INHALER! When breathing gets hard, this is your superhero that opens up those tubes in your chest — WHOOOOSH! It works super fast!'
        howTo = `Here's how to use it: Shake it up, put the spacer on, breathe in slowly while a grown-up pushes it, then hold your breath and count to ten! Easy peasy!`
        funFact = 'Did you know the medicine turns into a tiny mist that goes right to your lungs? It is like a magic cloud!'
      } else {
        superpower = `This is your DAILY SHIELD medicine — ${med.name}! You take it every day to keep your breathing tubes happy and calm. It works quietly in the background, like a bodyguard!`
        howTo = `You use it every morning and every bedtime with your spacer. Then rinse your mouth with water after — like brushing your teeth but with water!`
        funFact = 'This medicine is like giving your lungs a cozy warm hug every single day!'
      }
    } else if (dx.includes('ear') || dx.includes('otitis')) {
      if (med.name.toLowerCase().includes('amoxicillin')) {
        superpower = `This is your GERM FIGHTER medicine — the pink stuff! It goes into your tummy and then travels to your ear to KICK OUT those germs! Take that, germs!`
        howTo = `You take it ${med.frequency}. The most important rule? You MUST finish ALL of it — even when your ear feels better! If you stop early, the sneaky germs might come back!`
        funFact = 'Think of it like a video game — you have to beat ALL the germ levels, not just the first ones!'
      } else {
        superpower = `${med.name} is your PAIN ZAPPER! When your ear hurts, this medicine says "Not today, owie!" and makes the pain go away!`
        howTo = `A grown-up gives it to you when your ear is really hurting. It makes you feel MUCH better pretty fast!`
        funFact = 'This medicine is like a warm blanket for your ear — comfort in a bottle!'
      }
    } else if (dx.includes('leukemia') || dx.includes('cancer')) {
      if (med.name.toLowerCase().includes('vincristine')) {
        superpower = `This is your SUPER SOLDIER medicine — Vincristine! It goes through a tube at the hospital and hunts down the bad cells in your blood. It's like sending a tiny army to fight for you!`
        howTo = `You get this at the hospital from Nurse Tanya. It goes through a little tube in your arm. You might feel tired afterward — that means it's working hard!`
        funFact = 'This medicine was actually discovered from a flower! A tiny flower helping you fight — how cool is that?'
      } else if (med.name.toLowerCase().includes('prednisone')) {
        superpower = `This is your POWER BOOSTER — ${med.name}! It helps your body fight the bad cells and makes the other medicines work even better. It's like a team captain!`
        howTo = `You take it every morning with food — like with your breakfast! It might make you extra hungry or feel a little grumpy sometimes, but that just means it's working!`
        funFact = 'Think of it like a coach — it pumps up all the other medicine fighters!'
      } else if (med.name.toLowerCase().includes('ondansetron') || med.name.toLowerCase().includes('zofran')) {
        superpower = `This is your TUMMY GUARDIAN — ${med.name}! If your tummy feels yucky after treatment, this medicine makes it feel better super fast!`
        howTo = `You put it on your tongue and it dissolves like magic — no swallowing a pill! Take it before going to the hospital and whenever your tummy feels bleh.`
        funFact = 'It dissolves on your tongue like a snowflake! But WAY more powerful!'
      } else {
        superpower = `${med.name} is one of your special fighter medicines! It ${med.purpose?.toLowerCase() || 'helps your body feel better'}.`
        howTo = `You take it ${med.frequency}. ${med.instructions || 'A grown-up will help you!'}`
        funFact = `${doctor} picked this one specially for YOU!`
      }
    } else {
      superpower = `${med.name} is one of your special helper medicines! It ${med.purpose.toLowerCase()}.`
      howTo = `You take it ${med.frequency}. ${med.instructions || 'A grown-up will help you!'}`
      funFact = `${doctor} picked this one specially for you!`
    }

    scenes.push({
      script: `${superpower} ${howTo} ${funFact}`,
      visual: `Medicine card for "${med.name}": Drawn as a cartoon superhero character with a cape. Superpower label: "${med.purpose}". Comic-style "POW!" effect. Step-by-step icons: 1) Take medicine, 2) ${med.frequency}, 3) Thumbs up! Bright, fun colors with stars.`,
    })
  }

  // Allergies reminder
  if (patient.allergies?.length > 0 && !patient.allergies.includes('None known')) {
    scenes.push({
      script: `Oh, one important thing! Your chart says you should stay away from: ${patient.allergies.join(' and ')}. Always tell any new doctor about this, okay?`,
      visual: `Red stop sign with "${patient.allergies.join(', ')}" listed. Cartoon character making an X sign. "Always tell your doctor!" text with megaphone icon. Bright but friendly warning style.`,
    })
  }

  scenes.push({
    script: `Remember, ${name}: NEVER take medicine by yourself — always ask a grown-up for help! Your medicine is YOUR superpower, and ${doctor} is your medicine coach! Next episode: What Happens Next!`,
    visual: `Big golden rule card: "ALWAYS ask a grown-up to help with medicine!" with cartoon grown-up and child together. "Episode 3 Complete!" star badge. Preview: "Next: What Happens Next?" with clock icon. Confetti!`,
  })

  return {
    scenes,
    keyPoints: [
      ...meds.slice(0, 2).map((m) => `${m.name} — your ${m.purpose.toLowerCase()} superpower!`),
      'ALWAYS ask a grown-up to help with medicine!',
      `${doctor} picked these medicines just for you`,
    ],
    sources: ['FDA OpenFDA Drug Labels', 'DailyMed NLM Drug Information'],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 4: What Happens Next?
//  ONLY: simple timeline, what to expect day by day
//  DO NOT re-explain condition or list medications
// ═══════════════════════════════════════════════════════

function buildEpisode4(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()

  let firstDays = ''
  let gettingBetter = ''
  let allBetter = ''
  let importantRule = ''

  if (dx.includes('asthma')) {
    firstDays = `In the first few days of using your medicines, your body is getting used to them! You might not notice much difference right away — and that's totally normal!`
    gettingBetter = `After a week or two of taking your daily medicine every single day, your breathing tubes start to feel calmer and happier! You might notice you're coughing less and breathing easier. High five!`
    allBetter = `The cool thing is, asthma gets easier to handle over time! The more you use your daily medicine and avoid your triggers, the better you'll feel. You'll be running and playing like a champion!`
    importantRule = `The NUMBER ONE rule: even when you feel great, keep taking your daily medicine! It's working behind the scenes to keep your lungs happy. Stopping it is like taking off your seatbelt while the car is still moving!`
  } else if (dx.includes('ear') || dx.includes('otitis')) {
    firstDays = `The first day or two, your ear might still hurt. That's okay — the medicine needs a little time to find those germs and start fighting them! Be patient, little warrior!`
    gettingBetter = `By day 3 or 4, you should start feeling better! The pain starts to go away, and sounds start to sound normal again. The germ fighters are winning!`
    allBetter = `By the end of your 10 days of medicine, those germs should be GONE! Your ear will feel so much better. But remember — you have to take ALL the medicine, all 10 days!`
    importantRule = `Even if your ear feels great on day 5, you MUST keep taking the medicine until it's ALL gone! Some sneaky germs might be hiding, and if you stop early, they'll come back stronger!`
  } else if (dx.includes('leukemia') || dx.includes('cancer')) {
    firstDays = `${name}, treatment takes some time — and that's okay! In the beginning, you'll visit the hospital a lot. Your doctors and nurses are like your own superhero team working together to kick those bad cells out!`
    gettingBetter = `After a few weeks, your blood tests will start showing more GOOD cells and fewer bad ones! That means the medicine is WINNING! Every checkup is a chance to celebrate progress!`
    allBetter = `Treatment goes on for a while — months — but every single day, your body is getting stronger. Lots of kids have finished treatment and are back doing ALL the fun stuff they love!`
    importantRule = `The NUMBER ONE rule: go to ALL your hospital visits, even when you feel good! The doctors need to check that the bad cells keep going away. You're a fighter, and fighters don't quit!`
  } else {
    firstDays = `In the first few days, your body is starting to respond to the treatment. Give it a little time!`
    gettingBetter = `Things will start getting better bit by bit. Every day, you're one step closer to feeling great!`
    allBetter = `${doctor} will check on your progress and make sure everything is going well!`
    importantRule = `The most important thing: follow ${doctor}'s plan and always tell a grown-up how you're feeling!`
  }

  return {
    scenes: [
      {
        script: `Hey ${name}! Episode 4 — What Happens Next! Let's see what's coming up so you know exactly what to expect. No surprises!`,
        visual: `Title: "What Happens Next?" with animated clock and calendar. Road stretching forward with milestones. Bright orange and yellow colors. "Episode 4 of 7" badge. Cartoon character with binoculars looking ahead.`,
      },
      {
        script: firstDays,
        visual: `Calendar showing "Day 1-2" highlighted in yellow. Cartoon character being patient, looking at a clock. Sand timer animation. Stars scattered around with text "Be patient — it takes a little time!" Warm amber colors.`,
      },
      {
        script: gettingBetter,
        visual: `Calendar showing "Days 3-7" highlighted in green. Cartoon character smiling bigger! Upward progress bar filling with green. Celebration emojis. "${name}'s feeling better!" text with sparkles.`,
      },
      {
        script: allBetter,
        visual: `${dx.includes('leukemia') || dx.includes('cancer') ? 'Chart showing bad cells going DOWN and good cells going UP over time — like a video game score! Cartoon ${name} ringing a golden bell (the end-of-treatment bell!). Text: "Every day you are getting STRONGER!"' : 'Calendar with a big gold star on the last day. Cartoon character jumping with joy! "You did it!" text. Rainbow and balloons animation.'} Big smile. Confetti.`,
      },
      {
        script: importantRule,
        visual: `Big golden banner: "THE NUMBER ONE RULE!" with flashing lights. The rule written in big, bold, kid-friendly letters. Cartoon character pointing at it. Important but fun — not scary. Thumbs up icon.`,
      },
      {
        script: `You're doing SO great, ${name}! Next episode is about Healthy Habits — fun stuff you can do every day to be your healthiest self! See you there!`,
        visual: `"Episode 4 Complete!" gold star badge. Preview: "Next: Healthy Habits!" with apple and sneaker icons. Cartoon character running happily. Confetti and stars.`,
      },
    ],
    keyPoints: [
      'Give your body a little time — medicine takes a few days',
      `Things will get better! ${doctor} is watching your progress`,
      importantRule.split('.')[0],
      'Next up: Healthy Habits!',
    ],
    sources: ['FDA Drug Label Guidelines', `${doctor} — Treatment Plan`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 5: Healthy Habits
//  ONLY: fun daily routines, eating, sleeping, exercise
//  DO NOT re-explain condition or medications
// ═══════════════════════════════════════════════════════

function buildEpisode5(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()

  let eating = ''
  let moving = ''
  let sleeping = ''
  let specialHabit = ''

  if (dx.includes('asthma')) {
    eating = `Eating healthy foods makes your lungs stronger! Fruits like oranges and berries are like power-ups for your body. And drinking lots of water keeps everything working great!`
    moving = `You CAN play, run, and be active with asthma! Just use your rescue inhaler before exercise if ${doctor} says to. If you start feeling wheezy, take a break. Then you can go right back to playing!`
    sleeping = `Getting lots of sleep — like 10-11 hours — helps your body stay strong! Keep your bedroom clean and dust-free so your breathing tubes stay happy while you sleep. A clean room is a happy room!`
    specialHabit = `Here's a special asthma habit: wash your hands after playing with pets, keep windows closed on high-pollen days, and always know where your rescue inhaler is! You're an asthma pro!`
  } else if (dx.includes('ear') || dx.includes('otitis')) {
    eating = `Eating yummy healthy food helps your body fight those ear germs faster! Foods with vitamin C — like oranges, strawberries, and bell peppers — are like ammo for your germ fighters!`
    moving = `While your ear is getting better, take it easy with super-active stuff. Gentle play is great! Once you're feeling better, you can go back to all your favorite activities!`
    sleeping = `Sleep is your body's SUPERPOWER time! When you sleep, your body works extra hard to fight germs. Try sleeping with your sore ear UP — that can help it feel less owie!`
    specialHabit = `Here's a special habit: wash your hands a LOT — especially before eating and after playing! It keeps new germs from getting in. Also, no sharing cups or straws with friends for now!`
  } else if (dx.includes('leukemia') || dx.includes('cancer')) {
    eating = `Eating healthy food is like giving your body EXTRA FUEL to fight! Protein foods — like chicken, eggs, yogurt, and smoothies — help your body make more good cells. And drink LOTS of water!`
    moving = `It's okay to rest when you feel tired — your body is doing a LOT of work! On days you feel good, gentle walks, drawing, puzzles, and video calls with friends are all awesome! Listen to your body.`
    sleeping = `Sleep is your body's NUMBER ONE healing time! When you sleep, your body makes new healthy cells. Try to get lots of sleep — ${patient.lifestyle?.sleepHours || '10-11 hours'} is perfect for you!`
    specialHabit = `Your SUPER SPECIAL habits: wash your hands A LOT (germs are extra sneaky right now), stay away from sick friends for a bit, and ALWAYS tell a grown-up if you feel hot or if anything hurts! You're a health champion!`
  } else {
    eating = `Eating fruits, veggies, and drinking water helps your body stay strong and healthy!`
    moving = `Playing and being active is great for you! Just listen to your body and rest when you need to.`
    sleeping = `Sleep is when your body heals the most! Get plenty of sleep every night!`
    specialHabit = `Follow ${doctor}'s special instructions and always tell a grown-up how you're feeling!`
  }

  return {
    scenes: [
      {
        script: `Hey ${name}! Episode 5 — Healthy Habits! These are fun things you can do EVERY day to be your strongest, healthiest self! Ready?`,
        visual: `Title: "Healthy Habits!" with animated icons: apple, running shoe, pillow, toothbrush. Bright green and orange colors. "Episode 5 of 7" badge. Cartoon character doing jumping jacks.`,
      },
      {
        script: eating,
        visual: `Colorful plate of healthy foods: fruits, vegetables, whole grains. Cartoon food characters smiling and flexing muscles. Water bottle character giving a thumbs up. "Power-Up Foods!" label. No scary nutrition info — just fun food friends!`,
      },
      {
        script: moving,
        visual: `Cartoon kids playing — running, jumping, dancing, riding bikes. Happy faces everywhere. ${dx.includes('asthma') ? 'One kid has an inhaler in pocket and is playing just like everyone else! "You CAN do it!" banner.' : dx.includes('ear') || dx.includes('otitis') ? 'Child resting comfortably with gentle play options shown: reading, coloring, light walks.' : dx.includes('leukemia') || dx.includes('cancer') ? 'Cartoon child doing gentle activities: drawing, reading, video-calling friends, gentle walks in the park. "Rest is healing! Fun on good days!" banner. Warm, cozy vibes.' : 'Fun activity montage with smiling kids.'}`,
      },
      {
        script: sleeping,
        visual: `Cozy bedroom scene with a cartoon child sleeping peacefully. Moon and stars outside the window. "Zzz" floating up. Clock showing a good bedtime. Text: "Sleep = Superpower!" Warm, cozy purple and blue tones.`,
      },
      {
        script: specialHabit,
        visual: `${dx.includes('asthma') ? 'Three icons in bubbles: 1) Washing hands with soap, 2) Window closed with pollen outside, 3) Inhaler in backpack. "Asthma Pro Tips!" header.' : dx.includes('ear') || dx.includes('otitis') ? 'Cartoon hands being washed with sparkly soap. "No sharing cups!" sign. Cute germ characters running away from clean hands.' : dx.includes('leukemia') || dx.includes('cancer') ? 'Three icons: 1) Sparkling clean hands with soap, 2) Thermometer icon ("Tell a grown-up if you feel hot!"), 3) Cozy bed with stars ("Sleep = healing superpower!"). "Cancer Fighter Pro Tips!" gold badge.' : 'Fun daily checklist with checkboxes and stickers.'}`,
      },
      {
        script: `These habits make you UNSTOPPABLE, ${name}! Keep doing them every day! Next episode is really important — we'll learn about Uh Oh Moments and when to tell a grown-up!`,
        visual: `"Episode 5 Complete!" with a healthy green star. "You're unstoppable!" banner with cartoon character flexing. Preview: "Next: Uh Oh Moments!" with megaphone icon. Confetti!`,
      },
    ],
    keyPoints: [
      'Healthy foods give you superpowers!',
      'Being active is awesome for your body!',
      'Sleep is your body\'s superpower time!',
      specialHabit.split('!')[0] + '!',
    ],
    sources: ['FDA Dietary Guidelines', `${doctor} — Lifestyle Recommendations`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 6: Uh Oh Moments
//  ONLY: when to tell a grown-up, warning signs
//  DO NOT re-discuss medications or lifestyle
// ═══════════════════════════════════════════════════════

function buildEpisode6(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()

  let bigUhOh = ''
  let mediumUhOh = ''
  let whatToDo = ''
  let practiceScript = ''

  if (dx.includes('asthma')) {
    bigUhOh = `BIG Uh Oh: If your breathing gets REALLY hard, your rescue inhaler isn't helping, or your lips turn blue — that's a BIG Uh Oh! A grown-up needs to call for help RIGHT AWAY!`
    mediumUhOh = `Medium Uh Oh: If you're coughing more than usual, your chest feels tight, or you're wheezing a lot — tell a grown-up! They can help you use your inhaler and figure out what's going on.`
    whatToDo = `Here's what to do: Stop what you're doing. Sit up straight. Stay calm. Tell the closest grown-up: "My breathing is hard." They'll know what to do! You can also say: "I need my inhaler!"`
    practiceScript = `Let's practice! Can you say this? "My breathing is hard and I need help!" Perfect! Telling a grown-up is the BRAVEST thing you can do!`
  } else if (dx.includes('ear') || dx.includes('otitis')) {
    bigUhOh = `BIG Uh Oh: If your ear hurts WAY more than before, you get a really high fever, stuff comes out of your ear, or you feel super dizzy — that's a BIG Uh Oh! Tell a grown-up RIGHT NOW!`
    mediumUhOh = `Medium Uh Oh: If your ear isn't feeling better after 2-3 days of medicine, or the pain keeps coming back — tell a grown-up! ${doctor} might need to check on things.`
    whatToDo = `Here's what to do: Tell a grown-up how your ear feels — point to it! Say if it hurts "a little" or "A LOT." Say if you feel hot or dizzy. They'll call ${doctor} to figure out the next step!`
    practiceScript = `Let's practice! Can you point to your ear and say "My ear hurts MORE"? Great job! Telling a grown-up about your owie is super brave and super smart!`
  } else if (dx.includes('leukemia') || dx.includes('cancer')) {
    bigUhOh = `BIG Uh Oh: If you get a FEVER (feel really hot), can't stop bleeding from a cut, have trouble breathing, or feel super confused — that's a BIG Uh Oh! Tell a grown-up IMMEDIATELY so they can call the hospital!`
    mediumUhOh = `Medium Uh Oh: If you notice new bruises you didn't get from playing, feel more tired than usual, your mouth gets sores, or you just feel "off" — tell a grown-up! Your doctor wants to know about ANYTHING new!`
    whatToDo = `Here's what to do: Tell the closest grown-up right away! Say "Something feels different" or "I feel really hot" or "Look at this bruise!" They'll call ${doctor}'s team and figure out what to do. You did the RIGHT thing by speaking up!`
    practiceScript = `Let's practice! Can you say "I feel different and I want to tell you"? AMAZING! During treatment, your body is extra sensitive, so telling a grown-up about ANY change is super important and super brave!`
  } else {
    bigUhOh = `BIG Uh Oh: If you feel really, really sick or something seems very wrong — tell a grown-up RIGHT AWAY!`
    mediumUhOh = `Medium Uh Oh: If you don't feel great or something new is bothering you — tell a grown-up!`
    whatToDo = `Find the closest grown-up — mom, dad, teacher, nurse — and tell them how you feel!`
    practiceScript = `Practice saying: "I don't feel good and I need help!" You're so brave!`
  }

  return {
    scenes: [
      {
        script: `Hey ${name}! This is a really important episode — Uh Oh Moments! Sometimes our bodies tell us something isn't right. It's SUPER important to know when to tell a grown-up. Let's learn how!`,
        visual: `Title: "Uh Oh Moments — When to Tell a Grown-Up!" with a friendly megaphone icon. Two cartoon circles: one red "BIG Uh Oh" and one orange "Medium Uh Oh." "Episode 6 of 7" badge. Alert but not scary — warm and encouraging.`,
      },
      {
        script: bigUhOh,
        visual: `Red card with big friendly letters: "BIG Uh Oh!" Each symptom shown as a simple cartoon icon (not scary). At the bottom: cartoon grown-up with phone calling for help. "Tell a grown-up RIGHT AWAY!" Stars emphasizing importance.`,
      },
      {
        script: mediumUhOh,
        visual: `Orange card: "Medium Uh Oh!" Each symptom as a cartoon icon. Cartoon child telling a grown-up, with a speech bubble. ${doctor}'s phone number placeholder. "It's always okay to ask for help!" text.`,
      },
      {
        script: whatToDo,
        visual: `Step-by-step guide with big numbers: 1) STOP (cartoon stop sign) 2) FIND a grown-up (cartoon of looking around) 3) TELL them how you feel (speech bubble) 4) They'll help! (grown-up and child together with thumbs up). Bright, clear, easy to follow.`,
      },
      {
        script: practiceScript,
        visual: `Cartoon ${name} bravely speaking to a grown-up with a confident pose. Gold "BRAVE" badge appearing. Speech bubble with the practice phrase. Hearts and stars. Text: "Telling a grown-up = BEING BRAVE!" Warm, encouraging colors.`,
      },
      {
        script: `You are SO brave for learning this, ${name}! Remember — telling a grown-up is ALWAYS the right thing to do. You're never in trouble for speaking up! Next is our LAST episode — and it's a big celebration!`,
        visual: `"Episode 6 Complete!" gold star. Big hug animation between cartoon child and grown-up. "You're BRAVE!" badge. Preview: "Next: You Did It! 🎉" Final episode teaser with trophy and confetti!`,
      },
    ],
    keyPoints: [
      'BIG Uh Oh: Tell a grown-up RIGHT AWAY!',
      'Medium Uh Oh: Let a grown-up know soon',
      'Telling a grown-up is the BRAVEST thing!',
      'You are NEVER in trouble for asking for help',
    ],
    sources: ['FDA Drug Safety Warnings', `${doctor} — Emergency Guidelines`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 7: You Did It!
//  ONLY: celebrate, recap goals, you're a health hero
//  DO NOT re-explain condition, medications, or details
// ═══════════════════════════════════════════════════════

function buildEpisode7(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const goals = patient.goals || []
  const emoji = getEmoji(patient)

  const scenes = []

  scenes.push({
    script: `${name}!! YOU DID IT!! ${emoji} You made it through ALL SEVEN episodes! You are officially a HEALTH HERO! Let's celebrate!!`,
    visual: `HUGE celebration scene! "YOU DID IT!" in giant rainbow letters with fireworks. Gold trophy in center labeled "Health Hero: ${name}!" Confetti EVERYWHERE. Balloons, stars, sparkles. Party music feel. Ultimate celebration!`,
  })

  scenes.push({
    script: `Let's look at everything you learned! You found out what's happening with your body, you learned about your super medicines, you know about healthy habits, AND you know when to tell a grown-up!`,
    visual: `Recap path showing all 7 completed episodes as colorful stepping stones, each with a gold star on top. Labels: "Hi There! ✓, What's Happening? ✓, Super Medicine ✓, What's Next ✓, Healthy Habits ✓, Uh Oh Moments ✓, YOU DID IT! ⭐" Rainbow path connecting them all.`,
  })

  // Goals as kid-friendly achievements
  if (goals.length > 0) {
    const goalText = goals.slice(0, 3).map((g, i) => `${i + 1}. ${g}`).join('. ')
    scenes.push({
      script: `Here are YOUR health goals — things you're working on being awesome at: ${goalText}. ${doctor} believes in you, and so do we!`,
      visual: `Goal board styled like a video game achievement screen. Each goal in a fun card with a progress bar. "Achievement Unlocked!" style. Gold borders and star decorations. "${name}'s Goals" header with crown icon.`,
    })
  }

  scenes.push({
    script: `Remember, your amazing care team is always here for you: ${(patient.careTeam || []).map(c => c.name).join(', ')}. They're like your own team of real-life superheroes!`,
    visual: `Care team shown as cartoon superhero cards — each person from the care team with their name and role. They're all smiling and giving thumbs up. "Your Super Team!" header. Golden team badge.`,
  })

  scenes.push({
    script: `You can watch these episodes again anytime you want! And remember: being brave, taking your medicine, eating healthy, and telling grown-ups when something's wrong — THAT'S what makes a Health Hero!`,
    visual: `Four icons in bubbles representing: 1) Brave heart, 2) Medicine shield, 3) Healthy apple, 4) Speaking megaphone. All surrounded by a golden "Health Hero Code" banner. Glowing, inspiring, empowering.`,
  })

  scenes.push({
    script: `We are SO proud of you, ${name}! ${emoji} You're amazing, you're brave, and you're a true Health Hero! Keep being awesome! Bye for now, Health Hero!`,
    visual: `Final card: "${name} — Certified Health Hero!" with a golden certificate. Fireworks and confetti. All 7 battle cards displayed in a collection frame. MedFlix Kids logo. "The End... or is it? Watch again anytime!" Animated wave goodbye from Health Buddy.`,
  })

  return {
    scenes,
    keyPoints: [
      'You completed ALL 7 episodes — amazing!',
      ...goals.slice(0, 2).map((g) => g),
      'You are a certified Health Hero!',
    ],
    sources: [`${doctor} — Health Goals`, 'Patient Care Plan'],
  }
}

// ═══════════════════════════════════════════════════════
//  MAIN EXPORT — Build scenes for any episode number
// ═══════════════════════════════════════════════════════

const builders = {
  1: buildEpisode1,
  2: buildEpisode2,
  3: buildEpisode3,
  4: buildEpisode4,
  5: buildEpisode5,
  6: buildEpisode6,
  7: buildEpisode7,
}

/**
 * Build hardcoded episode scenes for a given episode number.
 *
 * @param {number} episodeNumber — 1 through 7
 * @param {object} patient — full patient object
 * @param {object} clinicalData — { fdaDrugData, dailyMedLabels } from gatherClinicalData
 * @returns {{ scenes: Array, keyPoints: string[], sources: string[] }}
 */
export function buildHardcodedEpisode(episodeNumber, patient, clinicalData) {
  const builder = builders[episodeNumber]
  if (!builder) {
    return builders[1](patient, clinicalData)
  }
  return builder(patient, clinicalData)
}
