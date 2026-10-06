import { useEffect, useState } from 'react'

// Her words for the current step. Editable as a backup; a changed transcript
// shows Re-check so Pinch looks at the corrected text.

export default function TranscriptBox({ step, onRecheck }) {
  const [draft, setDraft] = useState(step.transcript)
  useEffect(() => setDraft(step.transcript), [step.id, step.transcript])

  const busy = step.status === 'thinking' || step.status === 'answering'
  const editable = !busy && !['answered', 'offline'].includes(step.status)
  const changed = draft.trim() && draft.trim() !== step.transcript.trim()

  return (
    <div className="transcript">
      <span className="transcript-label">Her words</span>
      <textarea
        value={busy && !draft ? '' : draft}
        placeholder={busy ? '…' : ''}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={!editable}
        aria-label="Transcript of this step"
      />
      {step.answer?.transcript && (
        <p className="answer-line">
          <strong>Her answer:</strong> “{step.answer.transcript}”
        </p>
      )}
      {editable && changed && (
        <button type="button" className="btn" onClick={() => onRecheck(draft.trim())}>
          Re-check
        </button>
      )}
    </div>
  )
}
