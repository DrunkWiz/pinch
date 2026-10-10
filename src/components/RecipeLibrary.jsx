import { useState } from 'react'
import Icon from './Icon.jsx'
export default function RecipeLibrary({
  recipes,
  onOpen,
  onDelete,
  onCreate,
  onSample,
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [armed, setArmed] = useState(null)
  const filtered = recipes
    .filter((r) => r.card.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'az'
        ? a.card.title.localeCompare(b.card.title)
        : new Date(b.savedAt) - new Date(a.savedAt),
    )
  return (
    <section className="library" id="collection" aria-label="Your recipes">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE GOOD THINGS WE KEEP</p>
          <h2>
            Your recipe book <span className="count">{recipes.length}</span>
          </h2>
          <p>A collection of dishes, stories, and the people behind them.</p>
        </div>
        <button className="btn btn-small" onClick={onCreate}>
          <Icon name="plus" size={17} /> New recipe
        </button>
      </div>
      {recipes.length > 0 && (
        <div className="library-tools">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              type="search"
              aria-label="Search recipes"
              placeholder="Find a family favorite…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Sort recipes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="az">A to Z</option>
          </select>
        </div>
      )}
      {!recipes.length ? (
        <div className="empty-library">
          <div className="empty-book">
            <Icon name="book" size={34} />
            <span>
              <Icon name="heart" size={13} />
            </span>
          </div>
          <h3>Every family has that one recipe.</h3>
          <p>
            The soup that fixes everything. The cake that means home.
            <br />
            Start with the one you’d miss the most.
          </p>
          <button className="text-button" onClick={onCreate}>
            Keep your first recipe <Icon name="arrow" size={17} />
          </button>
          <button className="sample-link" onClick={onSample}>
            Or take a peek at Betty’s pancakes
          </button>
        </div>
      ) : filtered.length ? (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <article className="library-card" key={r.id}>
              <button className="recipe-open" onClick={() => onOpen(r)}>
                <div className="recipe-cover">
                  <Icon name="book" size={35} />
                  <span>
                    {r.card.notesOnly ? 'COOKING NOTES' : 'FAMILY FAVORITE'}
                  </span>
                </div>
                <div className="recipe-summary">
                  <h3>{r.card.title}</h3>
                  <p>
                    {r.card.method.length} {r.card.method.length === 1 ? 'step' : 'steps'} <span>·</span>{' '}
                    {new Date(r.savedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <span
                    className={`recipe-status ${r.card.stillUnknown.length ? 'pending' : ''}`}
                  >
                    {r.card.stillUnknown.length
                      ? `${r.card.stillUnknown.length} ${r.card.stillUnknown.length === 1 ? 'detail' : 'details'} to revisit`
                      : 'Every detail kept'}{' '}
                    <Icon name="arrow" size={16} />
                  </span>
                </div>
              </button>
              <div className="delete-row">
                {armed === r.id ? (
                  <>
                    <span>Delete this recipe?</span>
                    <button
                      onClick={() => {
                        onDelete(r.id)
                        setArmed(null)
                      }}
                    >
                      Delete
                    </button>
                    <button onClick={() => setArmed(null)}>Cancel</button>
                  </>
                ) : (
                  <button
                    aria-label={`Delete ${r.card.title}`}
                    onClick={() => setArmed(r.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-library compact">
          <Icon name="search" size={28} />
          <h3>No recipes match “{search}”</h3>
          <button className="text-button" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      )}
      <p className="library-storage">
        <Icon name="book" size={14} /> Saved on this device, in this browser.
        Download or print a copy to keep it safe.
      </p>
    </section>
  )
}
