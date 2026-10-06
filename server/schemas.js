// JSON shapes Gemini must reply in (passed as responseJsonSchema).
// Fixed shapes mean the server can check replies before the phone sees them.

const str = { type: 'string' }

export const STEP_SCHEMA = {
  type: 'object',
  properties: {
    transcript: str,
    clear: { type: 'boolean' },
    vagueItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: { item: str, herWords: str, why: str },
        required: ['item', 'herWords', 'why'],
      },
    },
    question: str,
  },
  required: ['transcript', 'clear', 'vagueItems', 'question'],
}

export const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    transcript: str,
    outcome: { type: 'string', enum: ['answered', 'dont_know', 'still_vague'] },
    value: str,
  },
  required: ['transcript', 'outcome', 'value'],
}

export const CARD_SCHEMA = {
  type: 'object',
  properties: {
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: str, amount: str, herWords: str, confirmed: { type: 'boolean' } },
        required: ['name', 'amount', 'herWords', 'confirmed'],
      },
    },
    method: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: str, herWords: str, reason: str },
        required: ['text', 'herWords', 'reason'],
      },
    },
    marginNotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          attachTo: str,
          kind: { type: 'string', enum: ['her_words', 'her_reason', 'she_clarified'] },
          quote: str,
        },
        required: ['attachTo', 'kind', 'quote'],
      },
    },
    stillUnknown: {
      type: 'array',
      items: {
        type: 'object',
        properties: { item: str, herWords: str, note: str },
        required: ['item', 'herWords', 'note'],
      },
    },
  },
  required: ['ingredients', 'method', 'marginNotes', 'stillUnknown'],
}
