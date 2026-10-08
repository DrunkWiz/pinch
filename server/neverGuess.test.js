import { describe, expect, it } from 'vitest'
import { UNKNOWN, checkCard, normalize } from './neverGuess.js'

const session = {
  dish: 'Pancakes',
  cook: 'Betty Cooper',
  steps: [
    { transcript: 'Add flour to the big bowl.' },
    { transcript: 'Crack two eggs in.' },
    {
      transcript: 'Add a splash of milk, not too much.',
      question: 'How much is a splash?',
      answer: { transcript: 'Oh, about two tablespoons.', outcome: 'answered' },
    },
    { transcript: "Mix it gently, don't overmix, or they go tough." },
    { transcript: "Cook them until they're golden." },
  ],
  stillUnknown: [],
}

const draft = (overrides = {}) => ({
  ingredients: [
    { name: 'Flour', amount: '2 cups', herWords: 'Add flour', confirmed: false }, // invented
    { name: 'Eggs', amount: '2', herWords: 'Crack two eggs in', confirmed: false }, // "two" → 2
    { name: 'Milk', amount: 'about two tablespoons', herWords: 'a splash of milk', confirmed: true },
  ],
  method: [
    { text: 'Add flour to a bowl.', herWords: 'Add flour to the big bowl', reason: '' },
    { text: 'Cook for 3 minutes per side.', herWords: "Cook them until they're golden", reason: '' }, // invented 3
    { text: 'Mix gently.', herWords: 'Mix it gently', reason: "don't overmix, or they go tough" },
  ],
  marginNotes: [
    { attachTo: 'method:2', kind: 'her_reason', quote: "don't overmix, or they go tough" },
    { attachTo: 'ingredient:0', kind: 'her_words', quote: 'my mother always sifted it' }, // never said
    { attachTo: 'ingredient:2', kind: 'she_clarified', quote: 'about two tablespoons' },
  ],
  stillUnknown: [{ item: 'Cooking time', herWords: "until they're golden", note: 'not clarified' }],
  ...overrides,
})

describe('never-guess check', () => {
  it('turns an invented amount into "amount unknown" and lists it', () => {
    const card = checkCard(draft(), session)
    expect(card.ingredients[0]).toMatchObject({ name: 'Flour', amount: UNKNOWN, confirmed: false })
    expect(card.stillUnknown.map((u) => u.item)).toContain('Flour amount')
  })

  it('keeps an amount she actually said, including number words vs digits', () => {
    const card = checkCard(draft(), session)
    expect(card.ingredients[1].amount).toBe('2')
    expect(card.ingredients[2]).toMatchObject({ amount: 'about two tablespoons', confirmed: true })
  })

  it('treats a missing amount as unknown', () => {
    const card = checkCard(draft({ ingredients: [{ name: 'Flour', amount: '', herWords: 'Add flour', confirmed: false }] }), session)
    expect(card.ingredients[0].amount).toBe(UNKNOWN)
    expect(card.stillUnknown[0]).toMatchObject({ item: 'Flour amount', herWords: 'Add flour' })
  })

  it('drops a margin quote she never said, keeps real ones', () => {
    const card = checkCard(draft(), session)
    const quotes = card.marginNotes.map((n) => n.quote)
    expect(quotes).not.toContain('my mother always sifted it')
    expect(quotes).toContain("don't overmix, or they go tough")
    expect(quotes).toContain('about two tablespoons')
  })

  it('replaces a method line that invents a number with her own words', () => {
    const card = checkCard(draft(), session)
    expect(card.method[1].text).toBe("Cook them until they're golden")
    expect(card.method[2].reason).toBe("don't overmix, or they go tough")
  })

  it('carries the session’s Still Unknown items onto the card', () => {
    const card = checkCard(draft(), {
      ...session,
      stillUnknown: [{ item: 'Salt amount', herWords: 'a pinch of salt', reason: 'dont_know' }],
    })
    expect(card.stillUnknown).toContainEqual(expect.objectContaining({ item: 'Salt amount', note: 'she didn’t know' }))
    // herWords she never said is blanked rather than shown as a quote
    expect(card.stillUnknown.find((u) => u.item === 'Salt amount').herWords).toBe('')
  })

  it('titles the card from the session, not the model', () => {
    expect(checkCard(draft(), session).title).toBe('Betty Cooper’s Pancakes')
  })

  it('normalizes number words, quotes and punctuation', () => {
    expect(normalize('Two Tablespoons!')).toBe(' 2 tablespoons ')
    expect(normalize('don’t')).toBe(" don't ")
  })
})

describe('Still Unknown tidy-up', () => {
  it('skips a duplicate that only repeats her "I don\'t know" answer, and capitalises names', () => {
    const s = {
      ...session,
      steps: [...session.steps, { transcript: 'Cook until golden', question: 'How golden?', answer: { transcript: "I don't know, I just do it by feel", outcome: 'dont_know' } }],
      stillUnknown: [{ item: 'Cooking cue', herWords: 'until golden', reason: 'dont_know' }],
    }
    const card = checkCard(
      draft({
        ingredients: [{ name: 'salt', amount: 'a pinch', herWords: '', confirmed: false }],
        stillUnknown: [{ item: 'Golden colour', herWords: "I don't know, I just do it by feel", note: 'she didn’t know' }],
      }),
      s,
    )
    expect(card.stillUnknown.map((u) => u.item)).not.toContain('Golden colour')
    expect(card.ingredients[0].name).toBe('Salt')
  })
})
