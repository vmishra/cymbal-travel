import type { HotelStay } from '../state/types'
import { rupees } from '../theme'
import { Icon } from './Icon'
import { SmartImage } from './SmartImage'

export function HotelCard({ hotel, flash, onOpen }: { hotel: HotelStay; flash?: boolean; onOpen?: (h: HotelStay) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(hotel)}
      data-item-id={hotel.id}
      data-kind="hotel"
      className={`anim-cardin block w-full overflow-hidden rounded-2xl bg-card text-left ring-1 ring-line transition hover:shadow-md ${flash ? 'anim-flash' : ''}`}
    >
      <div className="relative h-28">
        <SmartImage src={hotel.image_url} seed={hotel.hotel} className="h-full w-full" alt={hotel.hotel} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-hotel">
          <Icon name="hotel" size={17} />
        </span>
        <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow">{hotel.hotel}</span>
      </div>
      <div className="flex items-end justify-between p-3">
        <div className="min-w-0">
          <div className="text-[13px] text-amber-500">{'★'.repeat(hotel.tier === 'luxury' ? 5 : hotel.tier === 'premium' ? 4 : 3)}</div>
          {hotel.description && <div className="mt-0.5 line-clamp-1 text-[12px] text-muted">{hotel.description}</div>}
          <div className="mt-0.5 text-[11px] text-muted">{hotel.nights} nights · {hotel.city}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-muted">From</div>
          <div className="tabular text-base font-semibold text-hotel">{rupees(hotel.price_inr)}</div>
        </div>
      </div>
    </button>
  )
}
