// The recipe building up as she cooks: a tick for settled steps,
// a question mark for anything headed to Still Unknown.

const settled = (s) => s.status === 'clear' && !s.vagueItems?.length

export default function RecipeSoFar({ steps }) {
  const done = steps.filter((s) => s.closed && s.transcript)
  if (!done.length) return null
  return (
    <section className="so-far" aria-label="Recipe so far">
      <h2 className="so-far-label">Recipe so far</h2>
      <ol>
        {done.map((s) => {
          const ok = settled(s) || s.status === 'answered'
          return (
            <li key={s.id}>
              <span className={ok ? 'mark-ok' : 'mark-q'} aria-label={ok ? 'settled' : 'still unknown'}>
                {ok ? '✓' : '?'}
              </span>
              <span className="so-far-text">{s.transcript}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
