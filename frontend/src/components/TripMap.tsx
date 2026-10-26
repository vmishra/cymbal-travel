import type { MapPin } from '../state/types'
import { GoogleMapView } from './GoogleMapView'
import { StaticRouteMap } from './StaticRouteMap'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

// Real Google Maps when a key is present (preferred for open-ended); otherwise a
// stylized static route map. Never a broken/gray tile.
export function TripMap({ cities, pins }: { cities: string[]; pins: MapPin[] }) {
  if (MAPS_KEY && pins.length) {
    return <GoogleMapView apiKey={MAPS_KEY} pins={pins} />
  }
  return <StaticRouteMap cities={cities} pins={pins} />
}
