import type { Activity, EventItem } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'
import { sceneFor, hotScore } from '../lib/visuals'
import { Icon } from './Icon'

export function PlaceCard({ item, flash }: { item: Activity | EventItem; flash?: boolean }) {
  const color = DOMAIN_COLOR[item.kind]
  return (
    <div
      data-item-id={item.id}
      data-kind={item.kind}
      className={`anim-cardin flex overflow-hidden rounded-2xl bg-card ring-1 ring-line transition hover:shadow-md ${flash ? 'anim-flash' : ''}`}
    >
      <div className="relative w-24 shrink-0" style={{ background: sceneFor(item.title) }}>
        <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/85 text-ink" style={{ color }}>
          <Icon name={item.kind} size={16} />
        </span>
        <span className="absolute bottom-1.5 left-2 rounded-full bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          🔥 {hotScore(item.title)}
        </span>
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[15px] font-semibold leading-tight">{item.title}</div>
          {item.price_inr > 0 && <div className="tabular shrink-0 text-[13px] font-medium text-muted">{rupees(item.price_inr)}</div>}
        </div>
        {item.description && <div className="mt-0.5 line-clamp-2 text-[13px] text-muted">{item.description}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          {'duration' in item && item.duration && <span className="rounded-full bg-paper px-2 py-0.5">{item.duration}</span>}
          <span className="rounded-full bg-paper px-2 py-0.5">{item.city}</span>
        </div>
      </div>
    </div>
  )
}
