import { useState } from 'react'
import type { MapPin } from '../state/types'
import { GoogleMapView } from './GoogleMapView'
import { StaticRouteMap } from './StaticRouteMap'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

// Real Google Maps when a key is present (preferred for open-ended); otherwise — or
// if the key is invalid / the script fails — a stylized static route map. Never a
// broken/gray tile.
export function TripMap({ cities, pins }: { cities: string[]; pins: MapPin[] }) {
  const [failed, setFailed] = useState(false)
  if (MAPS_KEY && pins.length && !failed) {
    return <GoogleMapView apiKey={MAPS_KEY} pins={pins} onError={() => setFailed(true)} />
  }
  return <StaticRouteMap cities={cities} pins={pins} />
}
