import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Her words for the current step. Editable as a backup; a changed transcript
// shows Re-check so Pinch looks at the corrected text.

export default function TranscriptBox({ step, onRecheck }) {
  const [draft, setDraft] = useState(step.transcript)
  useEffect(() => setDraft(step.transcript), [step.id, step.transcript])

  // Grow to fit her words, so a long step is never cut off in a scrolling box.
  const box = useRef(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [draft])

  const busy = step.status === 'thinking' || step.status === 'answering'
  const editable = !busy && step.status !== 'answered'
  const changed = draft.trim() && draft.trim() !== step.transcript.trim()

  return (
    <div className="transcript">
      <span className="transcript-label">In their own words</span>
      <textarea
        ref={box}
        rows={2}
        value={busy && !draft ? '' : draft}
        placeholder={busy ? '…' : ''}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={!editable}
        aria-label="Transcript of this step"
      />
      {step.answer?.transcript && (
        <p className="answer-line">
          <strong>
            Their answer
            {step.answer.outcome === 'unverified' ? ' (not checked)' : ''}:
          </strong>{' '}
          “{step.answer.transcript}”
        </p>
      )}
      {editable && changed && (
        <button
          type="button"
          className="btn"
          onClick={() => onRecheck(draft.trim())}
        >
          Re-check
        </button>
      )}
    </div>
  )
}
