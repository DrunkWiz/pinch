import { useState } from 'react'
import HeirloomCard from '../components/HeirloomCard.jsx'
import Icon from '../components/Icon.jsx'
import { downloadRecipe } from '../lib/draft.js'

export default function CardScreen({ session, dispatch }) {
  const saved = Boolean(session.savedId)
  // Only ask before leaving if the card couldn't be saved (e.g. storage blocked).
  // Confirm on the page, not with window.confirm — embedded browsers can block that dialog silently.
  const [confirming, setConfirming] = useState(false)
  const [cooking, setCooking] = useState(false)
  const isExample = session.sample || session.demo
  const leave = () => dispatch({ type: 'RESET' })

  return (
    <main id="main" className="card-screen">
      <div className="card-topbar no-print">
        <button
          className="text-button"
          onClick={() =>
            saved || session.fromLibrary || isExample
              ? leave()
              : setConfirming(true)
          }
        >
          <Icon name="back" size={17} /> Back to recipe book
        </button>
        <div className="card-tools">
          <button
            className="btn btn-small"
            aria-pressed={cooking}
            onClick={() => setCooking(!cooking)}
          >
            <Icon name="check" size={16} />
            {cooking ? 'Exit cook-along' : 'Cook this recipe'}
          </button>
          <button
            className="btn btn-small"
            onClick={() => downloadRecipe(session.card)}
          >
            <Icon name="download" size={16} /> Download
          </button>
          <button className="btn btn-small" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Print
          </button>
        </div>
      </div>
      {isExample && (
        <div className="sample-banner no-print">
          <strong>
            {session.demo
              ? 'Your demo recipe.'
              : 'A little example of what you’ll keep.'}
          </strong>{' '}
          {session.demo
            ? 'This guided practice is not saved to your family recipe book.'
            : 'Betty’s sample recipe shows how original words, clarifications, and unknown details stay together.'}
        </div>
      )}
      {cooking && (
        <p className="notice no-print">
          Check off ingredients and steps as you cook. These checkmarks are for
          this visit only; your recipe stays unchanged.
        </p>
      )}
      <HeirloomCard card={session.card} cooking={cooking} />
      <div className="card-actions no-print">
        {!session.fromLibrary && !isExample && (
          <p className={`saved-note${saved ? '' : ' unsaved'}`}>
            {saved
              ? '✓ Saved to Your recipes on this device'
              : 'Not saved — this browser won’t store it. Print to keep it.'}
          </p>
        )}
        {session.fromLibrary || isExample ? (
          <button type="button" className="btn" onClick={leave}>
            ← Back to your recipes
          </button>
        ) : saved ? (
          <button type="button" className="btn" onClick={leave}>
            Start a new recipe
          </button>
        ) : confirming ? (
          <div
            className="confirm"
            role="alertdialog"
            aria-label="Leave without saving?"
          >
            <p>This card isn’t saved. Leave anyway?</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setConfirming(false)}
              >
                Back to card
              </button>
              <button type="button" className="btn btn-ink" onClick={leave}>
                Leave
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => setConfirming(true)}
          >
            Start a new recipe
          </button>
        )}
      </div>
    </main>
  )
}
