import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_QUESTIONS, currentStep, newStepId } from '../lib/session.js'
import { createRecorder, micSupported } from '../lib/recorder.js'
import { postAnswer, postCard, postStep } from '../lib/api.js'
import { speak, stopSpeaking } from '../lib/speak.js'
import QuestionBanner from '../components/QuestionBanner.jsx'
import TranscriptBox from '../components/TranscriptBox.jsx'
import MicButton from '../components/MicButton.jsx'
import Toast from '../components/Toast.jsx'

export default function SessionScreen({ session, dispatch }) {
  const step = currentStep(session)
  const [mode, setMode] = useState(micSupported() ? 'voice' : 'typed')
  const [micError, setMicError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [typed, setTyped] = useState('')
  const recorder = useRef(null)
  const stopRef = useRef(null)

  const busy = step?.status === 'thinking' || step?.status === 'answering' || session.cardStatus === 'building'
  const answering = step?.status === 'asking'
  const resolved = step && ['clear', 'answered', 'unknown', 'offline'].includes(step.status)

  // Read each new question aloud.
  useEffect(() => {
    if (step?.status === 'asking') speak(step.question)
  }, [step?.status, step?.question])
  useEffect(() => stopSpeaking, [])

  const dismissToast = useCallback(() => dispatch({ type: 'DISMISS_TOAST' }), [dispatch])

  const priorSteps = () => session.steps.filter((s) => s.closed && s.transcript).map((s) => s.transcript)

  // ---- sending the cook's words ----

  async function sendStep(speech) {
    const id = newStepId()
    dispatch({ type: 'STEP_SUBMITTED', id, text: speech.text })
    const res = await postStep({ dish: session.dish, cook: session.cook, priorSteps: priorSteps(), ...speech })
    if (res.offline) dispatch({ type: 'STEP_OFFLINE', id, text: speech.text ?? '' })
    else if (res.empty) dispatch({ type: 'STEP_EMPTY', id })
    else dispatch({ type: 'STEP_CHECKED', id, result: res })
  }

  async function sendAnswer(speech) {
    const id = step.id
    dispatch({ type: 'ANSWER_SUBMITTED', id })
    const res = await postAnswer({ question: step.question, stepTranscript: step.transcript, ...speech })
    if (res.offline) dispatch({ type: 'ANSWER_OFFLINE', id })
    else if (res.empty) dispatch({ type: 'ANSWER_EMPTY', id })
    else dispatch({ type: 'ANSWER_RESULT', id, result: res })
  }

  async function recheck(text) {
    const id = step.id
    dispatch({ type: 'RECHECK_SUBMITTED', id, text })
    const res = await postStep({ dish: session.dish, cook: session.cook, priorSteps: priorSteps(), text })
    if (res.offline) dispatch({ type: 'STEP_OFFLINE', id, text })
    else dispatch({ type: 'STEP_CHECKED', id, result: { ...res, transcript: text } })
  }

  function send(speech) {
    if (answering) return sendAnswer(speech)
    if (resolved) dispatch({ type: 'NEXT_STEP' }) // the mic doubles as "next step"
    return sendStep(speech)
  }

  // ---- mic ----

  async function startRecording() {
    stopSpeaking()
    setMicError(null)
    recorder.current = createRecorder({ onAutoStop: () => stopRef.current?.() })
    try {
      await recorder.current.start()
      setRecording(true)
    } catch (err) {
      setMicError(`${err.message} You can type instead.`)
      setMode('typed')
    }
  }

  async function stopRecording() {
    setRecording(false)
    const clip = await recorder.current.stop()
    recorder.current = null
    if (clip.seconds < 0.4) {
      dispatch({ type: answering ? 'ANSWER_EMPTY' : 'STEP_EMPTY', id: step?.id })
      return
    }
    send({ audio: { mimeType: clip.mimeType, data: clip.data } })
  }
  stopRef.current = stopRecording

  function submitTyped(e) {
    e.preventDefault()
    const text = typed.trim()
    if (!text || busy) return
    setTyped('')
    send({ text })
  }

  async function finish() {
    if (recording) await stopRecording()
    dispatch({ type: 'CARD_BUILDING' })
    const res = await postCard({
      dish: session.dish,
      cook: session.cook,
      steps: session.steps
        .filter((s) => s.transcript)
        .map(({ transcript, question, answer, status }) => ({ transcript, question, answer, status })),
      stillUnknown: session.stillUnknown,
    })
    if (res.offline) dispatch({ type: 'CARD_ERROR' })
    else dispatch({ type: 'CARD_READY', card: res })
  }

  const micCaption = recording
    ? answering
      ? 'Listening to her answer… tap to stop'
      : 'Listening… tap when she’s done'
    : busy
      ? ''
      : answering
        ? 'Tap to record her answer'
        : resolved
          ? 'Tap to record the next step'
          : 'Tap to record'

  const title = `${session.cook}’s ${session.dish}`
  const canFinish = session.steps.some((s) => s.transcript) && !busy && !recording

  return (
    <main className="screen">
      <Toast message={session.toast} onDismiss={dismissToast} />

      <header className="session-head">
        <strong>{title}</strong>
        <span className="budget">
          Questions {session.questionsAsked}/{MAX_QUESTIONS}
        </span>
      </header>

      <QuestionBanner step={step} hint={session.hint} isFirst={session.steps.length === 0} />

      {step && <TranscriptBox step={step} onRecheck={recheck} />}

      {micError && <p className="notice">{micError}</p>}
      {session.cardStatus === 'error' && (
        <p className="notice">Couldn’t build the card — nothing is lost. Tap Finish to try again.</p>
      )}
      {session.cardStatus === 'building' && <p className="notice dots">Writing the card</p>}

      <div className="mic-zone">
        {mode === 'voice' ? (
          <>
            <MicButton
              recording={recording}
              disabled={busy}
              onClick={recording ? stopRecording : startRecording}
              label={recording ? 'Stop recording' : answering ? 'Record her answer' : 'Record a step'}
            />
            <span className="mic-caption">{micCaption}</span>
          </>
        ) : (
          <form className="typed" onSubmit={submitTyped}>
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={answering ? 'Type her answer (or “I don’t know”)' : 'Type what she’s doing in this step'}
              aria-label={answering ? 'Her answer' : 'This step'}
            />
            <button className="btn btn-primary" type="submit" disabled={!typed.trim() || busy}>
              {answering ? 'Send answer' : 'Send step'}
            </button>
          </form>
        )}
        {micSupported() && !recording && (
          <button type="button" className="link" onClick={() => setMode(mode === 'voice' ? 'typed' : 'voice')}>
            {mode === 'voice' ? 'Type instead' : 'Use the mic'}
          </button>
        )}
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'NEXT_STEP' })} disabled={!resolved || recording}>
          Next step
        </button>
        <button type="button" className="btn btn-primary" onClick={finish} disabled={!canFinish}>
          Finish
        </button>
      </div>
    </main>
  )
}
