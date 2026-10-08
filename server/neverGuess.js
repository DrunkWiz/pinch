// The never-guess check. Plain code, no AI.
// Every amount, number and quote on the card must trace back to something the
// cook actually said. Anything that doesn't becomes "amount unknown" (or is
// dropped) and lands on the Still Unknown list.

export const UNKNOWN = 'amount unknown'

const NUMBER_WORDS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8',
  nine: '9', ten: '10', eleven: '11', twelve: '12', fifteen: '15', twenty: '20', thirty: '30',
  half: '1/2', quarter: '1/4', a_dozen: '12',
}

// Lower-case, straighten quotes, spell numbers as digits, drop punctuation.
export function normalize(text = '') {
  return ` ${String(text)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/½/g, ' 1/2 ')
    .replace(/¼/g, ' 1/4 ')
    .replace(/a dozen/g, 'a_dozen')
    .replace(/[^\p{L}\p{N}'/.\s_]+/gu, ' ')
    .replace(/(\p{L})\.(?=\s|$)/gu, '$1')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join(' ')} `
}

const numbersIn = (normText) => normText.match(/\d+(?:[./]\d+)?/g) ?? []

// Build a tracer over everything she said: step transcripts and answers.
export function makeTracer(steps) {
  const said = normalize(
    steps.flatMap((s) => [s.transcript, s.answer?.transcript]).filter(Boolean).join(' \n '),
  )
  const saidNumbers = new Set(numbersIn(said))
  return {
    // Is this phrase (normalized) somewhere in what she said?
    traces: (phrase) => {
      const p = normalize(phrase).trim()
      return p.length > 0 && said.includes(` ${p} `)
    },
    // Does this text contain any number she never said?
    inventsNumber: (text) => numbersIn(normalize(text)).some((n) => !saidNumbers.has(n)),
  }
}

const key = (s = '') => normalize(s).trim()

/**
 * Check a drafted card against the session.
 * @param {object} draft  card from Gemini: { ingredients, method, marginNotes, stillUnknown }
 * @param {object} session { dish, cook, steps: [{ transcript, question?, answer? }], stillUnknown? }
 * @returns {object} the card, with every untraceable claim removed
 */
export function checkCard(draft, session) {
  const { traces, inventsNumber } = makeTracer(session.steps ?? [])
  const stillUnknown = []
  const answers = new Set((session.steps ?? []).map((s) => key(s.answer?.transcript)).filter(Boolean))
  const addUnknown = (item, herWords, note) => {
    if (stillUnknown.some((u) => key(u.item) === key(item))) return
    // Same phrase already listed, or the "phrase" is only her answer to Pinch: skip the duplicate.
    if (herWords && (answers.has(key(herWords)) || stillUnknown.some((u) => u.herWords && key(u.herWords) === key(herWords)))) return
    stillUnknown.push({ item, herWords: herWords && traces(herWords) ? herWords : '', note })
  }

  const capitalise = (s = '') => s.charAt(0).toUpperCase() + s.slice(1)
  const ingredients = (draft.ingredients ?? []).map((raw) => {
    const ing = { ...raw, name: capitalise(String(raw.name ?? '').trim()) }
    const herWords = ing.herWords && traces(ing.herWords) ? ing.herWords : ''
    const amount = (ing.amount ?? '').trim()
    if (amount && traces(amount)) return { name: ing.name, amount, herWords, confirmed: Boolean(ing.confirmed) }
    addUnknown(`${ing.name} amount`, herWords, amount ? 'Pinch couldn’t find this amount in her words' : 'no amount given')
    return { name: ing.name, amount: UNKNOWN, herWords, confirmed: false }
  })

  const method = (draft.method ?? []).map((m) => {
    const herWords = m.herWords && traces(m.herWords) ? m.herWords : ''
    const reason = m.reason && traces(m.reason) ? m.reason : ''
    // A tidied instruction may not add numbers she never said; fall back to her own words.
    const text = inventsNumber(m.text) ? herWords || m.text.replace(/\d+(?:[./]\d+)?/g, '…') : m.text
    return { text, herWords, reason }
  })

  const validTarget = (t) => {
    const [kind, idx] = String(t).split(':')
    const list = kind === 'ingredient' ? ingredients : kind === 'method' ? method : null
    return list && Number.isInteger(Number(idx)) && Number(idx) >= 0 && Number(idx) < list.length
  }
  const marginNotes = (draft.marginNotes ?? []).filter((n) => n.quote && traces(n.quote) && validTarget(n.attachTo))

  // Items the session already sent to Still Unknown (I don't know, budget, lost connection).
  const reasonNote = { dont_know: 'she didn’t know', still_vague: 'not clarified', budget: 'not asked — question limit reached', offline: 'Pinch lost connection' }
  for (const u of session.stillUnknown ?? []) addUnknown(u.item, u.herWords, reasonNote[u.reason] ?? 'not clarified')
  for (const u of draft.stillUnknown ?? []) addUnknown(u.item, u.herWords, u.note || 'not clarified')

  return {
    title: `${session.cook}’s ${session.dish}`,
    ingredients,
    method,
    marginNotes,
    stillUnknown,
  }
}
