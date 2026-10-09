// The whole session lives here, in memory on the phone.
// The question budget is plain code, not the AI's call.

export const MAX_QUESTIONS = 3

export const initialSession = {
  screen: 'start', // 'start' | 'session' | 'card'
  dish: '',
  cook: '',
  questionsAsked: 0,
  steps: [],
  stillUnknown: [],
  card: null,
  savedId: null, // set when the card is in Your recipes
  cardStatus: 'idle', // 'idle' | 'building' | 'error'
  toast: null,
  hint: null,
}

export const canAsk = (s) => s.questionsAsked < MAX_QUESTIONS

// A step is "open" until Next step (or Finish) closes it.
export const currentStep = (s) => {
  const last = s.steps.at(-1)
  return last && !last.closed ? last : null
}

let nextId = 1
export const newStepId = () => `step-${nextId++}`

const updateStep = (s, id, fn) => ({ ...s, steps: s.steps.map((st) => (st.id === id ? fn(st) : st)) })
const dropUnknownsFor = (list, stepId) => list.filter((u) => u.stepId !== stepId)
const vagueToUnknown = (stepId, items, reason) =>
  items.map((v) => ({ stepId, item: v.item, herWords: v.herWords, reason }))

export function sessionReducer(s, a) {
  switch (a.type) {
    case 'START':
      return { ...initialSession, screen: 'session', dish: a.dish.trim(), cook: a.cook.trim() }

    case 'STEP_SUBMITTED':
      return {
        ...s,
        hint: null,
        toast: null,
        steps: [...s.steps, { id: a.id, transcript: a.text ?? '', status: 'thinking', question: null, counted: false, answer: null, vagueItems: [], closed: false }],
      }

    case 'STEP_EMPTY':
      return { ...s, steps: s.steps.filter((st) => st.id !== a.id), hint: "Didn't catch that — tap the mic and try again" }

    case 'RECHECK_SUBMITTED':
      // Re-evaluate edited text. Any earlier Still Unknown entries for this step are replaced.
      return {
        ...updateStep(s, a.id, (st) => ({ ...st, transcript: a.text, status: 'thinking' })),
        stillUnknown: dropUnknownsFor(s.stillUnknown, a.id),
        toast: null,
      }

    case 'STEP_CHECKED': {
      const { transcript, clear, vagueItems, question } = a.result
      const step = s.steps.find((st) => st.id === a.id)
      if (!step) return s
      if (clear || !vagueItems.length) {
        return updateStep(s, a.id, (st) => ({ ...st, transcript, status: 'clear', question: null, vagueItems: [] }))
      }
      // A re-check that asks again replaces the earlier question — it doesn't count twice.
      const alreadyCounted = step.counted
      if (question && (alreadyCounted || canAsk(s))) {
        return {
          ...updateStep(s, a.id, (st) => ({ ...st, transcript, status: 'asking', question, vagueItems, counted: true })),
          questionsAsked: alreadyCounted ? s.questionsAsked : s.questionsAsked + 1,
        }
      }
      // Budget used up (or no usable question): stay quiet, send vague items to Still Unknown.
      return {
        ...updateStep(s, a.id, (st) => ({ ...st, transcript, status: 'clear', question: null, vagueItems })),
        stillUnknown: [...s.stillUnknown, ...vagueToUnknown(a.id, vagueItems, question ? 'budget' : 'still_vague')],
      }
    }

    case 'STEP_OFFLINE':
      return {
        ...updateStep(s, a.id, (st) => ({ ...st, transcript: a.text ?? st.transcript, status: 'offline' })),
        stillUnknown: [...dropUnknownsFor(s.stillUnknown, a.id), { stepId: a.id, item: 'Step not checked', herWords: a.text ?? '', reason: 'offline' }],
        toast: 'Pinch lost connection — step saved to Still Unknown',
      }

    case 'ANSWER_SUBMITTED':
      return { ...updateStep(s, a.id, (st) => ({ ...st, status: 'answering' })), toast: null }

    case 'ANSWER_EMPTY':
      return { ...updateStep(s, a.id, (st) => ({ ...st, status: 'asking' })), hint: "Didn't catch that — tap the mic and try again" }

    case 'ANSWER_RESULT': {
      const { transcript, outcome, value } = a.result
      const step = s.steps.find((st) => st.id === a.id)
      if (!step) return s
      const answer = { transcript, outcome, value }
      if (outcome === 'answered') {
        return updateStep(s, a.id, (st) => ({ ...st, status: 'answered', answer }))
      }
      // "I don't know" or still vague: to Still Unknown, no follow-up to a follow-up.
      const reason = outcome === 'dont_know' ? 'dont_know' : 'still_vague'
      return {
        ...updateStep(s, a.id, (st) => ({ ...st, status: 'unknown', answer })),
        stillUnknown: [...s.stillUnknown, ...vagueToUnknown(a.id, step.vagueItems, reason)],
      }
    }

    case 'ANSWER_OFFLINE': {
      const step = s.steps.find((st) => st.id === a.id)
      if (!step) return s
      return {
        ...updateStep(s, a.id, (st) => ({ ...st, status: 'unknown' })),
        stillUnknown: [...s.stillUnknown, ...vagueToUnknown(a.id, step.vagueItems, 'offline')],
        toast: 'Pinch lost connection — step saved to Still Unknown',
      }
    }

    case 'NEXT_STEP':
      return { ...s, steps: s.steps.map((st) => ({ ...st, closed: true })), hint: null, toast: null }

    case 'CARD_BUILDING':
      return { ...s, steps: s.steps.map((st) => ({ ...st, closed: true })), cardStatus: 'building', toast: null }

    case 'CARD_READY':
      return { ...s, screen: 'card', card: a.card, savedId: a.savedId ?? null, cardStatus: 'idle' }

    case 'OPEN_SAVED':
      return { ...initialSession, screen: 'card', card: a.card, savedId: a.savedId }

    case 'CARD_ERROR':
      return { ...s, cardStatus: 'error' }

    case 'DISMISS_TOAST':
      return { ...s, toast: null }

    case 'RESET':
      return initialSession

    default:
      return s
  }
}
