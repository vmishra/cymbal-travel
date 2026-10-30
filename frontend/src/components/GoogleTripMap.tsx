import { useEffect, useMemo, useRef, useState } from 'react'
import type { Item, Trip, Weather } from '../state/types'
import { DOMAIN_COLOR, rupees } from '../theme'
import { hotScore, sceneFor } from '../lib/visuals'
import { Icon } from './Icon'
import { SmartImage } from './SmartImage'
import { MapCanvas } from './MapCanvas'

let scriptPromise: Promise<void> | null = null
const geoCache = new Map<string, { lat: number; lng: number }>()

function loadMaps(key: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    s.async = true
    s.onload = () => {
      // google.maps is populated synchronously after this onload (classic loader).
      if ((window as any).google?.maps) resolve()
      else reject(new Error('maps_not_ready'))
    }
    s.onerror = () => reject(new Error('maps_load_failed'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

// Clean, light, Google-ish styling (declutter POIs, soft water/land).
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f4f6fb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f6368' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#dfe3ec' }] },
  { featureType: 'landscape.natural', stylers: [{ color: '#eaf1ea' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe3fb' }] },
]

function itemCity(it: Item): string {
  return 'city' in it ? (it as any).city : (it as any).destination || ''
}

export function GoogleTripMap({ apiKey, trip, weather, cities, focus, onClearFocus }: {
  apiKey: string; trip: Trip | null; weather: Record<string, Weather>; cities: string[]
  focus?: Item | null; onClearFocus?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const focusMarkerRef = useRef<any>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // Pan + highlight when a place is clicked in the itinerary.
  useEffect(() => {
    const g = (window as any).google
    if (!focus) { focusMarkerRef.current?.setMap(null); focusMarkerRef.current = null; return }
    if (!mapRef.current || !g?.maps) return
    const city = itemCity(focus)
    if (!city) return
    let cancelled = false
    const go = (p: { lat: number; lng: number }) => {
      if (cancelled) return
      const map = mapRef.current
      map.panTo(p)
      map.setZoom(11)
      focusMarkerRef.current?.setMap(null)
      focusMarkerRef.current = new g.maps.Marker({
        position: p, map, animation: g.maps.Animation.BOUNCE,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 13, fillColor: '#ea4335', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 4 },
        zIndex: 999,
      })
    }
    if (geoCache.has(city)) go(geoCache.get(city)!)
    else new g.maps.Geocoder().geocode({ address: city }, (r: any, s: string) => {
      if (s === 'OK' && r[0]) { const l = r[0].geometry.location; const p = { lat: l.lat(), lng: l.lng() }; geoCache.set(city, p); go(p) }
    })
    return () => { cancelled = true }
  }, [focus])

  const stops = useMemo(() => {
    const list = trip ? [trip.origin, ...trip.destinations] : cities
    return Array.from(new Set(list.filter(Boolean)))
  }, [trip, cities])

  useEffect(() => {
    let cancelled = false
    loadMaps(apiKey).then(async () => {
      const g = (window as any).google
      if (cancelled || !ref.current || !g?.maps) { if (!cancelled) setFailed(true); return }
      if (!mapRef.current) {
        mapRef.current = new g.maps.Map(ref.current, {
          center: { lat: 20, lng: 78 }, zoom: 4, disableDefaultUI: true, zoomControl: true,
          styles: MAP_STYLE, backgroundColor: '#eaf1fe',
        })
      }
      const map = mapRef.current
      const geocoder = new g.maps.Geocoder()
      const geocode = (city: string) => new Promise<{ lat: number; lng: number } | null>((res) => {
        if (geoCache.has(city)) return res(geoCache.get(city)!)
        geocoder.geocode({ address: city }, (r: any, status: string) => {
          if (status === 'OK' && r[0]) {
            const loc = r[0].geometry.location
            const p = { lat: loc.lat(), lng: loc.lng() }
            geoCache.set(city, p); res(p)
          } else res(null)
        })
      })
      const points = (await Promise.all(stops.map(async (c) => ({ city: c, p: await geocode(c) }))))
        .filter((x) => x.p) as { city: string; p: { lat: number; lng: number } }[]
      if (cancelled) return

      overlaysRef.current.forEach((o) => o.setMap(null))
      overlaysRef.current = []
      const bounds = new g.maps.LatLngBounds()
      points.forEach(({ city, p }, i) => {
        const marker = new g.maps.Marker({
          position: p, map, title: city,
          label: { text: `${i + 1}`, color: '#fff', fontSize: '12px', fontWeight: '700' },
          icon: {
            path: g.maps.SymbolPath.CIRCLE, scale: 11,
            fillColor: i === 0 ? '#ea4335' : '#1a73e8', fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 3,
          },
        })
        marker.addListener('click', () => setSelected(city))
        overlaysRef.current.push(marker)
        bounds.extend(p)
      })
      if (points.length > 1) {
        const line = new g.maps.Polyline({
          path: points.map((x) => x.p), map, geodesic: true,
          strokeColor: '#1a73e8', strokeOpacity: 0.9, strokeWeight: 3,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '14px' }],
        })
        overlaysRef.current.push(line)
        map.fitBounds(bounds, 56)
      } else if (points.length === 1) {
        map.setCenter(points[0].p); map.setZoom(10)
      }
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [apiKey, stops])

  if (failed) return <MapCanvas trip={trip} weather={weather} cities={cities} />

  const cityItems = (city: string) =>
    (trip?.days.flatMap((d) => d.items) ?? []).filter((it) => 'city' in it && (it as any).city === city)

  return (
    <div data-testid="map" className="relative h-full overflow-hidden rounded-2xl ring-1 ring-line">
      <div ref={ref} className="h-full w-full" />

      {focus && (
        <div data-testid="map-listing" className="anim-cardin absolute bottom-3 left-3 right-3 overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-1 ring-line backdrop-blur">
          <div className="flex">
            <SmartImage src={focus.image_url} seed={focus.title} className="h-24 w-28 shrink-0" alt={focus.title} />
            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold leading-tight">{focus.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted">🔥 {hotScore(focus.title)} · {itemCity(focus)}{'duration' in focus && (focus as any).duration ? ` · ${(focus as any).duration}` : ''}</div>
                </div>
                <button onClick={() => { focusMarkerRef.current?.setMap(null); onClearFocus?.() }}
                  className="shrink-0 rounded-full px-2 text-muted hover:bg-paper">✕</button>
              </div>
              {focus.description && <div className="mt-1 line-clamp-2 text-[12px] text-muted">{focus.description}</div>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky px-2 py-0.5 font-medium text-brand">
                  <Icon name={(focus.kind === 'activity' || focus.kind === 'event' || focus.kind === 'hotel' || focus.kind === 'flight' || focus.kind === 'transfer') ? focus.kind : 'map'} size={11} /> On the map
                </span>
                {focus.price_inr > 0 && <span className="tabular rounded-full bg-paper px-2 py-0.5 text-muted ring-1 ring-line">{rupees(focus.price_inr)}</span>}
                {weather[itemCity(focus)] && <span className="rounded-full bg-paper px-2 py-0.5 text-muted ring-1 ring-line">{weather[itemCity(focus)].icon} {weather[itemCity(focus)].low_c}–{weather[itemCity(focus)].high_c}°C</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!focus && selected && (
        <div className="anim-cardin absolute bottom-3 left-3 right-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-line backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">{selected}</div>
              {weather[selected] && <div className="text-[12px] text-muted">{weather[selected].icon} {weather[selected].summary}</div>}
            </div>
            <button onClick={() => setSelected(null)} className="rounded-full px-2 text-muted hover:bg-paper">✕</button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {cityItems(selected).filter((it) => it.kind === 'activity' || it.kind === 'event').slice(0, 4).map((it) => (
              <div key={it.id} className="w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                <div className="relative h-14" style={{ background: sceneFor(it.title) }}>
                  <span className="absolute bottom-1 left-1.5 rounded-full bg-black/35 px-1.5 text-[9px] font-semibold text-white">🔥 {hotScore(it.title)}</span>
                </div>
                <div className="p-1.5"><div className="line-clamp-2 text-[11px] font-medium leading-tight" style={{ color: DOMAIN_COLOR[it.kind] }}>{it.title}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
