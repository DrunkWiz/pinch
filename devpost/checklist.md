---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast — learner asked to skip the mid-build pause; the iPhone check moves into the final review

## Slices

- [x] **1. Type a step and Pinch either ticks it or asks one question**
  Becomes usable: On the laptop, you fill in Dish and Cook, tap Start, type a step like "add a splash of milk, not too much", and Pinch shows a big terracotta question ("How much is a splash?"). A clear step gets a tick and Next step instead.
  Why now: This is the kernel, so it goes first, and slice 1 also has to prove the whole path (React app → Express server → Gemini → back) with the real key and model. Typed input comes first because it's the fallback anyway, and it keeps the riskier audio work separate.
  PRD ref: `prd.md > Starting a Session`, `prd.md > Pinch's Check (the kernel)`, `prd.md > Typed Fallback`
  Spec ref: `spec.md > File Structure`, `spec.md > Start Screen`, `spec.md > Session Screen`, `spec.md > Typed Fallback`, `spec.md > Server Routes`, `spec.md > Gemini Calls and Prompts`, `spec.md > Look and Feel`, `spec.md > External Services and Dependencies`
  Build: Scaffold Vite + React + Express per the file structure (package.json scripts `dev`/`build`/`start`/`test`, the Vite `/api` proxy, `.env.example`). Add the design tokens and fonts. Build the Start screen (Start disabled until both fields are filled) and the Session screen in typed mode. Implement `POST /api/step` (text input) with the Gemini client, the step prompt (ask, don't fix; one question) and a JSON response schema. Show the tick + Next step, or the question banner. Confirm the current Flash model name and set the `GEMINI_MODEL` default.
  Verify (mechanical): `npm run dev` starts both servers with no errors. `curl` to `/api/step` with a vague step ("add a splash of milk") returns `clear:false` with a question, and with a clear step ("crack two eggs into the bowl") returns `clear:true`. `npm run build` succeeds.
  Learner check: Run `npm run dev`, open http://localhost:5173, start "Pancakes / Betty Cooper", type a vague step and then a clear one, and say whether Pinch's questions sound like something you'd want asked in a kitchen.
  Commit: `Add typed step check with Gemini`

- [x] **2. Record a step by voice, on your iPhone**
  Becomes usable: Tap the big pulsing mic, say the step, tap again. "Pinch is listening back…", then her exact words appear in the transcript box with the tick or question. Works on the laptop and on the iPhone in Chrome through the tunnel.
  Why now: The biggest unknown in the spec is whether Gemini accepts the iPhone's `audio/mp4` recordings. Finding out now means the rest of the build stands on a voice path that's known to work, or switches to the WAV fallback while it's cheap.
  PRD ref: `prd.md > Recording a Step`, `prd.md > States and Boundaries` (Pinch is thinking, nothing heard, mic blocked)
  Spec ref: `spec.md > Recorder`, `spec.md > API Client`, `spec.md > Server Routes`, `spec.md > Gemini Calls and Prompts`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Decisions and Open Issues` (check 1)
  Build: `recorder.js` (getUserMedia + MediaRecorder, picks a supported mime type). The mic button with pulse animation. Send base64 audio to `/api/step`, with the verbatim-transcription instruction added to the prompt. The "listening back" state, the empty-clip hint, and mic blocked → typed mode. Make `npm start` serve `dist/` + the API on port 3000 for the tunnel.
  Verify (mechanical): Generate a short spoken WAV clip locally and POST it to `/api/step`. Confirm the transcript matches the spoken words and a check result comes back. `npm run build && npm start` serves the app on :3000. Check the server log of the iPhone request for its `mimeType` and a successful Gemini response. Apply the spec's fallback order if it's rejected.
  Learner check: On the laptop, record "add a splash of milk" and see your words and Pinch's question. Then run the tunnel, open the https link in Chrome on your iPhone, allow the mic, and do the same. Tell me if your words came back accurately.
  Commit: `Add voice recording with Gemini transcription`

- [x] **3. A full session: Pinch asks aloud, she answers, and the budget holds**
  Becomes usable: You can run a whole recipe. The question is read aloud. She answers by voice (or "I don't know"), and Pinch moves on. Next step starts the next one. After 3 questions Pinch goes quiet and vague items go to Still Unknown. Editing a transcript gives a Re-check button. If Pinch can't be reached, a toast appears and the session carries on.
  Why now: With the check and voice both proven, this closes the loop the demo depends on, and it locks in the budget and "no follow-up to a follow-up" as plain, tested code before the card relies on that data.
  PRD ref: `prd.md > Answering a Question`, `prd.md > Pinch's Check (the kernel)` (budget, read aloud), `prd.md > Recording a Step` (manual edit re-check), `prd.md > States and Boundaries` (Pinch can't be reached, budget used up)
  Spec ref: `spec.md > App Shell and Session Logic`, `spec.md > Voice Out`, `spec.md > API Client`, `spec.md > Server Routes` (`/api/answer`), `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: The session reducer in `session.js` (steps, `questionsAsked`, `stillUnknown`, phases) with `canAsk()`. `speak.js` with the Start-tap unlock. `POST /api/answer` and its prompt/schema (answered / dont_know / still_vague). Answer flow, Next step, Re-check after an edit (replaces the earlier question, no double count). The 20-second timeout → `offline` toast → step to Still Unknown. Finish appears after the first step (it leads to a placeholder until slice 4).
  Verify (mechanical): `npm test` passes Vitest tests for the budget (a 4th vague step doesn't ask and goes to stillUnknown; a re-check doesn't double count; no follow-up to a follow-up). `curl` to `/api/answer` returns `answered` with value for "about two tablespoons", and `dont_know` for "I don't know". Stopping the server mid-session produces the toast and the step is marked offline.
  Learner check: Run a 4–5 step pancake session out loud on the laptop or iPhone. Hear the question spoken, answer one, say "I don't know" to another, and notice Pinch go quiet after 3 questions. Tell me if the pacing feels like a conversation or a nag.
  Commit: `Add answer loop, spoken questions, and question budget`

- [x] **4. Finish gives the heirloom card, every amount traced to her words, ready to print**
  Becomes usable: Tap Finish to get the notebook card: title in handwriting, Ingredients and Method on the left, her quotes and reasons in blue in the margin, and the Still Unknown box at the bottom. Print shows just the card.
  Why now: The card is the payoff, and the never-guess check is the rule that makes Pinch trustworthy. It needs the real session data from slice 3 to be meaningful.
  PRD ref: `prd.md > Finishing and the Heirloom Card`, `prd.md > Printing`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Heirloom Card`, `spec.md > Never-Guess Check`, `spec.md > Server Routes` (`/api/card`), `spec.md > Data Model` (Card), `spec.md > Look and Feel` (card, print)
  Build: `POST /api/card` with the card prompt and schema. `neverGuess.js` (trace each amount and margin quote to her transcripts/answers; untraceable → `amount unknown` + Still Unknown; unquoted margin text dropped) with Vitest tests. `CardScreen` + `HeirloomCard` styled per Look and Feel. `print.css`. A card error → "Try again" with the session kept.
  Verify (mechanical): `npm test` passes never-guess tests (an invented "2 cups flour" when she only said "add flour" becomes `amount unknown` and is listed in Still Unknown; a confirmed "about two tablespoons" survives; an invented margin quote is dropped). `curl` to `/api/card` with a sample session returns a card that passes the check. `npm run build` succeeds.
  Learner check: Finish a session and look at the card. Is every amount something she actually said, are her reasons in the margin, and is Still Unknown honest? Then press Print and check the preview shows only the card.
  Commit: `Add heirloom card with never-guess check and print`

- [x] **5. Ready to film: states polished, README, and tunnel run-through**
  Becomes usable: The whole journey works on the iPhone through the tunnel, with every PRD state handled (empty start, first-step hint, nothing heard, mic blocked, lost connection, budget used, card retry), and a README tells anyone how to run it.
  Why now: Everything core is in, so this pass closes the gaps between slices and makes the filming setup repeatable.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Important Failure Modes`, `spec.md > Look and Feel`
  Build: Walk every PRD state and fill any gap. Check layout at phone width (tap targets of 56px or more, question size, card stacking). Write the README: what it is, the setup, `npm run dev`, the filming commands with `cloudflared`, and the `.env.example` instructions.
  Verify (mechanical): `npm test` and `npm run build` pass. `npm start` + `cloudflared tunnel --url http://localhost:3000` gives a working https link. Walk through the core journey in a 375px-wide browser and confirm each PRD state appears as described. The README commands run as written from a clean `npm install`.
  Learner check: Follow the README yourself to start the tunnel, then do a full pancake session on your iPhone from Start to Print, as if filming.
  Commit: `Polish states and add README for filming`

- [x] **6. Your recipes: finished cards saved on this device**
  Becomes usable: Every finished card saves automatically. The Start screen lists them to reopen, print or delete.
  Why now: Added in the final review. The learner expected "keep this card" to save it and asked for the library that was deferred in scope.
  PRD ref: `prd.md > Your Recipes (local library)`, `prd.md > States and Boundaries` (persistence)
  Spec ref: `spec.md > Recipe Library`, `spec.md > Data Model`
  Build: `library.js` with wrapped `localStorage`, auto-save on Finish, `RecipeLibrary` on the Start screen, `OPEN_SAVED` reducer action, a saved/unsaved note on the card screen, and two-tap delete.
  Verify (mechanical): `npm test` passes the library tests (save newest-first, delete, corrupt storage, blocked storage). In the browser: make two cards, both listed, reopen one, delete one, and it's still correct after a reload.
  Learner check: Finish a recipe, go back to Start, see it under Your recipes, reopen it, then delete it.
  Commit: `Add local recipe library`

## Hands-on Checkpoints

- [x] Early usable behavior explored — replaced: the learner skipped the mid-build pause (fast, one-shot). Early feedback came through the UI review instead ("looks boring/ugly" → notebook restyle).
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Record WAV in the browser instead of MediaRecorder `audio/mp4` — Gemini's documented formats don't include `audio/mp4`. The spec's own fallback was adopted up front, so the iPhone format unknown is gone before it can fail in the kitchen.
- Slices 1–4 built in one pass — the learner asked for a one-shot build. Each slice's mechanical checks are still run separately, and boxes are ticked only when their checks pass. The Gemini-dependent checks wait for the learner's `.env` key.
- API server port comes from `PINCH_PORT`, not `PORT` — the preview tool sets `PORT` for Vite, so the server took Vite's port and `/api` forwarding broke.
- Small UI additions: the mic also acts as Next step once a step is resolved (fewer taps with messy hands), a "Questions n/3" counter in the header, and a "Start a new recipe" link on the card screen (with a confirm). None of these change the PRD flow.
- Card de-duplication — her reason and "she clarified" showed both inline and in the margin. The margin is now the single place for her voice.
- Warm notebook look across the whole app, plus a "Recipe so far" list and an animated card reveal — the learner found the first UI ugly and chose this from three mockups. It replaces the PRD's plain-session/warm-card split. The PRD and spec are updated.
- Gemini model fallback chain (`gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`), with a 15s cap per attempt — on first real use, `gemini-flash-latest` returned 503 "high demand". Busy or slow models now fall through to the next. The phone's step/answer timeout went from 20s to 30s to leave room for one fallback. The default model is no longer `gemini-flash-latest`.
- Card Still Unknown de-duplication and capitalised ingredient names — real Gemini output repeated an item using her "I don't know" answer as the phrase. The card prompt now gets the existing unknowns, and the never-guess check skips duplicates (with a test).
- Slice 2's iPhone check is deferred to the final review (cloudflared not installed yet). Mechanically verified with Windows TTS WAV clips: the step transcribed verbatim, and the answers classified correctly as answered / don't know.
- Phone simulated in desktop Chrome instead of iPhone + Cloudflare tunnel — the learner chose to test and film in a mobile-sized browser view on the laptop. Slice 5 verified with `npm start` serving the built app and API on one port, plus the 375px walkthrough. **Not verified on a real iPhone:** WAV recording in iPhone Chrome and the spoken question after the Start-tap unlock. Don't claim iPhone testing in the submission. The README keeps the tunnel steps for anyone who wants to try a real phone.
- "Start a new recipe" confirms on the page instead of with `window.confirm` — found in the learner's final review: the browser dialog was silently blocked in an embedded browser, so the button did nothing.
- Local recipe library added (slice 6) — in the final review, the learner pressed "Keep this card" expecting it to save, and asked for the library deferred in scope. Scope, PRD and spec updated. The card buttons now read "Your recipes · start new" (saved) or confirm before leaving (not saved).
- Phone timeouts raised to 50s (step/answer) and 60s (card) — while capturing screenshots, the server got a reply via the third model after 31s, but the phone had already given up at 30s. The client timeout must outlast the server's fallback chain (3 x 15s).
- Transcript box grows to fit her words — long steps were clipped inside a scrolling box (seen while capturing submission screenshots).
- Clearer library buttons — learner feedback: "Your recipes · start new" was confusing, and there was no way to clear the list. A card opened from the library now says "← Back to your recipes", a new card says "Start a new recipe", and "Clear all" (two taps) sits beside the Your recipes heading.
