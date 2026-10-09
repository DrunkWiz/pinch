const KEY = 'pinch.draft.v1'
export function loadDraft() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (
      !s ||
      !s.dish ||
      !s.cook ||
      !Array.isArray(s.steps) ||
      !Array.isArray(s.stillUnknown)
    )
      return null
    return {
      ...s,
      screen: 'session',
      cardStatus: 'idle',
      toast: null,
      steps: s.steps.map((st) => ({
        ...st,
        status:
          st.status === 'thinking'
            ? 'offline'
            : st.status === 'answering'
              ? 'asking'
              : st.status,
      })),
    }
  } catch {
    return null
  }
}
export function saveDraft(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}
export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Storage may be unavailable. */
  }
}
// Offline keepsakes are verbatim: no inferred ingredients or quantities.
export function makeNotesCard(session) {
  const steps = session.steps.filter((s) => s.transcript)
  return {
    title: `${session.cook}’s ${session.dish}`,
    notesOnly: true,
    ingredients: [],
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
    stillUnknown: [
      {
        item: 'Recipe not checked',
        herWords: '',
        note: 'These are the original cooking notes. Ingredients and quantities have not been reviewed.',
      },
      ...session.stillUnknown.map((u) => ({
        ...u,
        note: u.reason === 'offline' ? 'Not checked' : 'Ask the cook next time',
      })),
    ],
  }
}
export function cardText(card) {
  return [
    card.title,
    '',
    card.notesOnly ? 'ORIGINAL COOKING NOTES' : 'INGREDIENTS',
    ...card.ingredients.map((i) => `• ${i.name} — ${i.amount}`),
    '',
    'METHOD',
    ...card.method.map(
      (m, i) => `${i + 1}. ${m.text}${m.reason ? ` (${m.reason})` : ''}`,
    ),
    '',
    'IN THE COOK’S WORDS',
    ...card.marginNotes.map((n) => `“${n.quote}”`),
    '',
    'STILL UNKNOWN',
    ...card.stillUnknown.map(
      (u) =>
        `• ${u.item}${u.herWords ? `: “${u.herWords}”` : ''}${u.note ? ` — ${u.note}` : ''}`,
    ),
    '',
    'Kept with Pinch. Every recipe has a person behind it.',
  ].join('\n')
}
export function downloadRecipe(card) {
  const url = URL.createObjectURL(
    new Blob([cardText(card)], { type: 'text/plain;charset=utf-8' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `${card.title.replace(/[^\p{L}\p{N} -]/gu, '').slice(0, 90) || 'recipe'}.txt`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
