# Pinch

**Pinch interviews your grandparent while they cook, so "a pinch", "a splash" and "until it smells right" get pinned down while their hands are still in the pot.**

Most recipe-keeping apps record first and extract afterwards. By the time they notice "a splash" is vague, the cook has left the kitchen. Pinch asks **during** the cooking: after each step it either stays quiet (the step is clear) or asks **one** follow-up, out loud and in big text. At the end you get a printable notebook-style card with her words, her reasons, and an honest **Still unknown** list.

**Pinch never guesses an amount.** Gemini decides *what to ask*. Plain server code ([`server/neverGuess.js`](server/neverGuess.js)) checks every amount, number and quote on the card against what the cook actually said. Anything it can't trace becomes "amount unknown" and goes on the Still unknown list.

## How it works

```
iPhone (Chrome)                    Laptop                         Google
┌──────────────┐  https tunnel  ┌──────────────────┐   API key  ┌──────────┐
│ React app    │ ─────────────→ │ Express server   │ ─────────→ │ Gemini   │
│ records WAV  │ ←───────────── │ never-guess check│ ←───────── │          │
│ speaks Q     │   JSON         │ (holds the key)  │   JSON     └──────────┘
└──────────────┘                └──────────────────┘
```

- The phone records each step as a short WAV clip. It doesn't use browser speech recognition, which isn't available in Chrome on iPhone.
- The server sends the clip to Gemini. Gemini writes down her exact words and decides "clear, or what's the one question?" in one call.
- The question budget (1 per step, 3 per session) is app logic, not the model's choice.
- Nothing is stored. The session lives in the browser tab, and Print is the export.

## Run it

You need Node 22+ and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env      # then put your key in .env
npm run dev               # app on http://localhost:5173, API on :3000
```

Desktop Chrome lets `localhost` use the mic, so the whole flow works on a laptop. To see it as a phone, open DevTools (F12) and turn on the device toolbar (Ctrl+Shift+M), then pick a phone size. Use **Type instead** to try it without speaking.

### On a real phone (optional, not yet tested on iPhone)

A phone browser only allows the mic on an `https://` page. Use a free Cloudflare quick tunnel (`winget install Cloudflare.cloudflared` on Windows, `brew install cloudflared` on macOS):

```bash
npm run build
npm start                                   # app + API on http://localhost:3000
cloudflared tunnel --url http://localhost:3000
```

Open the `https://….trycloudflare.com` link it prints on your phone. The laptop has to stay on and online, and the link changes every time.

### Tests

```bash
npm test
```

Tests cover the two parts where correctness matters: the never-guess check and the question budget.

## Project layout

```
server/   Express API, Gemini calls and prompts, the never-guess check
src/      React app: Start → Session → Card screens, recorder, voice, session logic
devpost/  Planning docs: scope, PRD, technical spec, build checklist
```

## Built with

React + Vite · Node + Express · Gemini (`@google/genai`) · Web Audio · Web Speech synthesis · Vitest

Built for Devpost's *Build With AI: Basics* hackathon using a plan-first workflow. The scope, PRD and spec in [`devpost/`](devpost/) were written before any code.
