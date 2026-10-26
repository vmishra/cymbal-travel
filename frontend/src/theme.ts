// Shared design tokens used in component logic (colours that must be inline, and
// motion presets). Visual utility styling lives in Tailwind via index.css @theme.
import type { ItemKind } from './state/types'

export const DOMAIN_COLOR: Record<ItemKind, string> = {
  flight: '#1a73e8',
  hotel: '#34a853',
  activity: '#f9ab00',
  event: '#ea4335',
  transfer: '#9334e6',
}

export const AGENT_COLOR: Record<string, string> = {
  Flights: '#1a73e8',
  Hotels: '#34a853',
  Itinerary: '#f9ab00',
  Events: '#ea4335',
}

export const TIER_LABEL: Record<string, string> = {
  value: 'Value',
  comfort: 'Comfort',
  premium: 'Premium',
  luxury: 'Luxury',
}

export function rupees(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
