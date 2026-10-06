// The top of the session screen: Pinch's question, the tick, or a quiet hint.

export default function QuestionBanner({ step, hint, isFirst }) {
  if (step?.status === 'thinking' || step?.status === 'answering') {
    return (
      <div className="banner banner-thinking" role="status">
        <span className="dots">Pinch is listening back</span>
      </div>
    )
  }

  if (step?.status === 'asking') {
    return (
      <div className="banner banner-question" role="status" aria-live="assertive">
        <span className="banner-label">Pinch asks</span>
        <p className="q">{step.question}</p>
      </div>
    )
  }

  if (step && ['clear', 'answered'].includes(step.status)) {
    return (
      <div className="banner banner-clear" role="status">
        <span className="tick" aria-hidden="true">✓</span>
        {step.status === 'answered' ? 'Got it — thank you' : 'Clear — got it'}
      </div>
    )
  }

  if (step && ['unknown', 'offline'].includes(step.status)) {
    return (
      <div className="banner banner-quiet" role="status">
        Saved to <strong>&nbsp;Still unknown&nbsp;</strong> — ask about it next time.
      </div>
    )
  }

  return (
    <div className="banner banner-quiet" role="status">
      {hint ?? (isFirst ? 'Tap the mic and describe the first step' : 'Tap the mic and describe the next step')}
    </div>
  )
}
