import { useState } from 'react'
import { unlockSpeech } from '../lib/speak.js'
import { deleteRecipe, loadRecipes } from '../lib/library.js'
import RecipeLibrary from '../components/RecipeLibrary.jsx'

export default function StartScreen({ dispatch }) {
  const [dish, setDish] = useState('')
  const [cook, setCook] = useState('')
  const [recipes, setRecipes] = useState(loadRecipes)
  const ready = dish.trim() && cook.trim()

  function start(e) {
    e.preventDefault()
    if (!ready) return
    unlockSpeech() // iPhone needs a tap before it will speak later
    dispatch({ type: 'START', dish, cook })
  }

  return (
    <form className="screen start" onSubmit={start}>
      <div>
        <h1 className="brand">Pinch</h1>
        <svg className="brand-underline" viewBox="0 0 170 14" fill="none" aria-hidden="true">
          <path d="M3 9c30-6 62-7 92-4s50 3 72-2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="tagline">
        Keep a family recipe while it’s being cooked. Pinch asks what “a pinch” and “a splash” mean while the answer
        is still in the pot.
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
        Start cooking
      </button>
      <RecipeLibrary
        recipes={recipes}
        onOpen={(r) => dispatch({ type: 'OPEN_SAVED', card: r.card, savedId: r.id })}
        onDelete={(id) => {
          deleteRecipe(id)
          setRecipes(loadRecipes())
        }}
      />
      <p className="start-note">Hold the phone, let them cook — Pinch does the asking.</p>
    </form>
  )
}
