import type { ThinkingStep } from '../state/types'
import { Icon } from './Icon'

export function ThinkingSteps({ steps }: { steps: ThinkingStep[] }) {
  if (steps.length === 0) return null
  const allDone = steps.every((s) => s.status === 'done')
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-line">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon name="sparkle" size={14} className="text-brand" />
        DeepDive thinking {allDone && <span className="font-normal text-muted">· done</span>}
      </div>
      <div className="space-y-1.5">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[13px]">
            {s.status === 'done'
              ? <span className="grid h-4 w-4 place-items-center rounded-full bg-hotel/15 text-hotel"><Icon name="check" size={11} strokeWidth={2.6} /></span>
              : <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />}
            <span className={s.status === 'done' ? 'text-ink' : 'text-muted'}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
