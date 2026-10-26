import type { Cost } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'

const ROWS: [keyof Cost['breakdown'], string, string][] = [
  ['flights', 'Flights', DOMAIN_COLOR.flight],
  ['hotels', 'Hotels', DOMAIN_COLOR.hotel],
  ['activities', 'Activities', DOMAIN_COLOR.activity],
  ['events', 'Events', DOMAIN_COLOR.event],
  ['transfers', 'Transfers', DOMAIN_COLOR.transfer],
]

export function CostBreakdown({ cost }: { cost: Cost }) {
  const pct = Math.min(100, Math.round((cost.per_person / Math.max(1, cost.budget_per_person)) * 100))
  const barColor = cost.over ? '#ea4335' : '#34a853'
  return (
    <div data-testid="cost" className="rounded-2xl bg-card p-4 ring-1 ring-line">
      <div className="mb-2 text-sm font-semibold">Cost breakdown</div>
      <div className="space-y-1.5">
        {ROWS.filter(([k]) => cost.breakdown[k] > 0).map(([k, label, color]) => (
          <div key={k} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
            <span className="tabular text-muted">{rupees(cost.breakdown[k])}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-line pt-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">Per person</span>
          <span className="tabular text-xl font-semibold" style={{ color: barColor }}>{rupees(cost.per_person)}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>{cost.over ? 'Over budget' : 'Within budget'} · ₹{cost.budget_per_person.toLocaleString('en-IN')} pp</span>
          <span className="tabular">Party total {rupees(cost.party_total)}</span>
        </div>
      </div>
    </div>
  )
}
