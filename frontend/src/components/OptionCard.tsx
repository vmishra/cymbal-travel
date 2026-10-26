import type { Option } from '../state/types'
import { TIER_LABEL, rupees } from '../theme'

const TIER_COLOR: Record<string, string> = {
  value: '#5f6368',
  comfort: '#1a73e8',
  premium: '#9334e6',
  luxury: '#f9ab00',
}

export function OptionCard({ option, onSelect }: { option: Option; onSelect: (id: string) => void }) {
  const color = TIER_COLOR[option.tier]
  return (
    <button
      data-option-id={option.id}
      onClick={() => onSelect(option.id)}
      className="anim-cardin flex w-56 shrink-0 flex-col rounded-2xl bg-card text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-20 rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${color}26, ${color}0d)` }} />
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color, background: color + '18' }}>
            {TIER_LABEL[option.tier]}
          </span>
          <span className="text-[12px] text-muted">★ {option.rating.toFixed(1)}</span>
        </div>
        <div className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-tight">{option.name}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {option.highlights.slice(0, 2).map((h) => (
            <span key={h} className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-muted">{h}</span>
          ))}
        </div>
        <div className="tabular mt-auto pt-2 text-lg font-semibold" style={{ color }}>{rupees(option.price_inr)}</div>
      </div>
    </button>
  )
}
