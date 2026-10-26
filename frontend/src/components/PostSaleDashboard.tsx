import type { SupportCard as Card, Trip } from '../state/types'
import { DisruptionBanner } from './DisruptionBanner'
import { Itinerary } from './Itinerary'
import { SupportCard } from './SupportCard'

export function PostSaleDashboard({ trip, disruption, supportCards, lastChangedId }: {
  trip: Trip
  disruption: { message: string } | null
  supportCards: Card[]
  lastChangedId: string | null
}) {
  return (
    <div data-testid="postsale" className="space-y-4">
      {disruption && <DisruptionBanner message={disruption.message} />}
      <div>
        <div className="mb-2 text-sm font-medium text-muted">Your booked trip</div>
        <Itinerary trip={trip} lastChangedId={lastChangedId} />
      </div>
      {supportCards.length > 0 && (
        <div className="space-y-2">
          {supportCards.map((c, i) => <SupportCard key={i} card={c} />)}
        </div>
      )}
    </div>
  )
}
