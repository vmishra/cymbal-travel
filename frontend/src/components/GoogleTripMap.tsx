import { useEffect, useMemo, useRef, useState } from 'react'
import type { Trip, Weather } from '../state/types'
import { DOMAIN_COLOR } from '../theme'
import { hotScore, sceneFor } from '../lib/visuals'
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

export function GoogleTripMap({ apiKey, trip, weather, cities }: {
  apiKey: string; trip: Trip | null; weather: Record<string, Weather>; cities: string[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

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
      {selected && (
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
