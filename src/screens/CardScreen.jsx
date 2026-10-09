import { useState } from 'react'
import HeirloomCard from '../components/HeirloomCard.jsx'

export default function CardScreen({ session, dispatch }) {
  // Confirm on the page, not with window.confirm — embedded browsers can block that dialog silently.
  const [confirming, setConfirming] = useState(false)

  return (
    <main className="card-screen">
      <HeirloomCard card={session.card} />
      <div className="card-actions no-print">
        <button type="button" className="btn btn-primary btn-big" onClick={() => window.print()}>
          Print
        </button>
        {confirming ? (
          <div className="confirm" role="alertdialog" aria-label="Start a new recipe?">
            <p>Start a new recipe? This card will be gone unless you’ve printed it.</p>
            <div className="confirm-actions">
              <button type="button" className="btn" onClick={() => setConfirming(false)}>
                Keep this card
              </button>
              <button type="button" className="btn btn-ink" onClick={() => dispatch({ type: 'RESET' })}>
                Start new
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="link" onClick={() => setConfirming(true)}>
            Start a new recipe
          </button>
        )}
      </div>
    </main>
  )
}
