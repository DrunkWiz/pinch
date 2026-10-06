import HeirloomCard from '../components/HeirloomCard.jsx'

export default function CardScreen({ session, dispatch }) {
  return (
    <main className="card-screen">
      <HeirloomCard card={session.card} />
      <div className="card-actions no-print">
        <button type="button" className="btn btn-primary btn-big" onClick={() => window.print()}>
          Print
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            if (window.confirm('Start a new recipe? This card will be gone unless you printed it.')) dispatch({ type: 'RESET' })
          }}
        >
          Start a new recipe
        </button>
      </div>
    </main>
  )
}
