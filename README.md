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
- Draft sessions (including unsent typed words) and finished recipes are saved in this browser on this device. Print and plain-text download provide portable copies.

## The recipe book experience

- Responsive recipe-book home with an illustrated example, onboarding, and a clearly labelled interactive demo. The demo runs locally and never sends sample words to the AI service or saves practice cards in the real collection.
- Search saved recipes by title, sort newest-first or A–Z, reopen them, and confirm individual removals.
- Cooking sessions automatically save to local storage. Resume from the home screen after leaving or refreshing; interrupted requests recover without a stuck loading indicator.
- Skip a question explicitly, choose whether questions are read aloud, edit and re-check transcripts, and see a recording timer. Finishing is disabled while a question, recording, request, or unsent text remains.
- Missing AI configuration is shown as notes mode: capture and save exact words without inferred ingredients. If the service fails during a normal session, original notes can still be saved. Untranscribed audio is clearly reported as unsaved; typed answers are retained on failure.
- Recipe cards preserve original quotes and unknown details, support a temporary cook-along checklist, and offer print and text download.
- There are no accounts or cross-device sync. Clearing this browser’s data removes its recipes. Audio/text for live AI sessions is sent to Google Gemini; the API key stays on the server.

`GET /api/health` reports whether a Gemini key is configured (it does not claim the upstream service is reachable). The sample and notes mode work without a key. Configure `.env` to enable real voice transcription and AI follow-ups.

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

Tests cover the never-guess check, question budget, library storage, draft recovery, preservation of offline answers, and sample isolation. Browser checks cover the sample/checklist, question-answer and skip flows, phone layout, refresh/resume with unsent words, saving notes, and recipe search.

## Project layout

```
server/   Express API, Gemini calls and prompts, the never-guess check
src/      React app: Start → Session → Card screens, recorder, voice, session logic
devpost/  Planning docs: scope, PRD, technical spec, build checklist
```

## Built with

React + Vite · Node + Express · Gemini (`@google/genai`) · Web Audio · Web Speech synthesis · Vitest

Built for Devpost's *Build With AI: Basics* hackathon using a plan-first workflow. The scope, PRD and spec in [`devpost/`](devpost/) were written before any code.
