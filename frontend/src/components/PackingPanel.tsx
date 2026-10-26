import type { Packing } from '../state/types'

export function PackingPanel({ packing }: { packing: Packing }) {
  return (
    <div data-testid="packing" className="rounded-2xl bg-card p-4 ring-1 ring-line">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <span>{packing.icon}</span> What to pack
      </div>
      <div className="mb-2 text-[12px] text-muted">{packing.note}</div>
      <div className="flex flex-wrap gap-1.5">
        {packing.items.map((it) => (
          <span key={it} className="rounded-full bg-paper px-2.5 py-1 text-[12px] ring-1 ring-line">{it}</span>
        ))}
      </div>
    </div>
  )
}
