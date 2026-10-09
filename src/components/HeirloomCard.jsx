// The finished notebook page. Left: a cookable recipe. Right margin: her voice.
// Footer: what's still unknown — the visible proof that Pinch didn't guess.

import { useState } from 'react'
import Icon from './Icon.jsx'
const KIND_LABEL = {
  her_words: 'their words',
  her_reason: 'their reason',
  she_clarified: 'their answer',
}

function Notes({ notes }) {
  if (!notes.length) return <div className="margin" />
  return (
    <div className="margin">
      {notes.map((n, i) => (
        <p className="note" key={i}>
          “{n.quote}”{' '}
          <span className="note-kind">
            — {KIND_LABEL[n.kind] ?? 'their words'}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function HeirloomCard({ card, cooking = false }) {
  const [checked, setChecked] = useState({})
  const check = (key) => setChecked((s) => ({ ...s, [key]: !s[key] }))
  const notesFor = (target) =>
    card.marginNotes.filter((n) => n.attachTo === target)
  // Don't repeat inline what the margin already says in her voice.
  const inMargin = (target, quote) =>
    notesFor(target).some((n) => n.quote === quote)
  const clarifiedInMargin = (target) =>
    notesFor(target).some((n) => n.kind === 'she_clarified')

  return (
    <article className="card" aria-label={card.title}>
      <div className="card-meta">
        <span>FROM THE FAMILY KITCHEN</span>
        <Icon name="leaf" size={21} />
        <span>KEPT WITH PINCH</span>
      </div>
      <h1 className="card-title">{card.title}</h1>

      <h2 className="card-section">Ingredients</h2>
      {card.ingredients.length === 0 && (
        <p className="row-empty">
          {card.notesOnly
            ? 'These are original notes. Ingredients have not been extracted or checked.'
            : 'No ingredients were mentioned.'}
        </p>
      )}
      {card.ingredients.map((ing, i) => (
        <div className="row" key={`i${i}`} style={{ '--i': i + 1 }}>
          <div
            className={`line ${cooking && checked[`i${i}`] ? 'is-done' : ''}`}
          >
            {cooking ? (
              <input
                className="cook-check no-print"
                type="checkbox"
                checked={Boolean(checked[`i${i}`])}
                onChange={() => check(`i${i}`)}
                aria-label={`Prepared ${ing.name}`}
              />
            ) : (
              <span className="bullet" aria-hidden="true">
                •
              </span>
            )}
            <span>
              <strong>{ing.name}</strong>
              {ing.amount === 'amount unknown' ? (
                <span className="unknown-amt"> (amount unknown)</span>
              ) : (
                <> — {ing.amount}</>
              )}
              {ing.confirmed && (
                <span className="confirmed">
                  {clarifiedInMargin(`ingredient:${i}`)
                    ? ' ✓'
                    : ' ✓ clarified by the cook'}
                </span>
              )}
            </span>
          </div>
          <Notes notes={notesFor(`ingredient:${i}`)} />
        </div>
      ))}

      <h2 className="card-section">Method</h2>
      {card.method.map((m, i) => (
        <div
          className="row"
          key={`m${i}`}
          style={{ '--i': card.ingredients.length + i + 2 }}
        >
          <div
            className={`line ${cooking && checked[`m${i}`] ? 'is-done' : ''}`}
          >
            {cooking ? (
              <input
                className="cook-check no-print"
                type="checkbox"
                checked={Boolean(checked[`m${i}`])}
                onChange={() => check(`m${i}`)}
                aria-label={`Completed step ${i + 1}`}
              />
            ) : (
              <span className="num">{i + 1}.</span>
            )}
            <span>
              {m.text}
              {m.reason && !inMargin(`method:${i}`, m.reason) && (
                <em className="reason"> — “{m.reason}”</em>
              )}
            </span>
          </div>
          <Notes notes={notesFor(`method:${i}`)} />
        </div>
      ))}

      <section
        className="unknown-box"
        aria-label="Still unknown"
        style={{ '--i': card.ingredients.length + card.method.length + 3 }}
      >
        <h2>Still unknown</h2>
        {card.stillUnknown.length === 0 ? (
          <p className="unknown-none">
            Nothing — every amount came from the cook.
          </p>
        ) : (
          <ul>
            {card.stillUnknown.map((u, i) => (
              <li key={i}>
                <strong>{u.item}</strong>
                {u.herWords && <> — “{u.herWords}”</>}
                {u.note && <span className="unknown-note"> ({u.note})</span>}
              </li>
            ))}
          </ul>
        )}
        {card.stillUnknown.length > 0 && (
          <p className="unknown-foot">
            A little something to ask about next time.
          </p>
        )}
      </section>
      <div className="recipe-end">A little of them. Kept forever.</div>
    </article>
  )
}
