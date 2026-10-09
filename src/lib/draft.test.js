import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDraft,
  loadDraft,
  saveDraft,
  makeNotesCard,
  cardText,
} from './draft.js'
import { initialSession, sessionReducer } from './session.js'
import { demoCard } from './sample.js'
describe('recoverable cooking sessions', () => {
  beforeEach(() => {
    const data = new Map()
    globalThis.localStorage = {
      getItem: (k) => data.get(k),
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    }
  })
  it('restores interrupted requests without a stuck loading state', () => {
    saveDraft({
      ...initialSession,
      dish: 'Soup',
      cook: 'Dad',
      cardStatus: 'building',
      inputDraft: 'A little salt',
      steps: [
        { id: 'a', status: 'thinking', transcript: 'Add water' },
        {
          id: 'b',
          status: 'answering',
          transcript: 'Simmer',
          question: 'How long?',
        },
      ],
    })
    const restored = loadDraft()
    expect(restored.cardStatus).toBe('idle')
    expect(restored.steps.map((s) => s.status)).toEqual(['offline', 'asking'])
    expect(restored.inputDraft).toBe('A little salt')
    clearDraft()
    expect(loadDraft()).toBeNull()
  })
  it('keeps offline notes and answers verbatim without fabricating ingredients', () => {
    const card = makeNotesCard({
      dish: 'Soup',
      cook: 'Dad',
      stillUnknown: [],
      steps: [
        {
          transcript: 'Add a handful of beans',
          answer: { transcript: 'My small blue cup' },
        },
      ],
    })
    expect(card.ingredients).toEqual([])
    expect(card.method[0].text).toBe('Add a handful of beans')
    expect(card.marginNotes[0].quote).toBe('My small blue cup')
    expect(card.stillUnknown[0].item).toBe('Recipe not checked')
    expect(cardText(card)).toContain('My small blue cup')
  })
  it('retains an answer when the service fails', () => {
    const s = {
      ...initialSession,
      steps: [
        {
          id: 'x',
          status: 'answering',
          vagueItems: [{ item: 'Milk', herWords: 'a splash' }],
        },
      ],
    }
    const next = sessionReducer(s, {
      type: 'ANSWER_OFFLINE',
      id: 'x',
      text: 'two tablespoons',
    })
    expect(next.steps[0].answer.transcript).toBe('two tablespoons')
    expect(next.steps[0].answer.outcome).toBe('unverified')
  })
  it('keeps skipped questions in the unknown list', () => {
    const s = {
      ...initialSession,
      steps: [
        {
          id: 'x',
          status: 'asking',
          vagueItems: [{ item: 'Milk', herWords: 'a splash' }],
        },
      ],
    }
    const next = sessionReducer(s, { type: 'NEXT_STEP' })
    expect(next.stillUnknown[0].item).toBe('Milk')
    expect(
      sessionReducer(next, { type: 'NEXT_STEP' }).stillUnknown,
    ).toHaveLength(1)
  })
  it('handles corrupt and unavailable storage', () => {
    localStorage.setItem('pinch.draft.v1', '{bad json')
    expect(loadDraft()).toBeNull()
    localStorage.setItem = () => {
      throw new Error('Storage full')
    }
    expect(saveDraft({})).toBe(false)
  })
  it('does not claim that failed audio transcription saved the words', () => {
    const next = sessionReducer(
      {
        ...initialSession,
        steps: [{ id: 'a', transcript: '', status: 'thinking' }],
      },
      { type: 'STEP_OFFLINE', id: 'a', text: '' },
    )
    expect(next.steps).toHaveLength(0)
    expect(next.toast).toContain('wasn’t transcribed')
  })
  it('does not let an empty-recipe cancel discard captured words', () => {
    const s = { ...initialSession, inputDraft: 'Keep these words' }
    expect(sessionReducer(s, { type: 'DISCARD_EMPTY' })).toBe(s)
  })
  it('builds a partial demo card only from steps actually captured', () => {
    const card = demoCard({
      dish: 'Pancakes',
      cook: 'Betty',
      steps: [
        {
          transcript: 'Mix 1 cup of flour with 1 egg. Add a splash of milk.',
          answer: { transcript: 'About ¾ cup.', outcome: 'answered' },
        },
      ],
      stillUnknown: [],
    })
    expect(card.ingredients.map((i) => i.name)).toEqual([
      'Flour',
      'Egg',
      'Milk',
    ])
    expect(card.ingredients[2].amount).toBe('About ¾ cup.')
    expect(card.method).toHaveLength(1)
  })
})
