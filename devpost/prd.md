---
doc: prd
status: approved
---

# Pinch — Product Requirements

Pinch interviews a grandparent while they cook. The grandchild holds the phone. Pinch asks at most one follow-up per step, out loud, then produces a printable notebook-style recipe card where every amount came from the cook.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The grandchild opens Pinch on their phone. They see two text boxes, **Dish** and **Cook**, and a big **Start** button.
2. They type "Pancakes" and "Betty Cooper" and tap **Start**. The session screen opens.
3. The cook starts the first step. The grandchild taps the **big mic button**. The mic pulses while she speaks. *(Amended in `4-spec`: her words appear in the **transcript box** a moment after the mic stops, not word by word, because speech recognition isn't available in Chrome on iPhone.)*
4. They tap the mic again to stop. Pinch checks the step straight away:
   - **The step is clear:** a **tick** appears and a **Next step** button shows. No question, and Pinch stays quiet.
   - **Something is vague, missing, or doesn't make sense** (for example "a splash", or a misheard "a flash of milk"): Pinch shows **one question in big text** and reads it aloud, e.g. *"Did you mean a splash of milk? How much is that?"*
5. When there's a question, the grandchild taps the mic and she answers out loud. Or she says "I don't know", and the item goes to the Still Unknown list with no argument. Then **Next step**.
6. Steps 3–5 repeat for each step of the recipe.
7. At any point the grandchild taps **Finish**. Pinch assembles the **heirloom card**.
8. The card shows the structured recipe, her words and reasons in the margin, and the Still Unknown box. The grandchild taps **Print**.

Success: a real dish, recorded end to end, produces a card with no invented amounts and a short Still Unknown list.

## Screens and Layout

1. **Start screen.** A "Dish" text box, a "Cook" text box and a big Start button.
2. **Session screen (Kitchen Mode).** From top to bottom:
   - **Question banner**, at the top. It shows Pinch's current question, or the tick, when there is one.
   - **Transcript box**, in the centre.
   - **Big mic button**, at the bottom. **Next step** and **Finish** buttons are always within reach.
3. **Card screen (Heirloom Mode).** The finished card and a **Print** button.

Movement is linear: Start → Session → Card. There's no going back to edit a finished session. If it goes wrong, they start a new one.

## Look and Feel
**Warm notebook, everywhere.** *(Amended during build: the learner found the plain session screen too dull and chose a notebook look for the whole app. Kitchen legibility is kept through the big question, big mic and large tap targets.)* Every screen is a page from the family recipe book: lined paper, a pink margin line, handwriting for titles and her words, and a terracotta question card.

- **Colours**
  - `#FAF6EE` soft linen/cream: the background everywhere, on both the session screen and the card.
  - `#2B2927` deep charcoal: main text.
  - `#2B4C7E` fountain-pen blue, "Pinch ink": her quotes, her reasons and Pinch's annotations on the card.
  - `#C25A38` terracotta: the active mic, recording status, and the question banner background (with white text).
  - `#E6E0D4` faint warm grey: rule lines and borders.
  - `#E8C4C4` faint pink-red: the notebook margin line down the card's left edge.
- **Fonts**
  - Session UI: `Inter` or the system sans-serif, chosen for legibility from about a metre away on a counter.
  - Card title and margin notes: `Caveat` / `Patrick Hand` (handwriting).
  - Card body (ingredients and method): `Lora` (serif, cookbook weight).
  - Never use handwriting fonts for paragraphs or quantities.
- **Session screen:** lined notebook page with a handwriting title. The question is **32–36pt bold**, white on a slightly tilted terracotta card. Her words appear in blue handwriting. A **"Recipe so far"** list fills in as steps are captured, with ✓ for settled and ? for still unknown. The mic is a large pulsing terracotta circle, visible from across the counter.
- **Card:** a centred card with 16px rounded corners, a subtle shadow (`0 8px 24px rgba(0,0,0,0.06)`) and the pink margin line on the left. The title is in Caveat at about 36pt, tilted -1°.
- **Avoid:** a generic AI-app look and cold digital white.

## Features and Behavior

### Starting a Session
- [ ] The Start screen shows Dish and Cook boxes and a Start button.
- [ ] Tapping Start opens the session screen, carrying the dish and cook names through to the card title (e.g. "Betty Cooper's Pancakes").

### Recording a Step
Source: `scope.md > The POC Boundary`.
- [ ] Tapping the mic starts recording, and the mic visibly pulses. After the mic stops, her words appear in the transcript box within a few seconds, during the "Pinch is listening back…" state. *(Amended in `4-spec`: not word by word.)*
- [ ] Tapping the mic again stops listening and sends the step to Pinch straight away. There is no confirm tap.
- [ ] The grandchild can still edit the transcript text by hand as a backup. If they edit it before tapping Next step, Pinch re-checks **only the edited text**. If the edit clears up the vagueness, the step gets a tick and Pinch stays quiet. A re-check replaces the earlier question rather than adding one, so it never counts twice against the budget.

### Pinch's Check (the kernel)
Source: `scope.md > The Unique Kernel`.
- [ ] For each step, Pinch either marks it clear (a tick, plus a Next step button) or asks **exactly one** question. Never more than one per step.
- [ ] Pinch asks when a step has a vague amount ("a splash", "a bit"), a missing time or doneness cue ("until it's ready"), or text that doesn't make sense, which is likely a mishearing ("a flash of milk").
- [ ] For a likely mishearing, Pinch **asks** ("Did you mean a splash?"). It never silently corrects it.
- [ ] The question appears in the big banner **and** is read aloud.
- [ ] **Per step:** 0 or 1 question. Pinch never asks a follow-up to a follow-up. If her answer is still vague ("oh, about a splash"), her answer is quoted and the item goes to Still Unknown.
- [ ] **Session budget: 3 questions per recipe.** After 3 questions, Pinch turns off follow-ups for the rest of the session, and any further vague phrases go straight to Still Unknown.

### Answering a Question
- [ ] The grandchild taps the mic, she answers out loud, and her answer appears in the transcript.
- [ ] If she says "I don't know", or something like it, the item goes to Still Unknown and Pinch moves on with no follow-up.
- [ ] Her answer, in her words, is what the card uses for that amount.

### Finishing and the Heirloom Card
Source: `scope.md > What "Working" Looks Like`.
- [ ] Finish is available at any point after at least one step. Tapping it produces the card.
- [ ] **Main body (about 65%, left side):** a structured **Ingredients** list and a numbered **Method**, built by Pinch from all the steps when Finish is tapped.
- [ ] **Ingredients never invent quantities.** An ingredient mentioned with no amount ("add flour"), and not asked about, reads `Flour (amount unknown)` and is listed in Still Unknown. An unclarified vague amount keeps her phrase (`a splash of milk`).
- [ ] **Right margin, "Her voice & reasons":** her verbatim quotes and the reasons she gave ("don't overmix, or they go tough"), in blue handwriting, next to the line they belong to. Clarifications are marked as Pinch-confirmed (e.g. *"a splash" → "about 2 tablespoons", her answer*).
- [ ] **Still Unknown box (footer):** a framed box listing every item Pinch couldn't pin down, with her original phrase (e.g. *Cooking time: "until it's golden", not clarified*).
- [ ] **Never-guess check:** every quantity on the card can be traced to something she said. A vague amount she didn't clarify appears as **her phrase** (e.g. "a splash of milk"), never a converted number, and it's also listed in Still Unknown. Pinch never adds an ingredient, amount, time or reason she didn't say.

### Printing
- [ ] The Print button opens the browser's print dialog. The printout shows only the card (no buttons) and keeps the notebook styling.

### Your Recipes (local library)
*Added during the build at the learner's request (it was deferred in scope).* Source: `scope.md > The POC Boundary`.
- [ ] A finished card is saved automatically to **Your recipes** in this browser. The card screen shows "✓ Saved to Your recipes on this device".
- [ ] The Start screen lists saved cards under **Your recipes**, newest first, with the date and how many items are still unknown.
- [ ] Tapping a saved card reopens it, ready to print.
- [ ] Delete takes two taps (× → "Delete?") so a card isn't lost by accident.
- [ ] Empty library: "Finished cards are saved here on this device."
- [ ] If the browser won't store it (private mode, blocked storage), the card screen says "Not saved — print to keep it", and leaving asks first.

### Typed Fallback
Source: `scope.md > The POC Boundary`.
- [ ] If the mic isn't available or isn't working, the grandchild can type the step (and the answer) instead. Everything else in the flow works the same: Pinch's check, the spoken question, the card.

## States and Boundaries
- **Start screen, empty:** Start is disabled until both Dish and Cook have text.
- **First step, nothing recorded yet:** the transcript box shows a short hint ("Tap the mic and describe the first step"). Finish is not available yet.
- **Pinch is thinking:** after the mic stops, a brief "Pinch is listening back…" indicator shows until the tick or the question appears.
- **Mic blocked or speech not supported in this browser:** a clear message, and the screen switches to typed input.
- **Nothing heard:** if the mic stops and the transcript is empty, nothing is sent. A hint asks them to try again.
- **Pinch can't be reached (network/model error, timeout):** the session never blocks. A brief, non-intrusive message appears at the top ("Pinch lost connection — step saved to Still Unknown"). The raw transcript for that step is kept, its unchecked items go to Still Unknown, and Next step is available immediately. It's treated the same as her saying "I don't know".
- **Question budget used up (3 asked):** no more questions. Steps get a tick, and vague items go to Still Unknown quietly.
- **Persistence:** a session in progress is in memory only, so refreshing loses it. **Finished cards** are saved in this browser on this device. Clearing browser data, or using another browser or device, means they're not there. Print is the durable backup.

## Product Decisions
- **Three linear screens (Start → Session → Card).** Simple enough to use with batter on your hands.
- **Pinch goes straight away when the mic stops, with no confirm tap.** Fewer taps in the kitchen. Mishearings are handled by Pinch *asking* about anything that doesn't make sense, not by making the grandchild proofread. Manual transcript editing stays as a backup.
- **"I don't know" is spoken.** It sends the item to Still Unknown, with no argument.
- **A tick plus Next step when a step is clear.** Pinch staying quiet is part of the demo.
- **A Finish button available any time.** The cook decides when the recipe is done.
- **Warm notebook throughout** (changed during build from a strict split). The plain kitchen screen looked dull. Legibility comes from size and contrast, not plainness.
- **The card keeps a cookable structure (Ingredients and Method) *and* the kernel (her voice and reasons in the margin, plus the Still Unknown box).** Transcripts alone aren't cookable, and structure alone would make Pinch a generic parser.
- **Large question text (32–36pt).** It's the moment a judge has to read on video.
- **Never block on a lost connection.** Cooking doesn't pause for weak Wi-Fi. An unreachable Pinch is treated like "I don't know".
- **Question budget of 3 per recipe (down from scope's "about five").** It keeps the session from feeling like an interrogation, and it still matches the three questions planned for the video.
- **No follow-ups to follow-ups.** One question per step, full stop.
- **Local recipe library added during the build** (reversing the scope deferral). The learner expected "keep this card" to save it, and a library makes the app useful beyond one session. Kept to the device (`localStorage`), with no accounts.

## What We're Building
Start screen; session screen with mic, transcript box, per-step check, a single spoken question in big text, tick / Next step / Finish; "I don't know" handling; question budget; the heirloom card with structured body, margin voice and reasons, and the Still Unknown box; print; typed fallback; the states above.

## Deferred From the POC
- **Syncing or sharing saved recipes** across devices or family members.
- **Dark mode:** light mode only for the build.
- **Editing a finished card, or going back a step:** start a new session instead.
- **An "I don't know" button:** spoken only for now.

## Possible Later Enhancements
- Heirloom printed family cookbook (a one-off purchase), with relatives abroad added to the family copy.
- "Adapt Betty's recipe for Dad's diabetes, and show exactly what changed."
- A follow-up session that works through the Still Unknown list.

## Non-Goals
- **Accounts, sharing, marketplace, monetization:** a different product.
- **Nutrition estimates:** can't be honest when they're built on "a handful".
- **Languages beyond the ones actually tested:** don't claim them.
- **Real-time streaming voice:** turn-based is more reliable.
- **Pinch converting or estimating amounts on its own:** breaks the never-guess rule.

## Open Questions
- Name availability ("Pinch") — can wait until before the video.
- The real cook and dish for the video — can wait.
