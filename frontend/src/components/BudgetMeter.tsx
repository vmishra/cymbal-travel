import type { Budget } from '../state/types'
import { rupees } from '../theme'

export function BudgetMeter({ budget }: { budget: Budget }) {
  const pct = Math.min(100, Math.round((budget.per_person_total / Math.max(1, budget.budget_per_person)) * 100))
  const color = budget.over ? '#ea4335' : '#34a853'
  return (
    <div data-testid="budget" data-over={budget.over}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-muted">Per person</span>
        <span className="tabular text-sm">
          <span className="text-lg font-semibold" style={{ color }}>{rupees(budget.per_person_total)}</span>
          <span className="text-muted"> / {rupees(budget.budget_per_person)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {budget.over && <div className="mt-1 text-[12px] font-medium text-event">Over budget</div>}
    </div>
  )
}
