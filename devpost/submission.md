# Pinch: submission pack

Everything for the Devpost form, in the order the form asks for it. This is a **draft**: read it through, and rewrite anything that doesn't sound like you. The "What I learned" section especially should be in your own words.

---

## Project title

**Pinch**

**Tagline:** A pinch of this. A lifetime of that. Pinch interviews your grandparent while they cook, so "a pinch" and "a splash" get pinned down while their hands are still in the pot.

---

## Project description

### Problem statement

Family recipes usually live in one person's head, in units like "a pinch", "a splash" and "until it smells right". When that person is gone, the recipe often goes with them.

Lots of apps already try to save these recipes, and they all work the same way: **record first, extract afterwards**. You film or voice-record grandma cooking, and later an AI turns it into a recipe card. By the time the app notices that "a splash of milk" is vague, the cook has left the kitchen and nobody can answer the question. The vague parts stay vague forever.

### Solution overview

Pinch asks **during** the cooking, not afterwards.

The grandchild holds the phone, and the grandparent just cooks and talks. After each step, Pinch either stays quiet because the step is clear, or asks **one** short follow-up question in big text, optionally read aloud: *"About how much milk is a splash?"* The cook answers on the spot, while her hands are still in the bowl.

Pinch follows one rule: **it never guesses an amount.** The AI decides *what to ask*, but it never decides *what the answer is*. Every amount on the final card has to come from the cook's own words. Anything that wasn't pinned down goes on an honest **Still unknown** list to ask about next time. This rule isn't left to the AI. Plain code on the server checks every amount, number and quote on the card against what the cook actually said, and removes anything it can't trace.

### Key features

**In the kitchen**
- **Step-by-step capture by voice or typing.** Pinch writes down the cook's exact words, with a recording timer and the option to edit and re-check a transcript.
- **One question at a time.** Pinch asks at most one follow-up per step and three per session, so it never feels like an interrogation while someone is flipping pancakes.
- **Big, readable questions,** with an optional "read questions aloud" toggle.
- **Catches mishearings.** If the transcript says "a flash of milk", Pinch asks *"Did you mean a splash of milk?"* instead of silently "fixing" it.
- **"I don't know" and "Skip this question" are respected.** The item goes straight to Still unknown, with no arguing and no follow-up to a follow-up.
- **Sessions are never lost.** Drafts save automatically on the device, including unsent typed words, so you can leave, refresh, and resume from the home screen.
- **Keeps working when the AI doesn't.** If one Gemini model is busy, Pinch tries another. If the AI isn't available at all, Pinch switches to *notes mode* and saves the cook's exact words without guessing any ingredients.

**The recipe card**
- **The heirloom card** keeps three things together:
  - a cookable list of ingredients and method
  - her verbatim words and reasons ("don't overmix or they go tough")
  - an honest **Still unknown** box at the bottom
- **Never-guess check:** server-side code traces every amount on the card back to the cook's words. An invented amount becomes "amount unknown".
- **Cook this recipe:** a temporary checklist for cooking along.
- **Print, or download as plain text,** for a copy that lasts.

**The recipe book**
- **Your recipe book:** every finished card saves on the device. Search by name, sort newest-first or A–Z, reopen, and remove (with confirmation).
- **See an example / guided demo:** a clearly labelled sample pancake recipe to try Pinch with no microphone or setup. Sample words are never sent to the AI and never saved into your real recipe book.

### Technologies used

- **Frontend:** React 19 + Vite, plain JavaScript and CSS (a custom recipe-book design system)
- **Backend:** Node.js + Express. It keeps the API key on the server, so it never reaches the browser.
- **AI:** Google Gemini API via the `@google/genai` SDK, with structured JSON output. One call per step transcribes the audio *and* decides "clear, or the one best question". A fallback chain covers busy models (`gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`).
- **Browser APIs:** Web Audio (recording 16 kHz WAV in the browser), Web Speech synthesis (reading questions aloud), localStorage (recipe book and session drafts)
- **Testing:** Vitest. There are 31 unit tests covering the never-guess check, the question budget, recipe storage, draft recovery, offline answers and demo isolation.
- **Process:** built with Claude Code using a plan-first workflow. A scope, product requirements doc and technical spec were written and approved before any code (all in the repo's `devpost/` folder).

### Target users

- **The grandchild (or any family member)** who wants to keep a relative's recipe before it's lost. They hold the phone and do the tapping.
- **The cook,** usually a grandparent, who has never written a recipe down and isn't going to start now. They never have to touch the app. They just cook and talk.
- More broadly, **families who want to preserve cultural and family food traditions** across generations.

### What I learned *(rewrite this in your own words)*

<!-- A starting point based on what happened during the build. Replace it with your own experience. -->

My goal going in was to get better at planning before building. Normally I prompt an AI as I go. This time I wrote a scope, a product requirements doc and a technical spec *before* any code, with the AI interviewing me first.

The planning caught real problems early. Researching how voice would work showed that browser speech recognition doesn't work in Chrome on iPhone, so the architecture changed to recording audio and having Gemini transcribe it. That happened before a line of code existed, not in the kitchen. Other things only showed up when the app met the real world:
- Gemini's free tier was overloaded on the first real request, which led to the model fallback chain.
- The first UI looked plain, which led to two redesigns.
- I realised I wanted a recipe book, which I had cut from scope earlier.

The plan didn't stop those changes, but it gave every change a place to go and a record of why.

---

## Project files (upload these)

From the repo's `screenshots/` folder. Every one comes from a **live session with real Gemini replies**, not the demo, captured at phone size:

1. `01-home.jpg`: the recipe-book home: "A pinch of this. A lifetime of that."
2. `02-pinch-asks.jpg`: the cook said "a splash of milk, not too much", and Pinch asks "About how much milk is a splash?"
3. `03-recipe-card.jpg`: the finished card: flour and milk amounts "clarified by the cook", her answer quoted, and "Butter (amount unknown)"
4. `04-still-unknown.jpg`: the method with her reason ("don't overmix or they go tough") and the Still unknown box: "a knob of butter", because she said "I don't know, I just do it by feel"
5. `05-recipe-book.jpg`: the saved recipe in Your recipe book, with search and sort

Plus your demo video (script below).

---

## Links

- **Repository:** https://github.com/DrunkWiz/pinch
- **Live demo:** https://pinch-htpl.onrender.com (hosted on Render's free plan, so the first visit after a quiet spell can take 30–60 seconds to wake up). "See an example" works with no setup. Live AI questions need the Gemini key set on the server; without it, Pinch runs in notes mode.

---

## Team

Solo: **[your name]**, in every role: product, design, development and testing (built with Claude Code as an AI coding assistant).

---

## Honesty notes: don't claim these

- **Don't say "tested on iPhone"** unless you've opened the live link on your iPhone and tried it. Until then, it has only been tested in a mobile-sized browser view on a laptop.
- **Don't quote transcription accuracy numbers.** They weren't measured.
- **Only claim English.** No other languages were tested.
- **Don't claim cloud sync, accounts or sharing.** Recipes save on one device only.
- **Don't present the guided demo as a real session.** It's labelled sample content. The screenshots above are from a real one.

---

## Demo video script (1–3 minutes)

**Setup:** run `npm run dev`, then open http://localhost:5173 in Chrome. Press F12, then Ctrl+Shift+M, and pick a phone size such as iPhone 14. Record the screen with **Win + Alt + R** (Xbox Game Bar), or with OBS if you want your face or voice too. Turn **"Read questions aloud" on** so the video has Pinch's voice. If a real grandparent can cook on camera, that's the strongest version. Gemini can be slow, so cut out long "Pinch is listening back…" waits when editing.

| Time | Show | Say (roughly) |
|---|---|---|
| 0:00–0:15 | Home: "A pinch of this. A lifetime of that." | "My grandmother never measures anything. It's 'a splash of this', 'cook it till it's golden'. Apps that record her and extract a recipe afterwards keep those vague parts vague, because by then she's left the kitchen." |
| 0:15–0:25 | **Capture a family recipe** → enter the dish and cook → **Let's start cooking** | "Pinch asks while she's still cooking." |
| 0:25–0:45 | Mic: a clear step, like "Crack two eggs into the bowl" → tick | "When a step is clear, Pinch stays quiet." |
| 0:45–1:15 | Mic: "Add a splash of milk, not too much" → the big question, read aloud → answer "About three quarters of a cup" | "When something's vague, it asks one question. Her answer is what goes on the card." |
| 1:15–1:30 | Mic: "Melt a knob of butter…" → answer "I don't know, I do it by feel" | "And 'I don't know' is fine. No arguing. It goes on a Still unknown list." |
| 1:30–2:05 | **Create recipe card** → the card | "Her words and reasons, right on the card. Every amount came from her. Pinch never invents an amount: code on the server checks every number against what she actually said. And here's what we still need to ask next time." |
| 2:05–2:25 | **Cook this recipe** checklist, then **Back to recipe book** | "Cook along with it, print it or download it, and it lives in the family recipe book." |
| 2:25–2:45 | Optional: the `devpost/` docs in the repo | "I built this plan-first. Scope, requirements and a technical spec came before any code, which caught things like iPhone Chrome not supporting speech recognition before I'd written a line." |
