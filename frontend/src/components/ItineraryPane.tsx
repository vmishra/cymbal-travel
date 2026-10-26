import { useEffect, useState, type ReactNode } from 'react'
import type { Activity, Cost, Day, EventItem, Flight, HotelStay, Packing, Slot, Transfer, Trip, Weather } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'
import { Icon } from './Icon'
import { PlaceCard } from './PlaceCard'
import { HotelCard } from './HotelCard'
import { CostBreakdown } from './CostBreakdown'
import { PackingPanel } from './PackingPanel'
import { TipsPanel } from './TipsPanel'
import { PlaceDetailModal } from './PlaceDetailModal'

type OpenFn = (item: Activity | EventItem) => void

const SLOTS: [Slot, string][] = [['morning', '🌅 Morning'], ['afternoon', '☀️ Afternoon'], ['evening', '🌙 Evening']]

function TravelRow({ item }: { item: Flight | Transfer }) {
  const color = DOMAIN_COLOR[item.kind]
  const sub = item.kind === 'flight'
    ? `${item.origin} → ${item.destination} · ${item.duration || ''} · ${item.stops || ''}`
    : item.description || `${item.origin} → ${item.destination}`
  return (
    <div data-item-id={item.id} data-kind={item.kind} className="anim-cardin flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color, background: color + '18' }}>
        <Icon name={item.kind} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium">{item.title}</div>
        <div className="truncate text-[12px] text-muted">{sub}</div>
      </div>
      {item.price_inr > 0 && <div className="tabular text-[12px] font-medium text-muted">{rupees(item.price_inr)}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[13px] font-semibold text-muted">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DayView({ day, weather, lastChangedId, onOpen }: { day: Day; weather?: Weather; lastChangedId: string | null; onOpen: OpenFn }) {
  const travel = day.items.filter((i): i is Flight | Transfer => i.kind === 'flight' || i.kind === 'transfer')
  const stay = day.items.find((i): i is HotelStay => i.kind === 'hotel')
  const places = day.items.filter((i): i is Activity | EventItem => i.kind === 'activity' || i.kind === 'event')
  const bySlot = (s: Slot) => places.filter((p) => (p.slot ?? 'afternoon') === s)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">{day.city}</div>
        {weather && <span className="rounded-full bg-paper px-2.5 py-1 text-[12px] text-muted ring-1 ring-line">{weather.icon} {weather.low_c}–{weather.high_c}°C</span>}
      </div>
      {travel.length > 0 && <Section title="Getting there">{travel.map((t) => <TravelRow key={t.id} item={t} />)}</Section>}
      <Section title="What to see & do">
        {SLOTS.map(([slot, label]) => {
          const items = bySlot(slot)
          if (items.length === 0) return null
          return (
            <div key={slot}>
              <div className="mb-1 mt-1 text-[12px] font-medium">{label}</div>
              <div className="space-y-2">{items.map((p) => <PlaceCard key={p.id} item={p} flash={p.id === lastChangedId} onOpen={onOpen} />)}</div>
            </div>
          )
        })}
      </Section>
      {stay && <Section title="Where to stay"><HotelCard hotel={stay} flash={stay.id === lastChangedId} /></Section>}
    </div>
  )
}

export function ItineraryPane({ trip, weather, cost, packing, lastChangedId }: {
  trip: Trip
  weather: Record<string, Weather>
  cost: Cost | null
  packing: Packing | null
  lastChangedId: string | null
}) {
  const [tab, setTab] = useState(0) // 0 = overview, 1..N = day
  const [detail, setDetail] = useState<Activity | EventItem | null>(null)
  useEffect(() => { if (tab > trip.days.length) setTab(0) }, [trip.days.length, tab])

  return (
    <div data-testid="itinerary" className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        <TabBtn active={tab === 0} onClick={() => setTab(0)}>Overview</TabBtn>
        {trip.days.map((d) => (
          <TabBtn key={d.index} active={tab === d.index + 1} onClick={() => setTab(d.index + 1)}>Day {d.index + 1}</TabBtn>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === 0 ? (
          <div className="space-y-5">
            {cost && <CostBreakdown cost={cost} />}
            {trip.days.map((d) => (
              <div key={d.index} className="border-t border-line pt-4 first:border-0 first:pt-0">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Day {d.index + 1}</div>
                <DayView day={d} weather={weather[d.city]} lastChangedId={lastChangedId} onOpen={setDetail} />
              </div>
            ))}
            {packing && <PackingPanel packing={packing} />}
            <TipsPanel />
          </div>
        ) : (
          <DayView day={trip.days[tab - 1]} weather={weather[trip.days[tab - 1]?.city]} lastChangedId={lastChangedId} onOpen={setDetail} />
        )}
      </div>
      {detail && <PlaceDetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} data-tab-active={active}
      className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition ${active ? 'bg-ink text-white' : 'bg-paper text-muted ring-1 ring-line'}`}>
      {children}
    </button>
  )
}
