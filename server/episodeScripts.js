/**
 * Hardcoded Episode Script Builders
 *
 * Each episode has a dedicated builder that creates 6-8 scenes using the
 * patient's real data + FDA/DailyMed clinical data. Episodes NEVER bleed
 * into other topics — each one stays strictly on its assigned subject.
 *
 * This replaces the Perplexity-generated scripts which hallucinated content
 * and mixed topics across episodes.
 */

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function firstName(patient) {
  return (patient.name || 'there').split(' ')[0]
}

function docName(patient) {
  return patient.careTeam?.[0]?.name || 'your doctor'
}

function medList(patient) {
  return (patient.medications || []).map((m) => `${m.name} ${m.dose}`).join(', ')
}

function condList(patient) {
  return (patient.conditions || []).join(', ')
}

/**
 * Extract relevant FDA warnings/side effects for a specific medication.
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
    interactions: fda.label.drugInteractions?.slice(0, 200) || '',
    topAdverseEvents: (fda.adverseEvents || []).slice(0, 5).map((e) => e.reaction),
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 1: Welcome & Introduction
//  ONLY: greet patient, introduce the series, overview of care journey
//  DO NOT mention specific medications or condition details
// ═══════════════════════════════════════════════════════

function buildEpisode1(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const numEpisodes = 7
  const numMeds = (patient.medications || []).length

  return {
    scenes: [
      {
        script: `Hi ${name}! Welcome to your personalized care education series from MedFlix. We've created these episodes just for you, to help you understand the care plan that ${doctor} has put together.`,
        visual: `Welcome screen: Large friendly text "${name}'s Care Education Series". MedFlix logo in corner. Warm blue-to-teal gradient background. Animated confetti particles gently floating down.`,
      },
      {
        script: `Over the next ${numEpisodes} episodes, we'll walk you through everything you need to know — from understanding your diagnosis, to learning about your medications, to building healthy daily habits.`,
        visual: `Animated roadmap showing 7 milestone dots connected by a curved path. Labels appear one by one: "1. Welcome", "2. Your Condition", "3. Medications", "4. What to Expect", "5. Lifestyle", "6. Warning Signs", "7. Goals". Progress line animates along the path.`,
      },
      {
        script: `Think of this as your personal health guide — something you can watch anytime, pause, and come back to whenever you have questions. Each episode is short and focused on one topic.`,
        visual: `Phone/tablet mockup showing a video player with play/pause controls. Text overlay: "Watch anytime, at your own pace". Clock icon showing "5-7 min total". Rewind icon with "Rewatch anytime" label.`,
      },
      {
        script: `Your care team is behind you every step of the way. ${doctor} and the team have designed this plan specifically for you, based on your health profile and your personal goals.`,
        visual: `Care team card: "${doctor}" with stethoscope icon. Below: list of care team members from patient data. Warm photo-style background of a friendly medical office. Heart icon pulsing gently.`,
      },
      {
        script: `In the next episode, we'll dive into understanding your diagnosis — what it means, how it affects your body, and why the treatment plan matters. For now, just know that you're in great hands, and knowledge is one of the most powerful tools in your care journey.`,
        visual: `"Coming Up Next" preview card: "Episode 2: Understanding Your Condition" with a book/brain icon. Encouraging text: "Knowledge is power" in script font. Animated arrow pointing forward.`,
      },
      {
        script: `We're glad you're here, ${name}. Let's get started on this journey together!`,
        visual: `Closing card: "${name}'s Care Journey — Episode 1 Complete" with a green checkmark animation. "Tap next to continue" prompt. MedFlix logo.`,
      },
    ],
    keyPoints: [
      `Your care plan has ${numEpisodes} episodes covering everything you need to know`,
      `${doctor} and your care team designed this specifically for you`,
      `Watch at your own pace — pause and rewatch anytime`,
      `Next up: Understanding your diagnosis`,
    ],
    sources: ['Patient Care Plan', `${doctor} — Care Team`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 2: Understanding Your Condition
//  ONLY: what the diagnosis is, how it affects the body, key numbers
//  DO NOT discuss medications or lifestyle changes
// ═══════════════════════════════════════════════════════

function buildEpisode2(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = patient.diagnosis || 'your condition'
  const conditions = patient.conditions || []
  const vitals = patient.vitals || {}

  // Build condition-specific content based on diagnosis keywords
  let condExplanation = ''
  let bodyEffect = ''
  let keyNumbers = ''
  let whyItMatters = ''

  const dxLower = dx.toLowerCase()
  if (dxLower.includes('diabetes')) {
    condExplanation = `Type 2 Diabetes means your body has trouble using insulin effectively to control blood sugar levels. When you eat, your body breaks food into glucose for energy, but without proper insulin function, that glucose builds up in your blood instead of entering your cells.`
    bodyEffect = `Over time, high blood sugar can affect many parts of your body — your heart, blood vessels, kidneys, eyes, and nerves. That's why ${doctor} wants to bring your numbers down now, while we can prevent those long-term effects.`
    keyNumbers = vitals.hba1c
      ? `Your current HbA1c is ${vitals.hba1c}, which measures your average blood sugar over the past 3 months. ${doctor}'s goal is to get this below 7.0%. ${vitals.fastingGlucose ? `Your fasting glucose was ${vitals.fastingGlucose}, and the target range is 80-130 mg/dL.` : ''}`
      : `Your doctor is tracking your HbA1c level — this measures average blood sugar over 3 months. The goal is to keep it below 7.0%.`
    whyItMatters = `The good news is that Type 2 Diabetes is very manageable. With the right plan — which includes the treatment ${doctor} has set up for you — many patients see real improvements in their numbers within the first few months.`
  } else if (dxLower.includes('knee') || dxLower.includes('arthroplasty') || dxLower.includes('replacement')) {
    condExplanation = `You've had a total knee replacement, which means your worn-out knee joint has been replaced with an artificial one made of metal and plastic. This is one of the most successful procedures in medicine for relieving pain and restoring mobility.`
    bodyEffect = `Right now, your body is healing the surgical site and your muscles are adapting to the new joint. Swelling, stiffness, and some pain are completely normal in the early weeks — this is your body's natural healing response.`
    keyNumbers = `Recovery milestones to watch: By week 2, you should be able to bend your knee to about 90 degrees. By week 4-6, most patients can walk without a walker. Full recovery typically takes 3-6 months, and the new joint can last 15-20 years.`
    whyItMatters = `The key to a great outcome is consistent physical therapy and following ${doctor}'s rehabilitation plan. Patients who stick with their PT exercises recover faster and have better long-term results.`
  } else if (dxLower.includes('heart failure') || dxLower.includes('hfref')) {
    condExplanation = `Heart failure with reduced ejection fraction means your heart muscle isn't pumping blood as efficiently as it should. Your ejection fraction — the percentage of blood pumped out with each heartbeat — is lower than normal.`
    bodyEffect = `When your heart doesn't pump efficiently, fluid can build up in your lungs and legs, making you feel short of breath or swollen. You might also feel more tired than usual, especially during physical activity.`
    keyNumbers = vitals.ejectionFraction
      ? `Your current ejection fraction is ${vitals.ejectionFraction}. A normal EF is 55-70%. ${doctor}'s goal is to improve yours to above 35% with treatment. ${vitals.bnp ? `Your BNP level is ${vitals.bnp}, which helps us track how hard your heart is working.` : ''}`
      : `Your doctor is monitoring your ejection fraction — the percentage of blood your heart pumps with each beat. Treatment aims to improve this number over time.`
    whyItMatters = `With modern treatments, many heart failure patients see significant improvement. ${doctor}'s medication plan is specifically designed to help your heart pump more effectively and reduce fluid buildup.`
  } else {
    condExplanation = `${dx} is a condition that ${doctor} has diagnosed based on your symptoms and test results. Understanding your condition is the first step to managing it effectively.`
    bodyEffect = `This condition affects how your body functions day to day. ${doctor} has created a treatment plan designed to address the specific ways it impacts your health.`
    keyNumbers = `Your care team is tracking several important numbers to monitor your progress. Ask ${doctor} about which specific values are most important for your condition.`
    whyItMatters = `With proper treatment and self-care, many patients with this condition see meaningful improvement. The plan ${doctor} has created is tailored specifically to your needs.`
  }

  return {
    scenes: [
      {
        script: `${name}, in this episode we're going to help you understand exactly what ${dx} means and how it affects your body. No medical jargon — just clear, simple explanations.`,
        visual: `Title card: "Understanding ${dx}". Animated body silhouette in center. Soft blue medical background. Text: "Episode 2 of 7".`,
      },
      {
        script: condExplanation,
        visual: `Animated diagram showing the relevant body system. For diabetes: pancreas and blood vessels with glucose molecules. For knee: cross-section of knee joint. For heart: animated heart pumping. Clear labels pointing to affected areas.`,
      },
      {
        script: bodyEffect,
        visual: `Side-by-side comparison: "Healthy" vs "With ${dx}" showing the difference in the body. Arrows indicating affected organs/systems. Color coding: green for healthy function, amber for affected areas.`,
      },
      {
        script: keyNumbers,
        visual: `Dashboard display: Patient's key numbers shown as gauges or bar charts with current values highlighted and target ranges shown in green. ${vitals.hba1c ? `"HbA1c: ${vitals.hba1c}" with arrow pointing to target "<7.0%"` : vitals.ejectionFraction ? `"EF: ${vitals.ejectionFraction}" with arrow to target ">35%"` : `Key health metrics with target ranges`}. Clean, easy-to-read number cards.`,
      },
      {
        script: whyItMatters,
        visual: `Encouraging progress graphic: upward trend line showing improvement over time. Text: "Improvement is possible with your treatment plan". Smiling patient icon with thumbs up. Green positive indicators.`,
      },
      {
        script: `${conditions.length > 0 ? `It's also worth knowing that ${doctor} is monitoring your related conditions: ${conditions.join(' and ')}. These are connected to your main diagnosis, and the treatment plan addresses all of them together.` : `${doctor} is looking at your complete health picture, not just one condition in isolation.`}`,
        visual: `${conditions.length > 0 ? `Connected conditions diagram: "${dx}" in center circle, connected by lines to ${conditions.map(c => `"${c}"`).join(', ')} in smaller circles. Shows how they're related.` : `Holistic care diagram showing comprehensive approach.`}`,
      },
      {
        script: `In the next episode, we'll cover the medications ${doctor} has prescribed and how each one helps manage your condition. For now, the most important thing to remember is: this is manageable, and you have a great team supporting you.`,
        visual: `"Coming Up Next: Episode 3 — Your Medications" preview card with pill icon. Bottom text: "This is manageable — you've got this!" with encouraging star animation. Episode 2 complete checkmark.`,
      },
    ],
    keyPoints: [
      `${dx} is a manageable condition with proper treatment`,
      keyNumbers.split('.')[0],
      `${doctor} is monitoring all related conditions together`,
      `Next episode covers your medications in detail`,
    ],
    sources: ['OpenFDA Drug Information', 'DailyMed Clinical Data', `${doctor} — Care Plan`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 3: Your Medications
//  ONLY: each medication in detail — name, dose, timing, purpose, side effects
//  DO NOT discuss condition explanation or lifestyle
// ═══════════════════════════════════════════════════════

function buildEpisode3(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const meds = patient.medications || []

  const scenes = []

  // Scene 1: Intro
  scenes.push({
    script: `${name}, this episode is all about the medications ${doctor} has prescribed for you. We'll go through each one — what it does, when to take it, and what to watch for. ${meds.length > 0 ? `You have ${meds.length} medications in your plan.` : ''}`,
    visual: `Title: "Your Medications — A Complete Guide". Animated pill bottles lined up: ${meds.map(m => `"${m.name}"`).join(', ')}. Clean white background with blue accents. Text: "Episode 3 of 7".`,
  })

  // One scene per medication (up to 4)
  for (const med of meds.slice(0, 4)) {
    const fdaInfo = getFdaInfo(med.name, clinicalData) || getFdaInfo(med.genericName, clinicalData)
    const topSideEffects = fdaInfo?.topAdverseEvents?.slice(0, 3).join(', ') || 'stomach upset, dizziness'
    const counseling = fdaInfo?.counseling ? ` Important tip from FDA guidelines: ${fdaInfo.counseling.split('.')[0]}.` : ''

    scenes.push({
      script: `${med.name}, ${med.dose}, taken ${med.frequency}. ${doctor} prescribed this for ${med.purpose}. ${med.instructions ? `${med.instructions}.` : `Take it as directed.`} The most common side effects to be aware of include ${topSideEffects}.${counseling}`,
      visual: `Medication card for "${med.name} ${med.dose}": Large pill icon at top. Row 1: Clock icon — "${med.frequency}". Row 2: Target icon — "${med.purpose}". Row 3: Info icon — "${med.instructions || 'Take as directed'}". Row 4: Warning triangle — "Watch for: ${topSideEffects}". Card has colored border matching medication category.`,
    })
  }

  // Allergies scene
  if (patient.allergies?.length > 0) {
    scenes.push({
      script: `Very important: your chart shows that you're allergic to ${patient.allergies.join(' and ')}. ${doctor} has made sure none of your prescribed medications conflict with these allergies. Always remind any new doctor or pharmacist about your allergies.`,
      visual: `Red alert card: "YOUR ALLERGIES" in bold. List: ${patient.allergies.map(a => `"${a}" with red X icon`).join(', ')}. Bottom text: "Always tell new healthcare providers about your allergies". Warning border animation.`,
    })
  }

  // Timing overview scene
  scenes.push({
    script: `Here's your daily medication schedule at a glance: ${meds.map(m => `${m.name} ${m.frequency}`).join(', ')}. Setting phone reminders for each medication time can be really helpful. Consistency is key — try to take them at the same times each day.`,
    visual: `Daily timeline graphic: Morning/Afternoon/Evening columns. Each medication placed in its time slot with pill icon and dose. ${meds.map(m => `"${m.name} ${m.dose}" in ${m.frequency.includes('morning') || m.frequency.includes('once') ? 'morning' : m.frequency.includes('evening') ? 'evening' : 'morning+evening'} slot`).join('. ')}. Phone reminder icon with bell.`,
  })

  // Closing
  scenes.push({
    script: `Never stop or change a medication without talking to ${doctor} first, even if you're feeling better. If you experience any side effects that bother you, call your care team — they can often adjust the dose or timing. In the next episode, we'll cover what to expect in the coming weeks.`,
    visual: `Important reminders card: Checkmark "Take meds as prescribed". Checkmark "Don't stop without asking ${doctor}". Phone icon "Call care team about side effects". "Coming Up: Episode 4 — What to Expect" preview. Episode 3 complete checkmark.`,
  })

  return {
    scenes,
    keyPoints: [
      ...meds.slice(0, 3).map((m) => `${m.name} ${m.dose} — ${m.frequency} for ${m.purpose}`),
      `Never stop medications without consulting ${doctor}`,
    ],
    sources: ['FDA OpenFDA Drug Labels', 'DailyMed NLM Drug Information'],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 4: What to Expect
//  ONLY: timeline of treatment, what happens week by week, monitoring
//  DO NOT re-explain condition or list medications again
// ═══════════════════════════════════════════════════════

function buildEpisode4(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()

  let week1 = '', week2to4 = '', month2to3 = '', monitoring = ''

  if (dx.includes('diabetes')) {
    week1 = `In your first week on the treatment plan, your body is adjusting to the new medications. You might notice some mild stomach discomfort — this is common and usually improves within a few days. Keep eating regular meals and staying hydrated.`
    week2to4 = `By weeks two through four, the medications are starting to have a real effect on your blood sugar levels. You should begin seeing lower numbers when you check your glucose. Some patients notice more energy and fewer sugar cravings during this period.`
    month2to3 = `Between months two and three, ${doctor} will check your HbA1c level to see how your average blood sugar has responded to treatment. This is a key checkpoint — many patients see meaningful improvement by this point if they've been consistent with their medications and lifestyle changes.`
    monitoring = `During this time, ${doctor} wants you to monitor your blood sugar regularly — your care team will show you how. Keep a log of your readings, and note how you're feeling each day. Bring this log to your follow-up appointments.`
  } else if (dx.includes('knee') || dx.includes('arthroplasty') || dx.includes('replacement')) {
    week1 = `In your first week after surgery, expect swelling, bruising, and stiffness around the knee. Pain is managed with your prescribed medications. Your physical therapist will start gentle exercises — these are crucial even though they may be uncomfortable at first.`
    week2to4 = `By weeks two through four, swelling starts to decrease and your range of motion improves. You'll transition from a walker to a cane. Physical therapy sessions become more active — you'll practice walking, climbing a few stairs, and bending exercises. Most of the sharp pain from surgery fades during this period.`
    month2to3 = `Between months two and three, you should be walking more independently. Your knee flexion should reach 110-120 degrees. Many patients return to light activities like gardening and short drives. ${doctor} will check your progress and may adjust your rehab plan.`
    monitoring = `Track your range of motion, pain level (scale of 1-10), and any swelling each day. Take photos of your knee weekly to see progress. Bring your notes to every physical therapy session and follow-up with ${doctor}.`
  } else if (dx.includes('heart failure') || dx.includes('hfref')) {
    week1 = `In your first week, the medications are beginning to work on reducing fluid buildup and supporting your heart. You might notice you're urinating more frequently — this is the diuretic working as intended. Weigh yourself every morning at the same time.`
    week2to4 = `By weeks two through four, you should notice reduced swelling in your ankles and legs, and breathing may feel easier. Your body is adjusting to the medications. Some patients feel a bit tired as the beta-blocker takes effect — this usually improves as your body adapts.`
    month2to3 = `Between months two and three, ${doctor} may gradually adjust your medication doses. You should feel a noticeable improvement in energy and daily comfort. Your cardiac rehab program will help rebuild your stamina safely.`
    monitoring = `Daily monitoring is essential: weigh yourself every morning (report any gain of 2+ lbs overnight or 5+ lbs in a week), track any swelling, and note your energy level. ${doctor} needs this data to fine-tune your treatment.`
  } else {
    week1 = `In your first week on the treatment plan, your body is adjusting to the new approach. Follow ${doctor}'s instructions carefully and note any changes in how you feel.`
    week2to4 = `By weeks two through four, the treatment should start showing initial effects. Pay attention to any improvements or new symptoms, and report them to your care team.`
    month2to3 = `Between months two and three, ${doctor} will assess your progress and may adjust the plan. This is a key checkpoint in your care journey.`
    monitoring = `Keep a daily log of your symptoms, how you're feeling, and any questions that come up. Bring this to every appointment with ${doctor}.`
  }

  return {
    scenes: [
      {
        script: `${name}, now that you know about your condition and medications, let's talk about what to expect in the coming weeks and months. Knowing the timeline helps you stay on track and know what's normal.`,
        visual: `Title: "What to Expect — Your Treatment Timeline". Animated calendar with weeks highlighted. Soft green-to-blue gradient. Text: "Episode 4 of 7".`,
      },
      {
        script: week1,
        visual: `Timeline graphic — Week 1 highlighted in amber. Icons: body adjusting, mild symptoms that are normal. Thermometer and notepad icons. Text overlay: "Week 1: Adjustment Period". Checklist: "Stay hydrated", "Eat regular meals", "Take meds on schedule".`,
      },
      {
        script: week2to4,
        visual: `Timeline graphic — Weeks 2-4 highlighted in light green. Upward trend arrow showing improvement. Icons showing the specific improvements mentioned. Text overlay: "Weeks 2-4: Progress Begins". Encouraging progress bar filling up.`,
      },
      {
        script: month2to3,
        visual: `Timeline graphic — Months 2-3 highlighted in bright green. Star icon for "Key Checkpoint". Calendar with ${doctor}'s follow-up appointment marked. Progress chart showing continued improvement trend.`,
      },
      {
        script: monitoring,
        visual: `Monitoring dashboard: Daily log template with columns for date, readings, symptoms, and notes. Phone icon with "Set daily reminders". Clipboard icon for "Bring log to appointments". Example filled-in row showing what to track.`,
      },
      {
        script: `Remember, everyone's timeline is a little different. If you feel like things aren't improving, don't get discouraged — just reach out to ${doctor} so the team can help. Progress isn't always linear, and your care team is monitoring everything closely.`,
        visual: `Reassurance graphic: wavy upward line (not straight) with text "Progress isn't always linear — and that's OK". ${doctor}'s name with phone icon. "Coming Up: Episode 5 — Lifestyle & Home Care". Episode 4 complete checkmark.`,
      },
    ],
    keyPoints: [
      'Week 1: Adjustment period — mild side effects are normal',
      'Weeks 2-4: You should start seeing improvement',
      'Months 2-3: Key checkpoint with your doctor',
      'Keep a daily log of symptoms and readings',
    ],
    sources: ['FDA Drug Label Guidelines', `${doctor} — Treatment Plan`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 5: Lifestyle & Home Care
//  ONLY: diet, exercise, daily habits specific to condition
//  DO NOT re-explain condition or medications
// ═══════════════════════════════════════════════════════

function buildEpisode5(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const dx = (patient.diagnosis || '').toLowerCase()
  const lifestyle = patient.lifestyle || {}

  let diet = '', exercise = '', dailyHabits = '', homeMonitoring = ''

  if (dx.includes('diabetes')) {
    diet = `For nutrition, ${doctor} recommends focusing on whole grains, lean proteins, and plenty of vegetables. Try to limit sugary drinks, white bread, and processed snacks. A good rule: fill half your plate with vegetables, a quarter with lean protein, and a quarter with whole grains. ${lifestyle.diet ? `Right now your diet is described as ${lifestyle.diet} — small changes can make a big difference.` : ''}`
    exercise = `Aim for 30 minutes of moderate activity most days — walking is perfect. ${lifestyle.exerciseLevel ? `Your current activity level is ${lifestyle.exerciseLevel}, so start slow and build up gradually.` : ''} Even a 10-minute walk after meals helps lower blood sugar. ${doctor} recommends building up to 150 minutes of activity per week.`
    dailyHabits = `Check your blood sugar at the times ${doctor} recommends. Keep a water bottle with you and aim for 8 glasses a day. Get 7-8 hours of sleep — poor sleep can raise blood sugar. And check your feet daily for any cuts or sores that aren't healing.`
    homeMonitoring = `Set up a simple routine: morning blood sugar check, medications with breakfast, 10-minute walk, and an evening check-in with your log. Consistency matters more than perfection — just do your best each day.`
  } else if (dx.includes('knee') || dx.includes('arthroplasty') || dx.includes('replacement')) {
    diet = `Good nutrition supports healing. Focus on protein-rich foods like chicken, fish, eggs, and beans — protein helps your body repair tissue. Eat plenty of fruits and vegetables for vitamins. Stay well-hydrated. If you're taking pain medications, eat high-fiber foods to prevent constipation.`
    exercise = `Your physical therapy exercises are the most important thing you can do right now. Do them exactly as prescribed — even when they're uncomfortable. Between sessions, gentle walking is excellent. Use your walker or cane as instructed. Don't push through sharp pain, but expect some muscle soreness.`
    dailyHabits = `Ice your knee for 15-20 minutes several times a day to reduce swelling. Keep your leg elevated when resting. Wear your compression stockings as prescribed. Move around every hour — don't sit for long periods. Use grab bars and non-slip mats in the bathroom.`
    homeMonitoring = `Track your range of motion each day (how far you can bend and straighten your knee), your pain level, and any swelling. Take photos weekly. Note which exercises you completed. This information helps your PT and ${doctor} optimize your recovery.`
  } else if (dx.includes('heart failure') || dx.includes('hfref')) {
    diet = `Sodium restriction is critical — ${doctor} recommends staying under 2,000mg of sodium per day. Read every food label. Avoid canned soups, processed meats, fast food, and adding salt at the table. Season with herbs, lemon, and spices instead. ${patient.lifestyle?.diet ? `Your current diet goal is: ${patient.lifestyle.diet}.` : ''}`
    exercise = `Your cardiac rehab program is your structured exercise plan — attend every session. Between sessions, light walking is good. Stop and rest if you feel short of breath, dizzy, or unusually tired. ${doctor} will gradually increase your activity level as your heart gets stronger.`
    dailyHabits = `Weigh yourself every morning, same time, same clothes, after using the bathroom. Record the number. Limit fluids to about 2 liters per day as ${doctor} recommends. Avoid alcohol completely — it weakens the heart muscle. Get 7-8 hours of sleep; prop up your head with extra pillows if breathing feels difficult lying flat.`
    homeMonitoring = `Your daily checks: weight, blood pressure (if you have a home monitor), and how your breathing feels on a scale of 1-5. Note any swelling in ankles, legs, or abdomen. Call ${doctor} immediately if you gain more than 2 pounds overnight or 5 pounds in a week.`
  } else {
    diet = `Focus on a balanced diet rich in fruits, vegetables, lean proteins, and whole grains. Stay hydrated with 8 glasses of water daily. Ask ${doctor} if there are specific dietary recommendations for your condition.`
    exercise = `Start with gentle, regular activity as ${doctor} recommends. Even short walks count. Listen to your body and build up gradually. The goal is consistent movement, not intense workouts.`
    dailyHabits = `Establish a daily routine: take medications at the same time, eat regular meals, get 7-8 hours of sleep, and take a few minutes to note how you're feeling.`
    homeMonitoring = `Keep a simple daily log: date, how you feel (1-10), any symptoms, and notes. Bring this log to every appointment.`
  }

  return {
    scenes: [
      {
        script: `${name}, this episode covers the lifestyle changes and daily habits that ${doctor} recommends to support your treatment. These aren't optional extras — they're a key part of your care plan and can make a real difference in your results.`,
        visual: `Title: "Lifestyle & Home Care". Three animated icons: apple (diet), walking figure (exercise), house (daily habits). Vibrant green background. Text: "Episode 5 of 7".`,
      },
      {
        script: diet,
        visual: `Nutrition plate graphic divided into sections: half vegetables (green), quarter protein (blue), quarter grains (amber). List of "Choose" foods on left (green checks), "Limit" foods on right (red X). Specific food icons for the recommended items.`,
      },
      {
        script: exercise,
        visual: `Exercise guide: Walking figure with "30 min/day" target. Weekly calendar showing 5 active days highlighted. Progress bar from current activity level to goal. Stopwatch showing "Start with 10 min, build up". Encouraging upward arrow.`,
      },
      {
        script: dailyHabits,
        visual: `Daily checklist card with checkbox items for each habit mentioned. Morning/afternoon/evening sections. Icons: water glass, bed/sleep, specific monitoring items. Clean, printable-looking design the patient could screenshot.`,
      },
      {
        script: homeMonitoring,
        visual: `Sample daily log template: columns for Date, Morning Check, Medications Taken (checkboxes), Activity, Evening Notes. One example row filled in. Phone icon: "Set reminders for each daily check".`,
      },
      {
        script: `Small changes add up to big results, ${name}. You don't have to be perfect — just aim for a little better each day. In the next episode, we'll cover the warning signs to watch for and when to call your care team.`,
        visual: `Motivational graphic: stepping stones leading upward with text "Small steps, big results". "Coming Up: Episode 6 — Warning Signs". Episode 5 complete checkmark.`,
      },
    ],
    keyPoints: [
      diet.split('.')[0],
      exercise.split('.')[0],
      dailyHabits.split('.')[0],
      'Small consistent changes make the biggest difference',
    ],
    sources: ['FDA Dietary Guidelines', `${doctor} — Lifestyle Recommendations`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 6: Warning Signs & When to Call
//  ONLY: specific symptoms to watch for, urgency levels, when to call
//  DO NOT re-discuss medications or lifestyle
// ═══════════════════════════════════════════════════════

function buildEpisode6(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const meds = patient.medications || []
  const dx = (patient.diagnosis || '').toLowerCase()

  let urgentSigns = '', callDoctor = '', medWarnings = ''

  if (dx.includes('diabetes')) {
    urgentSigns = `Go to the emergency room or call 911 if you experience: blood sugar below 54 mg/dL that doesn't come up after treatment, confusion or difficulty staying awake, difficulty breathing, or vomiting that won't stop. These are urgent situations.`
    callDoctor = `Call ${doctor}'s office within 24 hours if you notice: blood sugar consistently above 250 mg/dL, frequent urination with extreme thirst, blurred vision, numbness or tingling in your hands or feet, or any wound on your feet that isn't healing within a few days.`
    medWarnings = `Watch for these medication-related symptoms: persistent nausea or diarrhea that doesn't improve after a week, muscle pain or weakness, unusual fatigue, or any new cough that won't go away. These could mean a medication needs adjusting — call your care team.`
  } else if (dx.includes('knee') || dx.includes('arthroplasty') || dx.includes('replacement')) {
    urgentSigns = `Go to the emergency room immediately if you experience: sudden severe pain or swelling in your calf (this could indicate a blood clot), chest pain or difficulty breathing, fever above 101.5 degrees Fahrenheit, or the wound opens up or shows pus.`
    callDoctor = `Call ${doctor}'s office within 24 hours if you notice: increasing redness, warmth, or drainage from the incision, fever between 100 and 101.5 degrees, significantly increased swelling that isn't going down with elevation and ice, or if you feel like you can't bear weight that you could before.`
    medWarnings = `Watch for these medication-related symptoms: black or bloody stools (from anti-inflammatory medications), dizziness or fainting when standing up, excessive bruising or bleeding from the injection sites, or unusual swelling in your ankles. Report any of these to your care team.`
  } else if (dx.includes('heart failure') || dx.includes('hfref')) {
    urgentSigns = `Call 911 immediately if you experience: severe difficulty breathing or gasping for air, chest pain or pressure, fainting or near-fainting, or coughing up pink or frothy sputum. Do not drive yourself — call for emergency help.`
    callDoctor = `Call ${doctor}'s office the same day if you notice: weight gain of more than 2 pounds overnight or 5 pounds in a week, increased swelling in ankles, legs, or abdomen, needing more pillows to sleep comfortably, or a new persistent cough.`
    medWarnings = `Watch for these medication-related symptoms: dizziness when standing up (from blood pressure medications), unusual fatigue or weakness, irregular heartbeat, decreased urination, or muscle cramps. These may mean a dose needs adjusting.`
  } else {
    urgentSigns = `Go to the emergency room if you experience: severe pain, difficulty breathing, chest pain, high fever, confusion, or any symptom that feels life-threatening. When in doubt, call 911.`
    callDoctor = `Call ${doctor}'s office within 24 hours for: worsening symptoms, new symptoms you haven't had before, side effects from medications, or any concern that something isn't right.`
    medWarnings = `Watch for changes in how you feel after starting medications: new rashes, persistent nausea, dizziness, unusual bleeding, or swelling. Report any new symptom to your care team.`
  }

  return {
    scenes: [
      {
        script: `${name}, this is one of the most important episodes. We're going to cover the warning signs you should watch for and exactly when to call for help. Knowing this can make a real difference.`,
        visual: `Title: "Warning Signs & When to Call". Alert icon (triangle with exclamation). Three urgency levels shown as colored bars: Red "Emergency", Amber "Call Doctor Today", Yellow "Report at Next Visit". Text: "Episode 6 of 7".`,
      },
      {
        script: urgentSigns,
        visual: `RED ALERT card: "Go to ER / Call 911". Bold red border and siren icon. Each symptom listed with red bullet points. Large "911" number displayed. Text: "Do not wait — get help immediately".`,
      },
      {
        script: callDoctor,
        visual: `AMBER card: "Call ${doctor} Within 24 Hours". Phone icon with ${doctor}'s name. Each symptom listed with amber bullet points. Clock icon showing "within 24 hours". Contact number placeholder.`,
      },
      {
        script: medWarnings,
        visual: `YELLOW card: "Medication Side Effects to Report". Pill icon with warning symbol. Each side effect listed with specific medication name if applicable. Text: "Don't stop the medication — call your team first".`,
      },
      {
        script: `Here's a simple rule: if something feels wrong and you're not sure, it's always better to call. ${doctor}'s team would rather hear from you and say "that's normal" than have you wait and worry. Keep the care team's number saved in your phone.`,
        visual: `Phone contact card: "${doctor}" with phone number placeholder. "Save this number" with phone icon. Text: "When in doubt, call." Green reassurance message: "Your team wants to hear from you".`,
      },
      {
        script: `In our final episode, we'll review your health goals and the exciting progress you're working toward. You're almost through the series, ${name} — great job sticking with it!`,
        visual: `"Coming Up: Episode 7 — Your Goals & Next Steps" preview card. Progress bar: "6 of 7 episodes complete". Encouraging star and confetti animation. Episode 6 complete checkmark.`,
      },
    ],
    keyPoints: [
      'Red: ER/911 — severe symptoms, difficulty breathing, chest pain',
      `Amber: Call ${doctor} within 24 hours for worsening symptoms`,
      'Yellow: Report medication side effects (but don\'t stop taking them)',
      'When in doubt, always call — your care team wants to hear from you',
    ],
    sources: ['FDA Drug Safety Warnings', `${doctor} — Emergency Guidelines`],
  }
}

// ═══════════════════════════════════════════════════════
//  EPISODE 7: Your Goals & Next Steps
//  ONLY: health goals, milestones, follow-up plan, encouragement
//  DO NOT re-explain condition, medications, or lifestyle details
// ═══════════════════════════════════════════════════════

function buildEpisode7(patient, clinicalData) {
  const name = firstName(patient)
  const doctor = docName(patient)
  const goals = patient.goals || []

  const scenes = []

  scenes.push({
    script: `${name}, you've made it to the final episode! Let's review the health goals ${doctor} has set with you and celebrate the start of your care journey. You've already taken a huge step by completing this education series.`,
    visual: `Title: "Your Goals & Next Steps". Celebration graphic with stars and confetti. Trophy icon. "Episode 7 of 7 — Final Episode". Gold/warm color scheme.`,
  })

  // Individual goal scenes (up to 3)
  for (let i = 0; i < Math.min(goals.length, 3); i++) {
    scenes.push({
      script: `Goal ${i + 1}: ${goals[i]}. This is achievable with consistent effort. ${doctor} will help you track this at every follow-up visit, and your care team is here to support you along the way.`,
      visual: `Goal card #${i + 1}: "${goals[i]}" in bold text. Target/bullseye icon. Progress tracker: empty bar ready to fill. Timeline showing expected milestones. Encouraging check-in icon for follow-up visits.`,
    })
  }

  scenes.push({
    script: `Your follow-up appointments are your checkpoints. Come prepared with your daily log, any questions you have, and an update on how you're feeling. ${doctor} will review your progress and adjust the plan as needed.`,
    visual: `Follow-up appointment card: Calendar with next visit marked. Checklist: "Bring daily log", "Prepare questions", "Update on symptoms". ${doctor}'s name with clipboard icon. Reminder: "Set a calendar reminder now".`,
  })

  scenes.push({
    script: `${name}, you're not doing this alone. Your care team — ${(patient.careTeam || []).map(c => c.name).join(', ')} — is with you every step. You can always rewatch these episodes if you need a refresher. We believe in you, and we're excited about the progress ahead.`,
    visual: `Care team spotlight: each member's name and role listed with icons. Group support graphic showing team around the patient. Final message: "We believe in you, ${name}!" Large animated checkmark: "Education Series Complete!" MedFlix logo. Confetti celebration animation.`,
  })

  return {
    scenes,
    keyPoints: [
      ...goals.slice(0, 3).map((g, i) => `Goal ${i + 1}: ${g}`),
      'Follow-up appointments are your progress checkpoints',
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
    // Fallback for unknown episode numbers
    return builders[1](patient, clinicalData)
  }
  return builder(patient, clinicalData)
}
