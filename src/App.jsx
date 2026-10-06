import { useReducer } from 'react'
import { initialSession, sessionReducer } from './lib/session.js'
import StartScreen from './screens/StartScreen.jsx'
import SessionScreen from './screens/SessionScreen.jsx'
import CardScreen from './screens/CardScreen.jsx'

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession)

  if (session.screen === 'start') return <StartScreen dispatch={dispatch} />
  if (session.screen === 'card') return <CardScreen session={session} dispatch={dispatch} />
  return <SessionScreen session={session} dispatch={dispatch} />
}
