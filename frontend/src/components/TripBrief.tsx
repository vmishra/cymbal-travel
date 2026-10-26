import type { ReactNode } from 'react'
import type { TripBrief as Brief } from '../state/types'
import { rupees } from '../theme'

export function TripBrief({ brief }: { brief: Brief }) {
  const route = [brief.origin, ...brief.destinations].filter(Boolean)
  const travellers = `${brief.travellers.length} ${brief.travellers.length === 1 ? 'traveller' : 'travellers'}`
  const kids = brief.travellers.filter((t) => t.type === 'child').length
  return (
    <div data-testid="trip-brief" className="rounded-2xl bg-card p-4 ring-1 ring-line">
      <div className="text-xl font-semibold tracking-tight">{brief.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px]">
        {route.map((c, i) => (
          <span key={c + i} className="flex items-center gap-1.5">
            <span className="font-medium">{c}</span>
            {i < route.length - 1 && <span className="text-muted">→</span>}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-muted">
        <Chip>{brief.nights} nights</Chip>
        <Chip>{travellers}{kids ? `, incl. ${kids} child` : ''}</Chip>
        <Chip>{rupees(brief.budget_per_person)} pp</Chip>
        <Chip>{brief.pace}</Chip>
      </div>
      {brief.must_dos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {brief.must_dos.map((m) => (
            <span key={m} className="rounded-full bg-sky px-2.5 py-0.5 text-[12px] font-medium text-brand">{m}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-paper px-2.5 py-0.5">{children}</span>
}
