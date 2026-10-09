import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_QUESTIONS, currentStep, newStepId } from '../lib/session.js'
import { createRecorder, micSupported } from '../lib/recorder.js'
import { postAnswer, postCard, postStep } from '../lib/api.js'
import { speak, stopSpeaking } from '../lib/speak.js'
import { saveRecipe } from '../lib/library.js'
import QuestionBanner from '../components/QuestionBanner.jsx'
import TranscriptBox from '../components/TranscriptBox.jsx'
import MicButton from '../components/MicButton.jsx'
import Toast from '../components/Toast.jsx'
import RecipeSoFar from '../components/RecipeSoFar.jsx'
import Icon from '../components/Icon.jsx'
import { makeNotesCard } from '../lib/draft.js'
import { demoCard, demoCheck, demoSteps } from '../lib/sample.js'

export default function SessionScreen({ session, dispatch, draftSaved }) {
  const step = currentStep(session)
  const [mode, setMode] = useState(
    session.demo ? 'typed' : micSupported() ? 'voice' : 'typed',
  )
  const [micError, setMicError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [typed, setTyped] = useState(session.inputDraft || '')
  const [voiceOn, setVoiceOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [connected, setConnected] = useState(null)
  const recorder = useRef(null)
  const stopRef = useRef(null)

  const busy =
    step?.status === 'thinking' ||
    step?.status === 'answering' ||
    session.cardStatus === 'building'
  const answering = step?.status === 'asking'
  const resolved =
    step && ['clear', 'answered', 'unknown', 'offline'].includes(step.status)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/health', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info?.aiConfigured === false) {
          setConnected(false)
          setMode('typed')
        } else if (info?.aiConfigured) setConnected(true)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // Read each new question aloud.
  useEffect(() => {
    if (step?.status === 'asking' && voiceOn) speak(step.question)
    else stopSpeaking()
  }, [step?.status, step?.question, voiceOn])
  useEffect(
    () => () => {
      stopSpeaking()
      recorder.current?.stop().catch(() => {})
    },
    [],
  )
  useEffect(() => {
    if (!recording) {
      setSeconds(0)
      return
    }
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])
  useEffect(() => {
    dispatch({ type: 'INPUT_DRAFT', text: typed })
  }, [typed, dispatch])

  const dismissToast = useCallback(
    () => dispatch({ type: 'DISMISS_TOAST' }),
    [dispatch],
  )

  const priorSteps = () =>
    session.steps
      .filter((s) => s.closed && s.transcript)
      .map((s) => s.transcript)

  // ---- sending the cook's words ----

  async function sendStep(speech) {
    const id = newStepId()
    dispatch({ type: 'STEP_SUBMITTED', id, text: speech.text })
    const res = session.demo
      ? demoCheck(speech.text)
      : connected === false
        ? { offline: true }
        : await postStep({
            dish: session.dish,
            cook: session.cook,
            priorSteps: priorSteps(),
            ...speech,
          })
    if (res.offline)
      dispatch({
        type: 'STEP_OFFLINE',
        id,
        text: speech.text ?? '',
        notesMode: connected === false,
      })
    else if (res.empty) dispatch({ type: 'STEP_EMPTY', id })
    else dispatch({ type: 'STEP_CHECKED', id, result: res })
  }

  async function sendAnswer(speech) {
    const id = step.id
    dispatch({ type: 'ANSWER_SUBMITTED', id })
    const res = session.demo
      ? {
          transcript: speech.text,
          outcome: /don.t know/i.test(speech.text)
            ? 'dont_know'
            : /\d|¾|tablespoon|teaspoon/i.test(speech.text)
              ? 'answered'
              : 'still_vague',
          value: speech.text,
        }
      : await postAnswer({
          question: step.question,
          stepTranscript: step.transcript,
          ...speech,
        })
    if (res.offline) dispatch({ type: 'ANSWER_OFFLINE', id, text: speech.text })
    else if (res.empty) dispatch({ type: 'ANSWER_EMPTY', id })
    else dispatch({ type: 'ANSWER_RESULT', id, result: res })
  }

  async function recheck(text) {
    const id = step.id
    dispatch({ type: 'RECHECK_SUBMITTED', id, text })
    const res = session.demo
      ? demoCheck(text)
      : connected === false
        ? { offline: true }
        : await postStep({
            dish: session.dish,
            cook: session.cook,
            priorSteps: priorSteps(),
            text,
          })
    if (res.offline) dispatch({ type: 'STEP_OFFLINE', id, text })
    else
      dispatch({
        type: 'STEP_CHECKED',
        id,
        result: { ...res, transcript: text },
      })
  }

  function send(speech) {
    if (answering) return sendAnswer(speech)
    if (resolved) dispatch({ type: 'NEXT_STEP' }) // the mic doubles as "next step"
    return sendStep(speech)
  }

  // ---- mic ----

  async function startRecording() {
    if (starting || recording || busy) return
    setStarting(true)
    stopSpeaking()
    setMicError(null)
    recorder.current = createRecorder({ onAutoStop: () => stopRef.current?.() })
    try {
      await recorder.current.start()
      setRecording(true)
    } catch (err) {
      await recorder.current?.stop().catch(() => {})
      recorder.current = null
      setMicError(`${err.message} You can type instead.`)
      setMode('typed')
    } finally {
      setStarting(false)
    }
  }

  async function stopRecording() {
    if (!recorder.current) return
    const activeRecorder = recorder.current
    recorder.current = null
    setRecording(false)
    let clip
    try {
      clip = await activeRecorder.stop()
    } catch {
      setMicError(
        'Couldn’t save that recording. Please try again or type the step.',
      )
      return
    }
    if (clip.seconds < 0.4) {
      setMicError(
        'That recording was too short. Try again, or type the words below.',
      )
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
    if (!canFinish) return
    if (session.demo || connected === false) {
      keepNotes()
      return
    }
    dispatch({ type: 'CARD_BUILDING' })
    const res = await postCard({
      dish: session.dish,
      cook: session.cook,
      steps: session.steps
        .filter((s) => s.transcript)
        .map(({ transcript, question, answer, status }) => ({
          transcript,
          question,
          answer,
          status,
        })),
      stillUnknown: session.stillUnknown,
    })
    if (res.offline) dispatch({ type: 'CARD_ERROR' })
    else
      dispatch({
        type: 'CARD_READY',
        card: res,
        savedId: saveRecipe(res)?.id ?? null,
      })
  }

  function keepNotes() {
    const card = session.demo ? demoCard(session) : makeNotesCard(session)
    dispatch({
      type: 'CARD_READY',
      card,
      savedId: session.demo ? null : saveRecipe(card)?.id,
    })
  }

  const micCaption = recording
    ? answering
      ? `Recording answer · ${seconds}s / 90s · Tap to stop`
      : `Recording step · ${seconds}s / 90s · Tap to stop`
    : busy
      ? ''
      : answering
        ? 'Tap to record their answer'
        : resolved
          ? 'Tap to record the next step'
          : 'Tap to record'

  const title = `${session.cook}’s ${session.dish}`
  const canFinish =
    session.steps.some((s) => s.transcript) &&
    !busy &&
    !recording &&
    !starting &&
    !answering &&
    !typed.trim()

  return (
    <main id="main" className="screen kitchen-screen">
      <Toast message={session.toast} onDismiss={dismissToast} />

      <div className="session-toolbar">
        <button
          className="text-button"
          disabled={
            busy || recording || starting || (!draftSaved && !session.demo)
          }
          onClick={() => dispatch({ type: 'RESET' })}
        >
          <Icon name="back" size={17} />
          {session.demo ? 'Leave demo' : 'Save & leave'}
        </button>
        <span className="save-state">
          {session.demo
            ? 'GUIDED DEMO · SAMPLE CONTENT'
            : draftSaved
              ? '✓ Draft saved on this device'
              : 'Draft not saved — browser storage unavailable'}
        </span>
      </div>

      <header className="session-head">
        <div>
          <p className="eyebrow">IN THE KITCHEN</p>
          <h1 className="session-title">{title}</h1>
          <p className="session-subtitle">
            Let them cook. We’ll keep the little things.
          </p>
        </div>
        <span
          className="budget"
          aria-label={`${session.questionsAsked} of ${MAX_QUESTIONS} questions asked`}
        >
          questions
          {Array.from({ length: MAX_QUESTIONS }, (_, i) => (
            <span
              key={i}
              className={`budget-dot${i < session.questionsAsked ? ' used' : ''}`}
            />
          ))}
        </span>
      </header>

      <div className="session-meta">
        <span>
          STEP {session.steps.length + (step ? 0 : 1)}{' '}
          <span className="meta-divider">/</span>{' '}
          {session.steps.filter((s) => s.transcript).length} captured
        </span>
        <button
          className="text-button"
          aria-pressed={voiceOn}
          onClick={() => {
            unlockSpeech()
            setVoiceOn(!voiceOn)
          }}
        >
          Read questions aloud: {voiceOn ? 'On' : 'Off'}
        </button>
      </div>

      {session.demo && (
        <div className="demo-guide">
          <span className="eyebrow">TRY IT WITH BETTY</span>
          <p>
            {answering
              ? 'Pinch spotted a missing detail. Try Betty’s answer, or skip it to keep it unknown.'
              : 'Add a sample step to see how Pinch preserves the recipe.'}
          </p>
          <button
            className="btn btn-small"
            disabled={busy}
            onClick={() =>
              setTyped(
                answering
                  ? /milk/.test(step.question)
                    ? 'About ¾ cup. Just enough so it runs off the spoon.'
                    : 'I don’t know, just a little.'
                  : demoSteps[
                      Math.min(session.steps.length, demoSteps.length - 1)
                    ],
              )
            }
          >
            {answering ? 'Use Betty’s answer' : 'Use a sample step'}{' '}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      {connected === false && !session.demo && (
        <p className="notice">
          You’re in notes mode. AI and voice aren’t connected, but you can
          capture the cook’s exact words and save them. No ingredients or
          amounts will be guessed.
        </p>
      )}
      <QuestionBanner
        step={step}
        hint={session.hint}
        isFirst={session.steps.length === 0}
        typed={mode === 'typed'}
      />

      {answering && (
        <button
          className="text-button skip-question"
          disabled={recording || starting}
          onClick={() => {
            setTyped('')
            dispatch({
              type: 'ANSWER_RESULT',
              id: step.id,
              result: { transcript: '', outcome: 'dont_know', value: null },
            })
          }}
        >
          Not sure? Skip this question <Icon name="arrow" size={16} />
        </button>
      )}

      {step && <TranscriptBox step={step} onRecheck={recheck} />}

      <RecipeSoFar steps={session.steps} />

      {micError && <p className="notice">{micError}</p>}
      {session.cardStatus === 'error' && (
        <p className="notice">
          Couldn’t build the card — nothing is lost. Tap Finish to try again.
        </p>
      )}
      {session.cardStatus === 'building' && (
        <p className="notice dots">Writing the card</p>
      )}

      <div className="mic-zone">
        {mode === 'voice' ? (
          <>
            <MicButton
              recording={recording}
              disabled={busy || starting || Boolean(typed.trim())}
              onClick={recording ? stopRecording : startRecording}
              label={
                recording
                  ? 'Stop recording'
                  : answering
                    ? 'Record their answer'
                    : 'Record a step'
              }
            />
            <span className="mic-caption">
              {starting ? 'Opening the microphone…' : micCaption}
            </span>
            <p className="capture-tip">
              One step at a time. Up to 90 seconds per recording.
            </p>
          </>
        ) : (
          <form className="typed" onSubmit={submitTyped}>
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={
                answering
                  ? 'Their answer, in their own words…'
                  : '“First, I add a cup of flour and crack in two eggs…”'
              }
              aria-label={answering ? 'Their answer' : 'This step'}
              disabled={busy}
              maxLength={6000}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!typed.trim() || busy}
            >
              {answering ? 'Keep this answer' : 'Capture this step'}{' '}
              <Icon name="arrow" size={17} />
            </button>
          </form>
        )}
        {micSupported() &&
          connected !== false &&
          !recording &&
          !starting &&
          !session.demo && (
            <button
              type="button"
              className="link"
              onClick={() => setMode(mode === 'voice' ? 'typed' : 'voice')}
            >
              {mode === 'voice' ? 'Type instead' : 'Use the mic'}
            </button>
          )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn"
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
          disabled={
            !resolved || recording || starting || busy || Boolean(typed.trim())
          }
        >
          Next step
        </button>
        <button
          type="button"
          className="btn btn-ink"
          onClick={finish}
          disabled={!canFinish}
        >
          {session.demo
            ? 'Finish demo recipe'
            : connected === false
              ? 'Save cooking notes'
              : session.cardStatus === 'building'
                ? 'Writing your recipe…'
                : 'Create recipe card'}
        </button>
      </div>
      {session.steps.some((s) => s.transcript) && !session.demo && (
        <button
          className="text-button notes-fallback"
          disabled={!canFinish}
          onClick={keepNotes}
        >
          Save original notes without AI <Icon name="download" size={16} />
        </button>
      )}
      {typed.trim() && (
        <p className="capture-tip">
          Capture your typed words before moving on or finishing.
        </p>
      )}
      {!session.demo &&
        !session.steps.some((s) => s.transcript) &&
        !typed.trim() && (
          <button
            className="text-button"
            disabled={busy || recording || starting}
            onClick={() => dispatch({ type: 'DISCARD_EMPTY' })}
          >
            Cancel empty recipe
          </button>
        )}
    </main>
  )
}
