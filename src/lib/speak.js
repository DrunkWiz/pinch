// Reads Pinch's question aloud with the browser's built-in voice.
// iPhone only allows speech after a tap, so the Start tap "unlocks" it.
// If speech fails, it fails quietly — the question is always on screen too.

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : null)

export function unlockSpeech() {
  try {
    const s = synth()
    if (!s) return
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    s.speak(u)
  } catch {
    /* speech is optional */
  }
}

export function speak(text) {
  try {
    const s = synth()
    if (!s || !text) return
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.lang = 'en-US'
    s.speak(u)
  } catch {
    /* speech is optional */
  }
}

export function stopSpeaking() {
  try {
    synth()?.cancel()
  } catch {
    /* speech is optional */
  }
}
