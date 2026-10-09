---
doc: spec
status: approved
---

# Pinch — Technical Spec

## How This Works, In Plain Language

Pinch has three pieces:

1. **The app on the phone**, built with React and Vite. It shows the three screens: Start, Session and Card. It keeps track of the session (the steps, her answers, how many questions have been asked) in memory while the tab is open. When the mic is on, it **records a short audio clip**. It doesn't try to understand the audio itself.
2. **A small server on your laptop**, built with Node and Express. It holds your Gemini API key, so the key never reaches the phone. The phone sends it the audio clip, and the server sends the clip to Gemini.
3. **Gemini, the AI model,** reached with your free Google AI Studio key. For each clip it does two jobs in one go: it **writes down exactly what she said**, then it decides whether the step is clear or what the single best question is. At the end, it turns all the steps and answers into the card.

Because your iPhone needs a secure `https://` address before it will let a page use the mic, a **Cloudflare quick tunnel** gives your laptop a temporary `https://…trycloudflare.com` link. You open that link in Chrome on the phone.

**Pinch never guesses an amount, and that rule is enforced in code, not just requested.** Gemini decides *what to ask*. Plain code on the server decides what counts as an answer. It checks every amount on the card against her actual words, and anything it can't trace moves to Still Unknown. The question budget (1 per step, 3 per session) is also plain app logic, not left to the AI. Model where judgement is needed, out of the loop where correctness is needed.

Why this shape: it's the smallest setup that works on *your* phone. That's one app, one server and one AI service, with no database, no accounts and no hosting.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Start.** The grandchild types Dish and Cook and taps Start. The app stores both in memory and shows the Session screen. Nothing is sent anywhere yet.
2. **Recording a step.** The grandchild taps the mic. The phone asks for mic permission the first time, then the app starts recording and the mic pulses. They tap again to stop, and the app now has an audio clip.
3. **Pinch listens back.** The app shows "Pinch is listening back…" and sends the clip, plus the session so far, to the server at `POST /api/step`. The server sends it to Gemini, which returns `{ transcript, clear, vagueItems, question }` in a fixed JSON shape.
4. **The app decides, not Gemini.**
   - If `clear`, or there's nothing vague: show the tick and Next step.
   - If something is vague **and** the session has asked fewer than 3 questions: show the question in the banner and read it aloud with the browser's speech synthesis.
   - If something is vague **and** 3 questions have already been asked: show the tick quietly and add the vague items to Still Unknown.
5. **Answering.** She answers into the mic. The clip goes to `POST /api/answer` with the question. Gemini returns `{ transcript, outcome: "answered" | "dont_know" | "still_vague", value }`. Only `answered` attaches her answer to the item. Both `dont_know` and `still_vague` send it to Still Unknown with her words quoted. There's no follow-up to a follow-up.
6. **Manual edit, as a backup.** If the grandchild edits the transcript text and taps **Re-check**, the app sends the *text* (no audio) to `POST /api/step`. The new result replaces the old one, and if a question had been asked, the count doesn't go up again.
7. **Finish.** The app sends every step, answer and Still Unknown item to `POST /api/card`. Gemini returns the card JSON. The server's **never-guess check** runs on it before it goes back to the phone. The app shows the Card screen.
8. **Print.** `window.print()`. A print stylesheet hides everything except the card.

```
iPhone (Chrome)                    Laptop                         Google
┌──────────────┐  https tunnel  ┌──────────────────┐   API key  ┌──────────┐
│ React app    │ ─────────────→ │ Express server   │ ─────────→ │ Gemini   │
│ records clip │ ←───────────── │ never-guess check│ ←───────── │          │
│ speaks Q     │   JSON         │ (holds the key)  │   JSON     └──────────┘
└──────────────┘                └──────────────────┘
```

## Stack

| Piece | Choice | Why | Docs |
|---|---|---|---|
| App | **React 19 + Vite**, plain JavaScript (no TypeScript) | The learner already knows React + Vite. Plain JS keeps setup minimal for a short build. | https://react.dev · https://vite.dev |
| Server | **Node 22 + Express 5** | One small file of routes, and the familiar language. The learner has Node v22.23 installed. | https://expressjs.com |
| AI | **Gemini** via the official **`@google/genai`** SDK, free Google AI Studio key | Learner's choice. It handles audio input and JSON-shaped answers in one call, and costs nothing for testing. | https://ai.google.dev/gemini-api/docs · audio: https://ai.google.dev/gemini-api/docs/generate-content/audio · structured output: https://ai.google.dev/gemini-api/docs/structured-output · models: https://ai.google.dev/gemini-api/docs/models |
| Audio in | Browser **getUserMedia + Web Audio**, encoded to WAV in the browser | Works in Chrome *and* Safari on iPhone, unlike browser speech recognition, which is Safari-only on iOS. WAV is a Gemini-documented format. | https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia |
| Voice out | Browser **speechSynthesis** | Built in and free. Makes the question audible on video. | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis |
| Phone access | **Cloudflare quick tunnel** (`cloudflared`) | Learner's choice over hosting. Gives a free `https://` link with no account. | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/ |
| Tests | **Vitest**, for the never-guess check and budget logic only | These are the two places correctness matters, and plain unit tests prove them. | https://vitest.dev |
| Fonts | Google Fonts: Inter, Lora, Caveat, Patrick Hand | From `prd.md > Look and Feel`. | https://fonts.google.com |

**Model:** a fallback chain in `server/gemini.js`: `gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`, 15s per attempt, moving on when a model is busy (503/429). `GEMINI_MODEL` in `.env` puts a chosen model first. *(Revised in build: `gemini-flash-latest` was overloaded on first use.)* **Unverified:** the current Flash model name and its free-tier limits. Check on the models page at the start of the build. **Fallback:** the learner's paid multi-model key. The model is a single setting in `server/gemini.js`.

## Where It Runs and How Someone Tries It

**Requirements:** Node 22+, a free Gemini key from Google AI Studio, and `cloudflared` (`winget install Cloudflare.cloudflared`).

**Setup, once:**
```bash
npm install
```
Copy `.env.example` to `.env` and put the key in it. Never commit `.env`. It's already in `.gitignore`.

**Building and testing on the laptop:**
```bash
npm run dev
```
This starts Vite on `http://localhost:5173` and the server on port 3000, and Vite forwards `/api` requests to the server. Desktop Chrome lets `localhost` use the mic, so the whole flow can be tested on the laptop.

**On the iPhone (filming):**
```bash
npm run build
npm start
cloudflared tunnel --url http://localhost:3000
```
`npm start` serves the built app *and* the API from one Express server on port 3000 (set by `PINCH_PORT`, not `PORT`). `cloudflared` prints a `https://….trycloudflare.com` link. Open that in Chrome on the iPhone. The laptop must stay on, online and running in the kitchen. The link changes every time it starts.

**Submission:** a demo video (1–3 minutes) of the iPhone session plus the public GitHub repo. No deployment. Reviewers watch the video. The README explains the commands above for anyone who wants to run it.

## Look and Feel
Implements `prd.md > Look and Feel`. No new design decisions.

- **Design tokens** in `src/styles/tokens.css` as CSS variables: `--paper: #FAF6EE`, `--ink: #2B2927`, `--pinch-ink: #2B4C7E`, `--accent: #C25A38`, `--rule: #E6E0D4`, `--margin-line: #E8C4C4`. `body` gets the explicit `--paper` background. Light mode only.
- **Fonts:** one Google Fonts `<link>` in `index.html`. `--font-ui: Inter, system-ui, sans-serif`; `--font-body: Lora, Georgia, serif`; `--font-hand: Caveat, 'Patrick Hand', cursive`. Handwriting fonts are used **only** for the card title and margin notes, never for quantities.
- **Every screen is a notebook page** *(revised in build)*: `--paper` with 32px rule lines and the `--margin-line` left border. On wide screens the page sits on a `--desk` background. Handwriting (Caveat) for titles, Patrick Hand in `--pinch-ink` for her words and captions, Inter for buttons. Buttons have a small offset "pressed card" shadow. **Session screen:** Question banner: `--accent` background, white text, **32–36px bold** Inter (`clamp(32px, 9vw, 36px)`), at the top. Mic: a large circle (at least 120px) in `--accent`, with a CSS pulse animation while recording. Buttons at least 56px tall for messy hands.
- **Card (Heirloom Mode):** centred, `border-radius: 16px`, `box-shadow: 0 8px 24px rgba(0,0,0,0.06)`, a left border in `--margin-line`. Title in Caveat at about 36px with `transform: rotate(-1deg)`. A two-column grid: body about 65% in Lora with `line-height: 1.6`, and a margin of about 35% in `--pinch-ink` handwriting. It stacks to one column on narrow phones, with margin notes under their line. Still Unknown is a framed footer box with a `--rule` border.
- **Print** (`src/styles/print.css`, `@media print`): hide everything but the card, remove the shadow, keep colours (`print-color-adjust: exact`).
- **Copy tone:** calm, short and warm ("Pinch is listening back…", "Tap the mic and describe the first step").

## Components

### App Shell and Session Logic
`src/App.jsx` and `src/lib/session.js`. Holds the session in React state using a reducer and switches between the three screens. **The question budget lives here** as plain code: `canAsk(session)` is true while `questionsAsked < 3`. Each step allows at most one question.
PRD ref: `prd.md > Pinch's Check (the kernel)` (budget), `prd.md > States and Boundaries`.

### Start Screen
`src/screens/StartScreen.jsx`. Dish and Cook inputs. Start stays disabled until both are filled.
PRD ref: `prd.md > Starting a Session`.

### Session Screen
`src/screens/SessionScreen.jsx`, using `QuestionBanner`, `TranscriptBox`, `MicButton`, `Toast`. Shows the hint before the first step, "Pinch is listening back…" while waiting, the tick or question, Next step, and Finish (only after one step exists). The transcript box can be edited, and a **Re-check** button appears once its text has changed.
PRD ref: `prd.md > Recording a Step`, `prd.md > Answering a Question`.

### Recorder
`src/lib/recorder.js`. Wraps `getUserMedia` and the Web Audio API: `start()`, `stop()` → `{ mimeType: 'audio/wav', data, seconds }`. It records raw samples, downsamples to 16 kHz mono and encodes **WAV** in the browser, so every phone sends the same documented Gemini format. *(Revised in build: originally MediaRecorder, whose iPhone output, `audio/mp4`, isn't on Gemini's documented format list.)* Clips auto-stop at 90 seconds. If the mic is blocked or not supported, it raises an error, and the Session screen switches to typed mode.
PRD ref: `prd.md > Recording a Step`, `prd.md > Typed Fallback`.

### Voice Out
`src/lib/speak.js`. `speak(text)` uses `speechSynthesis`. iPhone only allows speech after a tap, so **the Start button tap "unlocks" speech** by speaking an empty utterance. If speech still fails, it fails silently, because the banner text is always shown.
PRD ref: `prd.md > Pinch's Check (the kernel)` (read aloud).

### Typed Fallback
The same Session screen with a text box and Send button instead of the mic, used when the recorder errors, or switched on with a small "Type instead" link. It sends text to the same endpoints.
PRD ref: `prd.md > Typed Fallback`.

### Recipe Library
`src/lib/library.js` (`loadRecipes`, `saveRecipe`, `deleteRecipe`, tested in `library.test.js`) and `src/components/RecipeLibrary.jsx` on the Start screen. Cards are stored as JSON in `localStorage` under `pinch.recipes.v1`, as `[{ id, savedAt, card }]`, newest first. Saved when Finish returns a card; reopened via the reducer's `OPEN_SAVED`. Every storage call is wrapped, so blocked storage means "not saved", never a crash. *(Added in build.)*
PRD ref: `prd.md > Your Recipes (local library)`.

### Heirloom Card
`src/screens/CardScreen.jsx` and `src/components/HeirloomCard.jsx`. Renders the card JSON: title, Ingredients, Method, margin notes beside their lines, and the Still Unknown footer. Includes a Print button.
PRD ref: `prd.md > Finishing and the Heirloom Card`, `prd.md > Printing`.

### API Client
`src/lib/api.js`. `postStep`, `postAnswer`, `postCard`. Audio is sent as base64 in JSON. Each call has a **20-second timeout**. On timeout or a network error, it returns `{ offline: true }`, which the Session screen turns into the lost-connection toast.
PRD ref: `prd.md > States and Boundaries` (Pinch can't be reached).

### Server Routes
`server/index.js`. Express app with a `express.json({ limit: '10mb' })` body limit and three routes, described under **External Services and Dependencies**. In production (`npm start`) it also serves `dist/`. It is stateless: everything it needs comes in each request.

### Gemini Calls and Prompts
`server/gemini.js` and `server/prompts.js`. One `GoogleGenAI` client, and one function per route. Every call uses `responseMimeType: 'application/json'` plus a response schema from `server/schemas.js`, so replies always have a known shape. Prompt rules:
- **Transcribe verbatim.** Keep her exact words, including "a splash", "until it's golden" and filler. Don't tidy or convert.
- **Ask, don't fix.** Something that looks misheard ("a flash of milk") becomes a question ("Did you mean a splash of milk?"), never a silent correction.
- **One question, the most useful one.** Short, friendly and speakable.
- **The card uses only what was said.** No added ingredients, amounts, times or reasons.

### Never-Guess Check
`server/neverGuess.js`, pure functions with Vitest tests. It runs on the card JSON before it is returned. For every ingredient amount and every number in the Method, the amount's text (normalised: lower-case, trimmed) must appear in her step transcripts or answers. If it can't be traced, the amount is replaced with `amount unknown` and the item is added to Still Unknown. Margin quotes must also appear in her transcripts, or they are dropped. **This is what makes "Pinch never guesses an amount" true, rather than hoped for.**
PRD ref: `prd.md > Finishing and the Heirloom Card` (never-guess check).

## Data Model

A session in progress lives **only in React state**, so refreshing loses it. **Finished cards** are also saved to `localStorage` (`pinch.recipes.v1`) on that device (see Recipe Library). The server stores nothing.

```js
session = {
  dish: "Pancakes", cook: "Betty Cooper",
  questionsAsked: 0,                       // budget: max 3
  steps: [{
    id, transcript,                        // her words, verbatim
    status: "clear" | "asked" | "unknown" | "offline",
    question: "How much is a splash?" | null,
    answer: { transcript, outcome, value } | null,
  }],
  stillUnknown: [{ stepId, item, herWords, reason: "dont_know" | "still_vague" | "budget" | "offline" }],
  phase: "start" | "recording" | "thinking" | "asking" | "answering" | "ready" | "card",
  card: null | Card,
}

Card = {
  title,                                    // "Betty Cooper's Pancakes"
  ingredients: [{ name, amount, herWords, confirmed: bool }],  // amount may be "amount unknown"
  method: [{ text, herWords, reason }],
  marginNotes: [{ attachTo: "ingredient:2" | "method:1", text }],
  stillUnknown: [{ item, herWords, note }],
}
```

## File Structure

```
pinch/  (repo root)
├── index.html              # Vite entry; Google Fonts link
├── package.json            # scripts: dev, build, start, test
├── vite.config.js          # React plugin; /api proxy → :3000
├── .env.example            # GEMINI_API_KEY=, GEMINI_MODEL=gemini-flash-latest
├── .gitignore              # already has .env and devpost/learner-profile.md
├── README.md               # what it is, how to run, tunnel steps
├── server/
│   ├── index.js            # Express: /api/step, /api/answer, /api/card; serves dist/ in prod
│   ├── gemini.js           # GoogleGenAI client + one function per route
│   ├── prompts.js          # the three prompts (verbatim, ask-don't-fix, card rules)
│   ├── schemas.js          # JSON response schemas for Gemini
│   ├── neverGuess.js       # the never-guess check (pure functions)
│   └── neverGuess.test.js  # Vitest tests for it
├── src/
│   ├── main.jsx            # React root
│   ├── App.jsx             # screen switching + session reducer wiring
│   ├── lib/
│   │   ├── session.js      # reducer, canAsk() budget rules
│   │   ├── session.test.js # Vitest tests for budget rules
│   │   ├── recorder.js     # MediaRecorder wrapper
│   │   ├── speak.js        # speechSynthesis + iOS unlock
│   │   └── api.js          # fetch calls, base64, 20s timeout
│   ├── screens/
│   │   ├── StartScreen.jsx
│   │   ├── SessionScreen.jsx
│   │   └── CardScreen.jsx
│   ├── components/
│   │   ├── MicButton.jsx
│   │   ├── QuestionBanner.jsx
│   │   ├── TranscriptBox.jsx
│   │   ├── Toast.jsx
│   │   └── HeirloomCard.jsx
│   └── styles/
│       ├── tokens.css      # colours + fonts as CSS variables
│       ├── session.css
│       ├── card.css
│       └── print.css
└── devpost/                # planning docs (scope, prd, spec, checklist)
```

## External Services and Dependencies

### Gemini API (Google AI Studio)
- **Auth:** `GEMINI_API_KEY` in `.env`, read only by the server.
- **SDK call shape:** `ai.models.generateContent({ model, contents, config: { responseMimeType: 'application/json', responseSchema } })`. Audio is passed as `{ inlineData: { mimeType, data: <base64> } }` next to the text prompt. Inline audio is fine under about 20MB total request size. A 30-second clip is well under 1MB.
- **Cost / limits:** the free tier, rate-limited per minute and per day. **Verify the current numbers** at https://ai.google.dev/gemini-api/docs/rate-limits. Free-tier inputs may be used by Google to improve products. The learner accepted this.
- **Audio format:** the app always sends 16 kHz mono WAV (`audio/wav`), one of Gemini's documented formats, so the iPhone `audio/mp4` question no longer applies.

### Our server's three routes

**`POST /api/step`**: check one step.
- Request: `{ dish, cook, priorSteps: [transcript…], audio?: { mimeType, data }, text?: string }`. One of `audio` or `text`.
- Response: `{ transcript, clear: bool, vagueItems: [{ item, herWords, why }], question: string | null }`
- Errors: `502 { error }` if Gemini fails, and the app treats this like offline.

**`POST /api/answer`**: interpret her answer to the question.
- Request: `{ question, stepTranscript, audio?, text? }`
- Response: `{ transcript, outcome: "answered" | "dont_know" | "still_vague", value: string | null }`. `value` is her words for the amount or cue, e.g. "about two tablespoons".

**`POST /api/card`**: assemble the card.
- Request: `{ dish, cook, steps, stillUnknown }` (the session data).
- Response: `Card` (see Data Model), **after** `neverGuess.check()` has run on it.

### Cloudflare quick tunnel
`cloudflared tunnel --url http://localhost:3000`. Free, no account, gives a random `trycloudflare.com` URL. Meant for testing, with no uptime guarantee. Install it with `winget install Cloudflare.cloudflared`.

## Important Failure Modes

- **Gemini slow, down, or over the free limit** → after 20 seconds, the toast "Pinch lost connection — step saved to Still Unknown". The step keeps whatever transcript exists (or the typed text) with status `offline`, and Next step is available immediately. If it happens at **Finish**, show "Couldn't build the card — Try again", and keep the session in memory so nothing is lost.
- **Mic blocked, or the iPhone audio format is rejected** → switch to typed mode with a plain message. The rest of the flow is unchanged.
- **Speech synthesis silent on iPhone** → the question is still in the big banner. Speech is unlocked on the Start tap to make this unlikely.
- **Gemini "helps" by inventing an amount** → the never-guess check replaces it with `amount unknown` and moves it to Still Unknown.
- **Empty clip** (an accidental tap) → an empty transcript returns nothing to check, and the hint "Didn't catch that — tap the mic and try again" shows.

## What Was Simplified and Why

- **Transcription after recording** instead of a live word-by-word transcript. Browser speech recognition isn't available in Chrome on iPhone. The fuller version would need a streaming speech service, such as a WebSocket to a real-time transcription API.
- **Laptop + tunnel** instead of hosting. No account or deploy step. The fuller version would deploy to a host like Vercel, with the server routes as serverless functions.
- **`localStorage` instead of a database.** Finished cards stay on one device. The fuller version would sync to a server with accounts so family members share one cookbook.
- **Plain JavaScript** instead of TypeScript, for less setup in a short build.
- **Tests only for the two correctness-critical pieces** (the never-guess check and the budget). Everything else is checked by trying it on screen.

## Decisions and Open Issues

**Learner decisions (this spec):**
- **Gemini on the free AI Studio key.** Accepted the free-tier limits and Google's data-use terms. The paid multi-model key is the fallback.
- **Gemini transcription (option B)** over Safari's browser speech recognition. Chose reliability on iPhone Chrome, and accepted losing the live word-by-word transcript. `prd.md` was amended to match.
- **Laptop + Cloudflare tunnel** over Vercel. Accepted that the laptop must be running in the kitchen and that the link changes every time.
- **Carried from the brief:** React + Vite, browser speech out, a server-side key, no database.

**Derived implementation details (agent, following those decisions):** Express as the server; one combined transcribe-and-check call per clip; JSON response schemas; the 20-second timeout; budget logic in app code; the never-guess check as server code with tests; plain JS; Vitest.

**Learner's open question, now clarified:** *"How exactly is the voice going to be processed?"* Clarified with the walkthrough above: the phone records a clip → it goes to the laptop server → Gemini writes down her exact words and checks the step in one call → the app shows the tick or question. Researching it showed that the brief's original plan (browser speech recognition) wouldn't work in Chrome on iPhone, and that changed the architecture.

**To check early in the build (blocking the voice path only, not the build):**
1. ~~iPhone `audio/mp4` accepted by Gemini?~~ Resolved in build by recording WAV in the browser on every device.
2. **Current Flash model name and free-tier limits.** Check the models and rate-limits pages, and set `GEMINI_MODEL`.
3. **Speech synthesis on iPhone Chrome after the Start-tap unlock.** Confirm on the device.

**Carried from `prd.md > Open Questions`:** the "Pinch" name check (before the video); the cook and dish for filming. Neither blocks the build.
