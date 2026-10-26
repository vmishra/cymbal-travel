import type { Item } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'
import { Icon } from './Icon'

function meta(item: Item): string {
  switch (item.kind) {
    case 'flight': return `${item.origin} → ${item.destination} · ${item.depart}–${item.arrive}`
    case 'hotel': return `${item.nights} nights · ${item.city}`
    case 'transfer': return `${item.mode} · ${item.origin} → ${item.destination}`
    case 'activity': return `${item.time ? item.time + ' · ' : ''}${item.city}`
    case 'event': return `${item.date ? item.date + ' · ' : ''}${item.city}`
  }
}

export function ItemRow({ item, flash }: { item: Item; flash?: boolean }) {
  const color = DOMAIN_COLOR[item.kind]
  return (
    <div
      data-item-id={item.id}
      data-kind={item.kind}
      className="anim-cardin group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${flash ? 'anim-flash' : ''}`}
        style={{ color, background: color + '14' }}
      >
        <Icon name={item.kind} size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium leading-tight">{item.title}</div>
        <div className="truncate text-[13px] text-muted">{meta(item)}</div>
      </div>
      {item.price_inr > 0 && (
        <div className="tabular shrink-0 text-[13px] font-medium text-muted">{rupees(item.price_inr)}</div>
      )}
    </div>
  )
}
