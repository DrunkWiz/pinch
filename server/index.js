import express from 'express'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { MODEL, checkStep, interpretAnswer, draftCard } from './gemini.js'
import { checkCard } from './neverGuess.js'

const app = express()
app.use(express.json({ limit: '10mb' }))

// Small helper: run a handler, log timing, turn Gemini failures into 502s
// (the phone treats those like "Pinch lost connection").
const route = (name, fn) => async (req, res) => {
  const started = Date.now()
  const audio = req.body?.audio
  try {
    const out = await fn(req.body ?? {})
    console.log(`[${name}] ok ${Date.now() - started}ms${audio ? ` audio=${audio.mimeType} ${Math.round(audio.data.length * 0.75 / 1024)}KB` : ' text'}`)
    res.json(out)
  } catch (err) {
    console.error(`[${name}] failed ${Date.now() - started}ms:`, err.message)
    res.status(502).json({ error: err.message })
  }
}

const hasSpeech = (b) => Boolean(b.audio?.data) || Boolean(b.text?.trim())

app.post('/api/step', route('step', async (b) => {
  if (!hasSpeech(b)) return { transcript: '', clear: true, vagueItems: [], question: null, empty: true }
  const out = await checkStep(b)
  return out.transcript ? out : { ...out, empty: true }
}))

app.post('/api/answer', route('answer', async (b) => {
  if (!hasSpeech(b)) return { empty: true }
  const out = await interpretAnswer(b)
  return out.transcript ? out : { empty: true }
}))

app.post('/api/card', route('card', async (b) => {
  const steps = (b.steps ?? []).filter((s) => s.transcript)
  if (!steps.length) throw new Error('No steps to build a card from')
  const draft = await draftCard({ dish: b.dish, cook: b.cook, steps })
  return checkCard(draft, { dish: b.dish, cook: b.cook, steps, stillUnknown: b.stillUnknown })
}))

// In production (`npm start`) serve the built app from the same port as the API,
// so one Cloudflare tunnel covers both.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

// PINCH_PORT, not PORT: tools that launch Vite often set PORT for the web server.
const port = Number(process.env.PINCH_PORT) || 3000
app.listen(port, () => {
  console.log(`Pinch server on http://localhost:${port} (model: ${MODEL})`)
  if (!process.env.GEMINI_API_KEY) console.warn('⚠ GEMINI_API_KEY not set — copy .env.example to .env')
})
