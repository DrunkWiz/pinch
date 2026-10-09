import { useEffect, useRef, useState } from 'react'
import { unlockSpeech } from '../lib/speak.js'
import { deleteRecipe, loadRecipes } from '../lib/library.js'
import { sampleCard } from '../lib/sample.js'
import RecipeLibrary from '../components/RecipeLibrary.jsx'
import Icon from '../components/Icon.jsx'

export default function StartScreen({ dispatch, draft }) {
  const [dish, setDish] = useState('')
  const [cook, setCook] = useState('')
  const [recipes, setRecipes] = useState(loadRecipes)
  const [error, setError] = useState('')
  const dialog = useRef(null)
  const how = useRef(null)
  const [status, setStatus] = useState(null)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/health', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
    return () => ctrl.abort()
  }, [])
  const openSample = () =>
    dispatch({ type: 'OPEN_SAVED', card: sampleCard, sample: true })
  function start(e) {
    e.preventDefault()
    if (!dish.trim() || !cook.trim()) return
    unlockSpeech()
    dispatch({ type: 'START', dish, cook })
  }
  return (
    <main id="main" className="home page-width">
      <nav className="home-nav" aria-label="Recipe book">
        <a href="#collection" className="nav-active">
          <Icon name="book" size={17} /> My recipe book{' '}
          <span>{recipes.length}</span>
        </a>
        <button
          className="text-button"
          onClick={() => how.current.scrollIntoView({ behavior: 'smooth' })}
        >
          How Pinch works <Icon name="arrow" size={16} />
        </button>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> FOR THE RECIPES THAT LIVE IN SOMEONE’S HEAD
          </p>
          <h1>
            A pinch of this.
            <br />A lifetime of <em>that.</em>
          </h1>
          <p className="hero-description">
            Their best recipes were never written down.
            <br className="desktop-break" /> Cook together. Capture the little
            details.
            <br className="desktop-break" /> Keep a piece of them, forever.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => dialog.current.showModal()}
            >
              <Icon name="plus" /> Capture a family recipe
            </button>
            <button className="btn btn-text" onClick={openSample}>
              See an example <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="hero-promise">
            <Icon name="check" size={16} /> Their words. Their wisdom. Never
            guessed.
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="An example of a cherished family recipe"
        >
          <span className="art-caption">
            A recipe. And a little of the person.
          </span>
          <div className="back-recipe" aria-hidden="true">
            <span>FROM THE FAMILY KITCHEN</span>
          </div>
          <button
            className="preview-recipe"
            onClick={openSample}
            aria-label="Open Betty’s Sunday pancakes example"
          >
            <span className="recipe-tape" />
            <span className="preview-top">
              <span>THE FAMILY RECIPE BOOK</span>
              <Icon name="heart" size={19} />
            </span>
            <span className="preview-title">
              Sunday
              <br />
              pancakes
            </span>
            <span className="preview-by">the way Betty makes them</span>
            <div className="pancake-art" aria-hidden="true">
              <div className="plate">
                <i />
                <i />
                <i />
                <span className="butter" />
                <span className="berry b1" />
                <span className="berry b2" />
                <span className="berry b3" />
                <span className="mint" />
              </div>
              <span className="sketch-line" />
            </div>
            <span className="preview-quote">
              “The first one is always
              <br />
              for the cook.”
            </span>
            <span className="preview-bottom">
              <span>WRITTEN WITH LOVE, KEPT WITH PINCH</span>
              <Icon name="arrow" size={16} />
            </span>
          </button>
          <div className="clarification-note">
            <span>
              <Icon name="mic" size={15} /> THE LITTLE DETAILS MATTER
            </span>
            <p>“How much is a splash?”</p>
            <small>
              “About ¾ cup, love.” <Icon name="check" size={14} />
            </small>
          </div>
        </div>
      </section>
      <section className="how-strip" ref={how} aria-label="How Pinch works">
        {[
          [
            '01',
            'mic',
            'Cook. Talk. Be together.',
            'Record each step, or type as you go.',
          ],
          [
            '02',
            'leaf',
            'We catch the little things.',
            'One gentle question when a detail is missing.',
          ],
          [
            '03',
            'book',
            'Keep more than a recipe.',
            'A keepsake with their words and their why.',
          ],
        ].map(([n, icon, title, detail]) => (
          <div className="how-item" key={n}>
            <span className="how-icon">
              <Icon name={icon} />
            </span>
            <div>
              <span className="how-number">{n}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </section>
      {draft && (
        <section className="resume-card">
          <span className="how-icon">
            <Icon name="clock" />
          </span>
          <div>
            <p className="eyebrow">WAITING FOR YOU</p>
            <h3>
              {draft.cook}’s {draft.dish}
            </h3>
            <p>
              {draft.steps.filter((s) => s.transcript).length} steps captured ·
              Pick up where you left off
            </p>
          </div>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'RESUME', session: draft })}
          >
            Resume recipe <Icon name="arrow" size={17} />
          </button>
        </section>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <RecipeLibrary
        recipes={recipes}
        onOpen={(r) =>
          dispatch({ type: 'OPEN_SAVED', card: r.card, savedId: r.id })
        }
        onCreate={() => dialog.current.showModal()}
        onSample={openSample}
        onDelete={(id) => {
          if (!deleteRecipe(id))
            setError(
              'Couldn’t update storage. Your recipe has not been deleted.',
            )
          setRecipes(loadRecipes())
        }}
      />
      <section className="demo-invite">
        <div>
          <span className="eyebrow">A LITTLE TASTE BEFORE YOU START</span>
          <h2>Meet your new kitchen companion.</h2>
          <p>Try a guided pancake recipe. No microphone or setup needed.</p>
        </div>
        <button
          className="btn"
          onClick={() =>
            dispatch({
              type: 'START',
              dish: 'Sunday pancakes',
              cook: 'Betty',
              demo: true,
            })
          }
        >
          <Icon name="play" size={17} /> Try the guided demo
        </button>
      </section>
      <dialog
        ref={dialog}
        className="start-dialog"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close()
        }}
      >
        <button
          className="icon-button dialog-close"
          aria-label="Close new recipe"
          onClick={() => dialog.current.close()}
        >
          <Icon name="close" />
        </button>
        <span className="dialog-icon">
          <Icon name="leaf" size={28} />
        </span>
        <p className="eyebrow">A NEW PAGE IN YOUR RECIPE BOOK</p>
        <h2>Who’s in the kitchen?</h2>
        <p>Start with a dish and the person who makes it special.</p>
        {draft ? (
          <>
            <p className="notice">
              You have an unfinished recipe: {draft.cook}’s {draft.dish}. Finish
              it or save its notes before starting another.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'RESUME', session: draft })}
            >
              Resume your recipe <Icon name="arrow" />
            </button>
          </>
        ) : (
          <form onSubmit={start}>
            <label className="field">
              What are we making?
              <input
                autoFocus
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                placeholder="e.g. Sunday pancakes"
                maxLength={100}
                required
                autoComplete="off"
              />
            </label>
            <label className="field">
              Who’s the cook?
              <input
                value={cook}
                onChange={(e) => setCook(e.target.value)}
                placeholder="e.g. Grandma Betty"
                maxLength={80}
                required
                autoComplete="off"
              />
            </label>
            <button
              className="btn btn-primary"
              disabled={!dish.trim() || !cook.trim()}
            >
              Let’s start cooking <Icon name="arrow" />
            </button>
          </form>
        )}
        <p className="privacy-note">
          Recipes stay in this browser. Audio and text are sent to Google Gemini
          for transcription and recipe help.
        </p>
        {status?.aiConfigured === false && (
          <p className="notice">
            Voice and AI questions aren’t connected yet. You can still type and
            save your cooking notes, or try the guided demo.
          </p>
        )}
      </dialog>
    </main>
  )
}
