import type { Option } from '../state/types'
import { OptionCard } from './OptionCard'

const NOUN: Record<string, string> = {
  flight: 'flight', hotel: 'place to stay', activity: 'experience', event: 'event',
}

export function OptionsCarousel({ category, options, onSelect, onDismiss }: {
  category: string
  options: Option[]
  onSelect: (id: string) => void
  onDismiss?: () => void
}) {
  return (
    <div data-testid="options" className="anim-cardin rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Choose a {NOUN[category] ?? category}</div>
          <div className="text-[12px] text-muted">Say “pick the premium one” — or tap a card</div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="rounded-full px-2 py-1 text-[12px] text-muted hover:bg-paper">Dismiss</button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {options.map((o) => (
          <OptionCard key={o.id} option={o} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
