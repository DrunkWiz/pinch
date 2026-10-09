import { useState } from 'react'

// "Your recipes" on the Start screen. Tap a card to reopen it; delete takes two taps.

const dateLabel = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function RecipeLibrary({ recipes, onOpen, onDelete, onClearAll }) {
  const [armed, setArmed] = useState(null)
  const [clearArmed, setClearArmed] = useState(false)

  if (!recipes.length) {
    return (
      <section className="library" aria-label="Your recipes">
        <h2 className="library-label">Your recipes</h2>
        <p className="library-empty">Finished cards are saved here on this device.</p>
      </section>
    )
  }

  return (
    <section className="library" aria-label="Your recipes">
      <div className="library-head">
        <h2 className="library-label">Your recipes</h2>
        <button
          type="button"
          className={`library-clear${clearArmed ? ' armed' : ''}`}
          onClick={() => (clearArmed ? (onClearAll(), setClearArmed(false)) : setClearArmed(true))}
          onBlur={() => setClearArmed(false)}
        >
          {clearArmed ? 'Clear all recipes?' : 'Clear all'}
        </button>
      </div>
      <ul>
        {recipes.map((r) => {
          const unknown = r.card.stillUnknown?.length ?? 0
          return (
            <li key={r.id} className="library-item">
              <button type="button" className="library-open" onClick={() => onOpen(r)}>
                <span className="library-title">{r.card.title}</span>
                <span className="library-meta">
                  {dateLabel(r.savedAt)}
                  {unknown > 0 && ` · ${unknown} still unknown`}
                </span>
              </button>
              <button
                type="button"
                className={`library-delete${armed === r.id ? ' armed' : ''}`}
                onClick={() => (armed === r.id ? (onDelete(r.id), setArmed(null)) : setArmed(r.id))}
                onBlur={() => setArmed((a) => (a === r.id ? null : a))}
                aria-label={armed === r.id ? `Confirm delete ${r.card.title}` : `Delete ${r.card.title}`}
              >
                {armed === r.id ? 'Delete?' : '×'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
