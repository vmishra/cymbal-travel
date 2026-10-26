import { useEffect, useRef } from 'react'
import type { MapPin } from '../state/types'

// Real Google Maps JS view — used only when VITE_GOOGLE_MAPS_API_KEY is set.
// Loads the Maps script once, drops markers, and draws the route polyline.
let scriptPromise: Promise<void> | null = null

function loadMaps(apiKey: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('maps_load_failed'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function GoogleMapView({ apiKey, pins }: { apiKey: string; pins: MapPin[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    loadMaps(apiKey).then(() => {
      if (cancelled || !ref.current) return
      const g = (window as any).google
      const center = pins.length ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 20, lng: 100 }
      const map = new g.maps.Map(ref.current, { center, zoom: 5, disableDefaultUI: true })
      const bounds = new g.maps.LatLngBounds()
      pins.forEach((p) => {
        new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, title: p.city })
        bounds.extend({ lat: p.lat, lng: p.lng })
      })
      if (pins.length > 1) {
        new g.maps.Polyline({
          path: pins.map((p) => ({ lat: p.lat, lng: p.lng })),
          map, strokeColor: '#1a73e8', strokeOpacity: 0.9, strokeWeight: 2.5,
        })
        map.fitBounds(bounds)
      }
    }).catch(() => { /* fall back silently; static map should be used instead */ })
    return () => { cancelled = true }
  }, [apiKey, pins])

  return <div data-testid="google-map" ref={ref} className="h-[170px] w-full overflow-hidden rounded-xl ring-1 ring-line" />
}
