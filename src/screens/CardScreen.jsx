import { useState } from 'react'
import HeirloomCard from '../components/HeirloomCard.jsx'

export default function CardScreen({ session, dispatch }) {
  const saved = Boolean(session.savedId)
  // Only ask before leaving if the card couldn't be saved (e.g. storage blocked).
  // Confirm on the page, not with window.confirm — embedded browsers can block that dialog silently.
  const [confirming, setConfirming] = useState(false)
  const leave = () => dispatch({ type: 'RESET' })

  return (
    <main className="card-screen">
      <HeirloomCard card={session.card} />
      <div className="card-actions no-print">
        {!session.fromLibrary && (
          <p className={`saved-note${saved ? '' : ' unsaved'}`}>
            {saved ? '✓ Saved to Your recipes on this device' : 'Not saved — this browser won’t store it. Print to keep it.'}
          </p>
        )}
        <button type="button" className="btn btn-primary btn-big" onClick={() => window.print()}>
          Print
        </button>
        {session.fromLibrary ? (
          <button type="button" className="btn" onClick={leave}>
            ← Back to your recipes
          </button>
        ) : saved ? (
          <button type="button" className="btn" onClick={leave}>
            Start a new recipe
          </button>
        ) : confirming ? (
          <div className="confirm" role="alertdialog" aria-label="Leave without saving?">
            <p>This card isn’t saved. Leave anyway?</p>
            <div className="confirm-actions">
              <button type="button" className="btn" onClick={() => setConfirming(false)}>
                Back to card
              </button>
              <button type="button" className="btn btn-ink" onClick={leave}>
                Leave
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>
            Start a new recipe
          </button>
        )}
      </div>
    </main>
  )
}
