---
doc: scope
status: approved
---

# Pinch (working name)

Pinch interviews your grandmother while she cooks, so "a pinch", "a splash" and "until it smells right" get pinned down while her hands are still in the pot.

## The Unique Kernel
**Pinch asks during the cooking, not afterwards.** After each step it asks at most one follow-up, out loud. It asks about a vague amount, a missing time or a "how do you know when", and the cook answers on the spot.

Every similar app (Recipe Diary, and at least five DEV Community projects in early October 2026) works the same way: record first, extract afterwards. By the time those apps notice "a splash" is vague, the cook has left the kitchen. Pinch closes the gap at the source.

The rule that carries it: **Pinch never guesses an amount.** A quantity on the card comes from the cook's own answer, or it goes on the "still unknown" list. The model decides *what to ask*, never *what the answer is*.

## Who It's For
The grandchild who wants to keep a family recipe before it's gone. They hold the phone while their grandparent cooks. The cook has never written anything down, isn't going to start now, and never touches the app. Today the grandchild either tries to remember, scribbles notes, or records a video full of "add a bit of this".

## The Core Loop
Name the dish and the cook ("Betty Cooper's pancakes"). Then, step by step:
1. Tap and record what the cook says she's doing.
2. Pinch either moves on, because the step is clear, or asks **one** follow-up, spoken aloud and shown in large text.
3. Record her answer (or skip / "I don't know", which sends it to the unknown list). Move to the next step.

At the end, Pinch assembles the card. They come back for the next family dish, or to ask about the "still unknown" items next time.

## Inspiration & Identity
- Calm and unobtrusive in the kitchen: big text, one question at a time, never nagging ("nobody wants to be nagged while flipping pancakes").
- **The card should look and feel like a page from a handwritten family notebook.** It should be worth printing and keeping.
- Mirrors this hackathon's own premise: the AI interviews you before anything is built. Pinch is that habit, pointed at a kitchen.

## Why This Matters to the Learner
Family recipes live in one person's head, in units like "a pinch". Recording them afterwards leaves the vague parts vague. The learner wants to catch them while they can still be answered. The project is also practice for their learning goal, planning before building: the AI interviews first, then acts.

## What "Working" Looks Like
A real dish, recorded end to end on a phone, produces a card with **no invented amounts** and a short "still unknown" list.

The "oh, that's cool" beat: she says "add a splash of milk, not too much". Pinch asks out loud *"How much is a splash?"* She answers, and that answer is what lands on the card, next to her original words. Another step is already clear, and Pinch stays quiet.

## The POC Boundary
- Start a session: dish name + cook name.
- Turn-based step recording with speech recognition in the browser, transcribed per step.
- After each step, a server-side model call decides whether the step is clear and, if not, picks the single best follow-up question. The API key stays on the server.
- The follow-up is spoken aloud (browser speech synthesis) and shown in large text.
- Question budget: at most one per step, three per session (tightened in `prd.md`). "Skip" or "I don't know" goes straight to the unknown list.
- The final card: her words verbatim beside what she clarified, the reasons she gave ("don't overmix, or they go tough"), and a "still unknown" list. Styled like a family-notebook page.
- Print: a clean printable card is the export.
- Typed-input fallback with the same flow, for when the mic or browser misbehaves, and for testing without cooking.
- No accounts, no database. Session state lives in memory.

## Later
- **Saved-recipes notebook:** a page of past cards saved on the device. Deferred because it doesn't help prove the kernel, and the demo needs one great dish, not a shelf.
- Heirloom model: a one-off paid printed family cookbook, with relatives abroad added to the family copy.
- One health feature that fits: "adapt Betty's recipe for Dad's diabetes, and show exactly what changed."

## Explicitly Cut
- **Accounts, sharing, public marketplace, creator monetization.** These are a different product (creator-library apps already exist) and add nothing to the kernel.
- **Generic health/nutrition estimates.** These can't be honest when they're built on "a handful".
- **Multiple languages.** Only claim what's actually tested.
- **Real-time streaming voice.** Turn-based is enough, and it's what a short build can make reliable.
