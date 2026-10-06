// The finished notebook page. Left: a cookable recipe. Right margin: her voice.
// Footer: what's still unknown — the visible proof that Pinch didn't guess.

const KIND_LABEL = { her_words: 'her words', her_reason: 'her reason', she_clarified: 'she clarified' }

function Notes({ notes }) {
  if (!notes.length) return <div className="margin" />
  return (
    <div className="margin">
      {notes.map((n, i) => (
        <p className="note" key={i}>
          “{n.quote}” <span className="note-kind">— {KIND_LABEL[n.kind] ?? 'her words'}</span>
        </p>
      ))}
    </div>
  )
}

export default function HeirloomCard({ card }) {
  const notesFor = (target) => card.marginNotes.filter((n) => n.attachTo === target)
  // Don't repeat inline what the margin already says in her voice.
  const inMargin = (target, quote) => notesFor(target).some((n) => n.quote === quote)
  const clarifiedInMargin = (target) => notesFor(target).some((n) => n.kind === 'she_clarified')

  return (
    <article className="card" aria-label={card.title}>
      <h1 className="card-title">{card.title}</h1>

      <h2 className="card-section">Ingredients</h2>
      {card.ingredients.length === 0 && <p className="row-empty">No ingredients were mentioned.</p>}
      {card.ingredients.map((ing, i) => (
        <div className="row" key={`i${i}`}>
          <div className="line">
            <span className="bullet" aria-hidden="true">•</span>
            <span>
              <strong>{ing.name}</strong>
              {ing.amount === 'amount unknown' ? (
                <span className="unknown-amt"> (amount unknown)</span>
              ) : (
                <> — {ing.amount}</>
              )}
              {ing.confirmed && (
                <span className="confirmed">{clarifiedInMargin(`ingredient:${i}`) ? ' ✓' : ' ✓ she clarified'}</span>
              )}
            </span>
          </div>
          <Notes notes={notesFor(`ingredient:${i}`)} />
        </div>
      ))}

      <h2 className="card-section">Method</h2>
      {card.method.map((m, i) => (
        <div className="row" key={`m${i}`}>
          <div className="line">
            <span className="num">{i + 1}.</span>
            <span>
              {m.text}
              {m.reason && !inMargin(`method:${i}`, m.reason) && <em className="reason"> — “{m.reason}”</em>}
            </span>
          </div>
          <Notes notes={notesFor(`method:${i}`)} />
        </div>
      ))}

      <section className="unknown-box" aria-label="Still unknown">
        <h2>Still unknown</h2>
        {card.stillUnknown.length === 0 ? (
          <p className="unknown-none">Nothing — every amount came from the cook.</p>
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
        <p className="unknown-foot">Ask about these next time.</p>
      </section>
    </article>
  )
}
