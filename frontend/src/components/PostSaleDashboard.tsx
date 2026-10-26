import type { Option, SupportCard as Card, Trip } from '../state/types'
import { DisruptionBanner } from './DisruptionBanner'
import { Itinerary } from './Itinerary'
import { OptionsCarousel } from './OptionsCarousel'
import { SupportCard } from './SupportCard'

export function PostSaleDashboard({ trip, disruption, supportCards, lastChangedId, options, onSelect, onDismiss }: {
  trip: Trip
  disruption: { message: string } | null
  supportCards: Card[]
  lastChangedId: string | null
  options?: { category: string; options: Option[] } | null
  onSelect?: (id: string) => void
  onDismiss?: () => void
}) {
  return (
    <div data-testid="postsale" className="space-y-4">
      {disruption && <DisruptionBanner message={disruption.message} />}
      {options && onSelect && (
        <OptionsCarousel category={options.category} options={options.options} onSelect={onSelect} onDismiss={onDismiss} />
      )}
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
