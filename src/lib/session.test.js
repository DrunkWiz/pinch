import { describe, expect, it } from 'vitest'
import { MAX_QUESTIONS, initialSession, sessionReducer } from './session.js'

const vague = (q = 'How much is a splash?') => ({
  transcript: 'add a splash of milk',
  clear: false,
  vagueItems: [{ item: 'Milk amount', herWords: 'a splash of milk', why: 'vague amount' }],
  question: q,
})

const run = (actions, s = sessionReducer(initialSession, { type: 'START', dish: 'Pancakes', cook: 'Betty' })) =>
  actions.reduce(sessionReducer, s)

// Submit a step, check it with `result`, and (optionally) close it.
const stepActions = (id, result, close = true) => [
  { type: 'STEP_SUBMITTED', id },
  { type: 'STEP_CHECKED', id, result },
  ...(close ? [{ type: 'NEXT_STEP' }] : []),
]

describe('question budget', () => {
  it('asks at most 3 questions; the 4th vague step stays quiet and goes to Still Unknown', () => {
    const s = run([
      ...stepActions('a', vague()),
      ...stepActions('b', vague()),
      ...stepActions('c', vague()),
      ...stepActions('d', vague(), false),
    ])
    expect(s.questionsAsked).toBe(MAX_QUESTIONS)
    const d = s.steps.find((st) => st.id === 'd')
    expect(d.status).toBe('clear')
    expect(d.question).toBeNull()
    expect(s.stillUnknown).toContainEqual(expect.objectContaining({ stepId: 'd', item: 'Milk amount', reason: 'budget' }))
  })

  it('a clear step never spends the budget', () => {
    const s = run(stepActions('a', { transcript: 'crack two eggs', clear: true, vagueItems: [], question: null }))
    expect(s.questionsAsked).toBe(0)
    expect(s.steps[0].status).toBe('clear')
  })

  it('a re-check that asks again replaces the question without counting twice', () => {
    const s = run([
      ...stepActions('a', vague(), false),
      { type: 'RECHECK_SUBMITTED', id: 'a', text: 'add a splash of milk, like a cup' },
      { type: 'STEP_CHECKED', id: 'a', result: vague('Did you mean a full cup?') },
    ])
    expect(s.questionsAsked).toBe(1)
    expect(s.steps[0].question).toBe('Did you mean a full cup?')
  })

  it('a re-check is still allowed to re-ask on a counted step even when the budget is used up', () => {
    const s = run([
      ...stepActions('a', vague()),
      ...stepActions('b', vague()),
      ...stepActions('c', vague(), false),
      { type: 'RECHECK_SUBMITTED', id: 'c', text: 'edited' },
      { type: 'STEP_CHECKED', id: 'c', result: vague('Did you mean a splash?') },
    ])
    expect(s.questionsAsked).toBe(3)
    expect(s.steps.at(-1).status).toBe('asking')
  })
})

describe('answers', () => {
  it('an answer resolves the step', () => {
    const s = run([
      ...stepActions('a', vague(), false),
      { type: 'ANSWER_SUBMITTED', id: 'a' },
      { type: 'ANSWER_RESULT', id: 'a', result: { transcript: 'about two tablespoons', outcome: 'answered', value: 'about two tablespoons' } },
    ])
    expect(s.steps[0].status).toBe('answered')
    expect(s.stillUnknown).toHaveLength(0)
  })

  it('"I don\'t know" goes to Still Unknown with no follow-up question', () => {
    const s = run([
      ...stepActions('a', vague(), false),
      { type: 'ANSWER_SUBMITTED', id: 'a' },
      { type: 'ANSWER_RESULT', id: 'a', result: { transcript: "I don't know", outcome: 'dont_know', value: null } },
    ])
    expect(s.steps[0].status).toBe('unknown')
    expect(s.questionsAsked).toBe(1)
    expect(s.stillUnknown).toContainEqual(expect.objectContaining({ item: 'Milk amount', reason: 'dont_know' }))
  })

  it('a still-vague answer is not followed up — no follow-up to a follow-up', () => {
    const s = run([
      ...stepActions('a', vague(), false),
      { type: 'ANSWER_SUBMITTED', id: 'a' },
      { type: 'ANSWER_RESULT', id: 'a', result: { transcript: 'oh just a bit', outcome: 'still_vague', value: null } },
    ])
    expect(s.steps[0].status).toBe('unknown')
    expect(s.steps[0].question).toBe('How much is a splash?')
    expect(s.questionsAsked).toBe(1)
  })
})

describe('lost connection', () => {
  it('marks the step offline, saves it to Still Unknown, and shows the toast', () => {
    const s = run([{ type: 'STEP_SUBMITTED', id: 'a', text: 'add some sugar' }, { type: 'STEP_OFFLINE', id: 'a', text: 'add some sugar' }])
    expect(s.steps[0].status).toBe('offline')
    expect(s.stillUnknown).toContainEqual(expect.objectContaining({ reason: 'offline', herWords: 'add some sugar' }))
    expect(s.toast).toMatch(/lost connection/)
  })
})
