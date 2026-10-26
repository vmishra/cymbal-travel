import { useMemo, useState } from 'react'
import type { Trip, Weather } from '../state/types'
import { DOMAIN_COLOR } from '../theme'
import { hotScore, sceneFor } from '../lib/visuals'
import { Icon } from './Icon'

const FILTERS = [
  { key: 'activity', label: 'Attractions', icon: 'activity' as const },
  { key: 'hotel', label: 'Hotels', icon: 'hotel' as const },
  { key: 'event', label: 'Events', icon: 'event' as const },
]

export function MapCanvas({ trip, weather, cities }: {
  trip: Trip | null
  weather: Record<string, Weather>
  cities: string[]
}) {
  const stops = useMemo(() => {
    const list = trip ? [trip.origin, ...trip.destinations] : cities
    return list.filter(Boolean)
  }, [trip, cities])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const n = Math.max(stops.length, 1)
  // vertical winding path
  const pts = stops.map((_, i) => ({
    x: 50 + Math.sin(i * 0.9) * 26,
    y: n === 1 ? 50 : 10 + (i * 80) / (n - 1),
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')

  const selCity = selected
  const cityItems = (city: string) =>
    (trip?.days.flatMap((d) => d.items) ?? []).filter((it) => 'city' in it && (it as any).city === city)

  return (
    <div data-testid="map" className="relative h-full overflow-hidden rounded-2xl ring-1 ring-line"
      style={{ background: 'linear-gradient(160deg,#eaf1fe 0%,#e8f5ec 55%,#f6f8fc 100%)' }}>
      {/* abstract landmasses */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M-5 20 Q 30 10 55 22 T 110 18 L 110 -5 L -5 -5 Z" fill="#d7e8d9" opacity="0.6" />
        <path d="M-5 72 Q 35 62 60 72 T 110 70 L 110 110 L -5 110 Z" fill="#dbe7fa" opacity="0.6" />
        <path d="M60 30 Q 85 40 78 60 T 90 95 L 110 95 L 110 25 Z" fill="#e5efe0" opacity="0.5" />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={path} fill="none" stroke="#1a73e8" strokeWidth="0.6" strokeDasharray="1.2 2" opacity="0.8" />
      </svg>

      {/* category filters */}
      <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(filter === f.key ? null : f.key)}
            data-filter={f.key} data-active={filter === f.key}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ring-1 transition ${
              filter === f.key ? 'bg-ink text-white ring-ink' : 'bg-white/90 text-ink ring-line'}`}>
            <Icon name={f.icon} size={12} /> {f.label}
          </button>
        ))}
      </div>

      {/* city pins */}
      {stops.map((city, i) => {
        const w = weather[city]
        const dim = filter != null && cityItems(city).every((it) => it.kind !== filter)
        return (
          <button key={city + i} onClick={() => setSelected(city)}
            data-pin={city}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition"
            style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%`, opacity: dim ? 0.4 : 1 }}>
            <span className="relative grid place-items-center">
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand text-white shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold shadow-sm">
                {w && <span className="mr-1">{w.icon}</span>}{city}
              </span>
            </span>
          </button>
        )
      })}

      {/* place detail */}
      {selCity && (
        <div className="anim-cardin absolute bottom-3 left-3 right-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-line backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">{selCity}</div>
              {weather[selCity] && <div className="text-[12px] text-muted">{weather[selCity].icon} {weather[selCity].summary}</div>}
            </div>
            <button onClick={() => setSelected(null)} className="rounded-full px-2 text-muted hover:bg-paper">✕</button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {cityItems(selCity).filter((it) => it.kind === 'activity' || it.kind === 'event').slice(0, 4).map((it) => (
              <div key={it.id} className="w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                <div className="relative h-14" style={{ background: sceneFor(it.title) }}>
                  <span className="absolute bottom-1 left-1.5 rounded-full bg-black/35 px-1.5 text-[9px] font-semibold text-white">🔥 {hotScore(it.title)}</span>
                </div>
                <div className="p-1.5">
                  <div className="line-clamp-2 text-[11px] font-medium leading-tight" style={{ color: DOMAIN_COLOR[it.kind] }}>{it.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
