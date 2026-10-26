import type { ReactNode } from 'react'

export function StatTile({ value, unit, label, icon }: {
  value: ReactNode; unit?: string; label: string; icon?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line">
      <div>
        <div className="tabular text-lg font-semibold leading-none">
          {value}{unit && <span className="ml-0.5 text-xs font-medium text-muted">{unit}</span>}
        </div>
        <div className="mt-1 text-[11px] text-muted">{label}</div>
      </div>
      {icon && <span className="text-muted">{icon}</span>}
    </div>
  )
}
