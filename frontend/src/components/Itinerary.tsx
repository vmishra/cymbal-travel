import type { Trip } from '../state/types'
import { ItemRow } from './ItemRow'

export function Itinerary({ trip, lastChangedId }: { trip: Trip; lastChangedId: string | null }) {
  return (
    <div className="relative" data-testid="itinerary">
      {/* timeline spine */}
      <div className="absolute bottom-2 left-[22px] top-2 w-px bg-line" aria-hidden />
      <div className="space-y-5">
        {trip.days.map((day) => (
          <div key={day.index} className="relative pl-12" data-day={day.index}>
            <div className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full border border-line bg-card">
              <div className="text-center leading-none">
                <div className="text-[9px] uppercase tracking-wide text-muted">Day</div>
                <div className="tabular text-base font-semibold">{day.index + 1}</div>
              </div>
            </div>
            <div className="pt-1.5">
              <div className="mb-1 text-[13px] font-medium text-muted">{day.city}</div>
              {day.items.map((item) => (
                <ItemRow key={item.id} item={item} flash={item.id === lastChangedId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
