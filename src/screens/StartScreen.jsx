import { useState } from 'react'
import { unlockSpeech } from '../lib/speak.js'

export default function StartScreen({ dispatch }) {
  const [dish, setDish] = useState('')
  const [cook, setCook] = useState('')
  const ready = dish.trim() && cook.trim()

  function start(e) {
    e.preventDefault()
    if (!ready) return
    unlockSpeech() // iPhone needs a tap before it will speak later
    dispatch({ type: 'START', dish, cook })
  }

  return (
    <form className="screen" onSubmit={start}>
      <h1 className="brand">Pinch</h1>
      <p className="tagline">
        Record a family recipe while it’s being cooked. Pinch asks about “a pinch” and “a splash” while the answer is
        still in the pot.
      </p>
      <label className="field">
        Dish
        <input value={dish} onChange={(e) => setDish(e.target.value)} placeholder="Pancakes" autoComplete="off" />
      </label>
      <label className="field">
        Cook
        <input value={cook} onChange={(e) => setCook(e.target.value)} placeholder="Betty Cooper" autoComplete="off" />
      </label>
      <button className="btn btn-primary btn-big" type="submit" disabled={!ready}>
        Start
      </button>
    </form>
  )
}
