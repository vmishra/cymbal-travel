import type { Activity, EventItem } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'
import { hotScore } from '../lib/visuals'
import { Icon } from './Icon'
import { SmartImage } from './SmartImage'

export function PlaceCard({ item, flash, onOpen }: {
  item: Activity | EventItem; flash?: boolean; onOpen?: (item: Activity | EventItem) => void
}) {
  const color = DOMAIN_COLOR[item.kind]
  const dur = 'duration' in item ? item.duration : ''
  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      data-item-id={item.id}
      data-kind={item.kind}
      className={`anim-cardin flex w-full overflow-hidden rounded-2xl bg-card text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md ${flash ? 'anim-flash' : ''}`}
    >
      <div className="relative w-28 shrink-0">
        <SmartImage src={item.image_url} seed={item.title} className="h-full min-h-[92px] w-full" alt={item.title} />
        <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90" style={{ color }}>
          <Icon name={item.kind} size={16} />
        </span>
        <span className="absolute bottom-1.5 left-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white">🔥 {hotScore(item.title)}</span>
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[15px] font-semibold leading-tight">{item.title}</div>
          {item.price_inr > 0 && <div className="tabular shrink-0 text-[13px] font-medium text-muted">{rupees(item.price_inr)}</div>}
        </div>
        {item.description && <div className="mt-0.5 line-clamp-2 text-[13px] text-muted">{item.description}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          {dur && <span className="rounded-full bg-paper px-2 py-0.5">{dur}</span>}
          <span className="rounded-full bg-paper px-2 py-0.5">{item.city}</span>
        </div>
      </div>
    </button>
  )
}
