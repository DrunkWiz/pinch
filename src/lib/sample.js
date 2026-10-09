export const sampleCard = {
  title: 'Betty’s Sunday pancakes',
  ingredients: [
    { name: 'Flour', amount: '1 cup', confirmed: false },
    { name: 'Egg', amount: '1', confirmed: false },
    { name: 'Milk', amount: 'about ¾ cup', confirmed: true },
    { name: 'Butter, for the pan', amount: 'amount unknown', confirmed: false },
  ],
  method: [
    {
      text: 'Mix 1 cup of flour with 1 egg. Pour in about ¾ cup of milk and stir gently.',
      reason: 'A few lumps are good. Don’t overmix or they’ll go tough.',
    },
    {
      text: 'Melt butter in a pan over medium heat. Pour in the batter.',
      reason: '',
    },
    {
      text: 'Flip when little bubbles appear on top and the edges look dry.',
      reason: '',
    },
  ],
  marginNotes: [
    {
      attachTo: 'ingredient:2',
      quote: 'About ¾ cup. Just enough so it runs off the spoon.',
      kind: 'she_clarified',
    },
    {
      attachTo: 'method:0',
      quote: 'A few lumps are good. Don’t overmix or they’ll go tough.',
      kind: 'her_reason',
    },
    {
      attachTo: 'method:2',
      quote: 'The first one is always for the cook.',
      kind: 'her_words',
    },
  ],
  stillUnknown: [
    {
      item: 'Butter amount',
      herWords: 'a little butter in the pan',
      note: 'Ask Betty next time',
    },
  ],
}
export const demoSteps = [
  'Mix 1 cup of flour with 1 egg. Add a splash of milk.',
  'Stir gently. A few lumps are good. Don’t overmix or they’ll go tough.',
  'Melt a little butter in a pan over medium heat. Pour in the batter.',
  'Flip when little bubbles appear on top and the edges look dry. The first one is always for the cook.',
]
export function demoCheck(text) {
  const match = text.match(/a splash of milk|a little butter/i)
  return {
    transcript: text,
    clear: !match,
    vagueItems: match
      ? [
          {
            item: /milk/i.test(match[0]) ? 'Milk amount' : 'Butter amount',
            herWords: match[0],
          },
        ]
      : [],
    question: match
      ? `How much ${/milk/i.test(match[0]) ? 'milk is a splash' : 'butter goes in the pan'}?`
      : null,
  }
}

// The walkthrough is local and explicitly labelled; use only its captured words.
export function demoCard(session) {
  const steps = session.steps.filter((s) => s.transcript)
  const text = steps.map((s) => s.transcript).join(' ')
  const milk = steps.find((s) => /splash of milk/i.test(s.transcript))
  const ingredients = []
  if (/1 cup of flour/i.test(text))
    ingredients.push({ name: 'Flour', amount: '1 cup', confirmed: false })
  if (/1 egg/i.test(text))
    ingredients.push({ name: 'Egg', amount: '1', confirmed: false })
  if (milk)
    ingredients.push({
      name: 'Milk',
      amount:
        milk.answer?.outcome === 'answered'
          ? milk.answer.transcript
          : 'amount unknown',
      confirmed: milk.answer?.outcome === 'answered',
    })
  if (/a little butter/i.test(text))
    ingredients.push({
      name: 'Butter',
      amount: 'amount unknown',
      confirmed: false,
    })
  return {
    title: `${session.cook}’s ${session.dish}`,
    ingredients,
    method: steps.map((s) => ({ text: s.transcript, reason: '' })),
    marginNotes: steps.flatMap((s, i) =>
      s.answer?.transcript
        ? [
            {
              attachTo: `method:${i}`,
              quote: s.answer.transcript,
              kind: 'she_clarified',
            },
          ]
        : [],
    ),
    stillUnknown: session.stillUnknown.map((u) => ({
      item: u.item,
      herWords: u.herWords,
      note: 'Ask next time',
    })),
  }
}
