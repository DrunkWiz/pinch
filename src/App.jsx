import { useEffect, useReducer, useState } from 'react'
import { initialSession, sessionReducer } from './lib/session.js'
import StartScreen from './screens/StartScreen.jsx'
import SessionScreen from './screens/SessionScreen.jsx'
import CardScreen from './screens/CardScreen.jsx'
import { clearDraft, loadDraft, saveDraft } from './lib/draft.js'
import Icon from './components/Icon.jsx'

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession)
  const [draft, setDraft] = useState(loadDraft)
  const [draftSaved, setDraftSaved] = useState(true)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [session.screen])
  useEffect(() => {
    if (session.screen === 'session' && !session.demo) {
      setDraftSaved(saveDraft(session))
      setDraft(session)
    }
    if (
      (session.screen === 'card' &&
        session.savedId &&
        !session.fromLibrary &&
        !session.demo) ||
      session.discardDraft
    ) {
      clearDraft()
      setDraft(null)
    }
  }, [session])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header no-print">
        <div className="site-header-inner">
          <div className="wordmark">
            <span className="logo-mark">
              <Icon name="leaf" size={22} />
            </span>
            pinch<span className="wordmark-dot">.</span>
          </div>
          <span className="header-tagline">
            A little of them. Kept forever.
          </span>
          <span className="header-note">
            <Icon name="book" size={17} /> Your family recipe book
          </span>
        </div>
      </header>
      {session.screen === 'start' ? (
        <StartScreen dispatch={dispatch} draft={draft} />
      ) : session.screen === 'card' ? (
        <CardScreen session={session} dispatch={dispatch} />
      ) : (
        <SessionScreen
          session={session}
          dispatch={dispatch}
          draftSaved={draftSaved}
        />
      )}
      <footer className="site-footer no-print">
        <span className="footer-brand">pinch.</span>
        <span>Recipes are more than ingredients.</span>
        <span>
          Made to be passed down <Icon name="heart" size={14} />
        </span>
      </footer>
    </>
  )
}
