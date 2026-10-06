import { GoogleGenAI } from '@google/genai'
import { STEP_PROMPT, ANSWER_PROMPT, CARD_PROMPT } from './prompts.js'
import { STEP_SCHEMA, ANSWER_SCHEMA, CARD_SCHEMA } from './schemas.js'

// One setting to swap models (or point at the paid key's model later).
export const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

let client
function ai() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing — copy .env.example to .env and add your key')
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return client
}

// Ask Gemini for JSON matching `schema`. `parts` is text and/or inline audio.
async function askJSON(prompt, parts, schema) {
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }, ...parts] }],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      temperature: 0.2,
    },
  })
  return JSON.parse(res.text)
}

// The cook's words come in as audio ({ mimeType, data: base64 }) or typed text.
function speechParts(label, { audio, text }) {
  if (audio) {
    return [{ text: `${label} (audio):` }, { inlineData: { mimeType: audio.mimeType, data: audio.data } }]
  }
  return [{ text: `${label} (typed):\n${text}` }]
}

export async function checkStep({ dish, cook, priorSteps = [], audio, text }) {
  const context = [
    `Dish: ${dish}. Cook: ${cook}.`,
    priorSteps.length
      ? `Earlier steps (already handled):\n${priorSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : 'This is the first step.',
  ].join('\n')
  const out = await askJSON(STEP_PROMPT, [{ text: context }, ...speechParts('The step', { audio, text })], STEP_SCHEMA)

  // Text input is copied unchanged, whatever the model returns.
  const transcript = (text ?? out.transcript ?? '').trim()
  const vagueItems = out.vagueItems ?? []
  const question = (out.question ?? '').trim() || null
  const clear = vagueItems.length === 0 || (out.clear && !question)
  return { transcript, clear, vagueItems: clear ? [] : vagueItems, question: clear ? null : question }
}

export async function interpretAnswer({ question, stepTranscript, audio, text }) {
  const context = `The step: "${stepTranscript}"\nPinch asked: "${question}"`
  const out = await askJSON(ANSWER_PROMPT, [{ text: context }, ...speechParts("The cook's answer", { audio, text })], ANSWER_SCHEMA)

  const transcript = (text ?? out.transcript ?? '').trim()
  let { outcome, value } = out
  if (outcome !== 'answered') value = ''
  // The answer must be her words. If the model rephrased, fall back to her whole answer.
  if (outcome === 'answered' && !norm(transcript).includes(norm(value))) value = transcript
  return { transcript, outcome, value: value || null }
}

export async function draftCard({ dish, cook, steps }) {
  const lines = steps.map((s, i) => {
    let line = `Step ${i + 1}: "${s.transcript}"`
    if (s.question) line += `\n  Pinch asked: "${s.question}"`
    if (s.answer?.transcript) line += `\n  Cook answered: "${s.answer.transcript}" (${s.answer.outcome})`
    return line
  })
  return askJSON(CARD_PROMPT, [{ text: `Dish: ${dish}. Cook: ${cook}.\n\n${lines.join('\n')}` }], CARD_SCHEMA)
}

const norm = (s = '') => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
