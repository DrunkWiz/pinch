# Pinch: submission pack

Everything for the Devpost form, in the order the form asks for it. This is a **draft**: read it through, and rewrite anything that doesn't sound like you. The "What I learned" section especially should be in your own words.

---

## Project title

**Pinch**

**Tagline:** Pinch interviews your grandparent while they cook, so "a pinch" and "a splash" get pinned down while their hands are still in the pot.

---

## Project description

### Problem statement

Family recipes usually live in one person's head, in units like "a pinch", "a splash" and "until it smells right". When that person is gone, the recipe often goes with them.

Lots of apps already try to save these recipes, and they all work the same way: **record first, extract afterwards**. You film or voice-record grandma cooking, and later an AI turns it into a recipe card. By the time the app notices that "a splash of milk" is vague, the cook has left the kitchen and nobody can answer the question. The vague parts stay vague forever.

### Solution overview

Pinch asks **during** the cooking, not afterwards.

The grandchild holds the phone, and the grandparent just cooks and talks. After each step, Pinch either stays quiet because the step is clear, or asks **one** short follow-up question, out loud and in big text: *"About how much milk should we add?"* The cook answers on the spot, while her hands are still in the bowl.

Pinch follows one rule: **it never guesses an amount.** The AI decides *what to ask*, but it never decides *what the answer is*. Every amount on the final card has to come from the cook's own words. Anything that wasn't pinned down goes on an honest **Still unknown** list to ask about next time. This rule isn't left to the AI. Plain code on the server checks every amount, number and quote on the card against what the cook actually said, and removes anything it can't trace.

### Key features

- **Step-by-step voice capture.** Tap the mic, the cook describes the step, and Pinch writes down her exact words.
- **One question at a time.** Pinch asks at most one follow-up per step and three per session, so it never feels like an interrogation while someone is flipping pancakes.
- **Spoken questions in big text.** You can hear and read them from across the kitchen.
- **Catches mishearings.** If the transcript says "a flash of milk", Pinch asks *"Did you mean a splash of milk?"* instead of silently "fixing" it.
- **"I don't know" is respected.** It goes straight to Still unknown, with no arguing and no follow-up to a follow-up.
- **The heirloom recipe card** looks like a page from a family notebook:
  - a cookable list of ingredients and method
  - her verbatim words and reasons ("don't overmix or they go tough") in blue handwriting in the margin
  - the Still unknown box at the bottom
- **Never-guess check:** server-side code traces every amount on the card back to the cook's words. An invented amount becomes "amount unknown".
- **Print** gives a clean printable card.
- **Your recipes:** finished cards are saved on the device to reopen, print again or delete.
- **Typed fallback** for when the mic isn't available, and it's useful for testing.
- **Keeps working when the AI is busy.** If one Gemini model is overloaded, Pinch tries another. If Pinch can't be reached at all, the step is saved to Still unknown and the session carries on.

### Technologies used

- **Frontend:** React 19 + Vite, plain JavaScript and CSS (notebook design: Caveat, Patrick Hand, Lora and Inter fonts from Google Fonts)
- **Backend:** Node.js + Express. It keeps the API key on the server, so it never reaches the phone.
- **AI:** Google Gemini API via the `@google/genai` SDK, with structured JSON output. One call per step transcribes the audio *and* decides "clear, or the one best question". A fallback chain covers busy models (`gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`).
- **Browser APIs:** Web Audio (recording 16 kHz WAV in the browser), Web Speech synthesis (reading questions aloud), localStorage (saved recipes)
- **Testing:** Vitest. There are 22 unit tests on the parts where correctness matters: the never-guess check, the question budget and the recipe library.
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
- The first UI looked plain, which led to the notebook redesign.
- I realised I wanted a recipe library, which I had cut from scope earlier.

The plan didn't stop those changes, but it gave every change a place to go and a record of why.

---

## Project files (upload these)

From the repo's `screenshots/` folder, all captured from a real session with real Gemini replies at phone size:

1. `01-start-and-your-recipes.jpg`: the start screen, with a saved recipe in Your recipes
2. `02-pinch-asks.jpg`: Pinch asking "About how much milk should we add?" after the cook said "a splash of milk, not too much"
3. `03-recipe-card.jpg`: the finished heirloom card: her words and reasons in the margin, and "Flour (amount unknown)" in Still unknown because no amount was ever confirmed

Plus your demo video (script below).

---

## Links

- **Repository:** https://github.com/DrunkWiz/pinch
- **Live demo:** none. Pinch runs locally (`npm run dev`); see the README. Optionally say: "Runs locally; see the demo video and README to run it."

---

## Team

Solo: **[your name]**, in every role: product, design, development and testing (built with Claude Code as an AI coding assistant).

---

## Honesty notes: don't claim these

- **Don't say "tested on iPhone".** It was tested in a mobile-sized browser view on a laptop. Real-phone use needs the HTTPS tunnel in the README, and that hasn't been tried.
- **Don't quote transcription accuracy numbers.** They weren't measured.
- **Only claim English.** No other languages were tested.
- **Don't claim cloud sync or sharing.** Recipes save on one device only.

---

## Demo video script (1–3 minutes)

**Setup:** run `npm run dev`, then open http://localhost:5173 in Chrome. Press F12, then Ctrl+Shift+M, and pick a phone size such as iPhone 14. Record the screen with **Win + Alt + R** (Xbox Game Bar), or with OBS if you want your face or voice too. Use your real mic, and if a real grandparent can cook on camera, that's the strongest version. Gemini can be slow, so cut out long "Pinch is listening back…" waits when editing.

| Time | Show | Say (roughly) |
|---|---|---|
| 0:00–0:15 | Start screen | "My grandmother never measures anything. It's 'a splash of this', 'cook it till it's ready'. Apps that record her and extract a recipe afterwards keep those vague parts vague, because by then she's left the kitchen." |
| 0:15–0:25 | Type the dish and cook, tap **Start cooking** | "Pinch asks while she's still cooking." |
| 0:25–0:45 | Mic: say a clear step, like "Crack two eggs into the bowl" → tick | "When a step is clear, Pinch stays quiet." |
| 0:45–1:15 | Mic: "Add a splash of milk, not too much" → the big question → answer "About two tablespoons" | "When something's vague, it asks one question, out loud. Her answer is what goes on the card." |
| 1:15–1:30 | Mic: a step with a vague cue → answer "I don't know, I do it by feel" | "And 'I don't know' is fine. No arguing. It goes on a Still unknown list." |
| 1:30–2:05 | Tap **Finish** → the card writes itself in | "Her words and reasons in the margin. Every amount came from her. Pinch never invents an amount: code on the server checks every number against what she actually said. And here's what we still need to ask next time." |
| 2:05–2:20 | Print preview, then back to **Your recipes** | "Print it, and it's saved in Your recipes." |
| 2:20–2:45 | Optional: show the `devpost/` docs in the repo | "I built this plan-first. Scope, requirements and a technical spec came before any code, which caught things like iPhone Chrome not supporting speech recognition before I'd written a line." |
