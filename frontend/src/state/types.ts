// Mirrors backend/app/domain.py and the UI-event payloads (ui_events.py).

export type Tier = 'value' | 'comfort' | 'premium' | 'luxury'
export type Mode = 'plan' | 'postsale'

export interface Traveller { type: 'adult' | 'child'; age?: number | null }

export type ItemKind = 'flight' | 'hotel' | 'activity' | 'event' | 'transfer'

export type Slot = 'morning' | 'afternoon' | 'evening'

interface BaseItem { id: string; title: string; price_inr: number; description?: string; image_url?: string }
export interface Flight extends BaseItem { kind: 'flight'; airline: string; origin: string; destination: string; depart: string; arrive: string; tier: Tier; duration?: string; stops?: string }
export interface HotelStay extends BaseItem { kind: 'hotel'; hotel: string; city: string; nights: number; check_in: string; tier: Tier }
export interface Activity extends BaseItem { kind: 'activity'; city: string; time?: string | null; duration?: string; slot?: Slot | null }
export interface EventItem extends BaseItem { kind: 'event'; city: string; date?: string | null; slot?: Slot | null }
export interface Transfer extends BaseItem { kind: 'transfer'; mode: string; origin: string; destination: string }
export type Item = Flight | HotelStay | Activity | EventItem | Transfer

export interface Weather { city: string; month?: string; condition: string; icon: string; high_c: number; low_c: number; summary: string }
export interface Packing { city: string; condition: string; icon: string; items: string[]; note: string }
export interface Cost {
  breakdown: { flights: number; hotels: number; activities: number; events: number; transfers: number }
  per_person: number; party_total: number; travellers: number; budget_per_person: number; over: boolean
}
export interface ThinkingStep { label: string; status: 'running' | 'done' }

export interface Day { index: number; city: string; items: Item[] }

export interface Trip {
  id: string
  title: string
  origin: string
  destinations: string[]
  start_date: string
  nights: number
  travellers: Traveller[]
  budget_per_person: number
  pace: string
  must_dos: string[]
  days: Day[]
}

export interface Option {
  id: string
  category: ItemKind
  name: string
  tier: Tier
  price_inr: number
  rating: number
  highlights: string[]
  image_url: string
  description?: string
  duration?: string
  why?: string
}

export interface TripBrief {
  title: string
  origin: string
  destinations: string[]
  nights: number
  start_date: string
  travellers: Traveller[]
  budget_per_person: number
  pace: string
  must_dos: string[]
}

export type AgentName = 'Flights' | 'Hotels' | 'Itinerary' | 'Events'
export type AgentStatus = 'idle' | 'queued' | 'running' | 'done'
export const AGENTS: AgentName[] = ['Flights', 'Hotels', 'Itinerary', 'Events']
export const GROUNDING = ['Maps', 'Search', 'WeatherNext'] as const
export type GroundingSource = (typeof GROUNDING)[number]

export interface Budget { per_person_total: number; budget_per_person: number; over: boolean }
export interface MapPin { city: string; lat: number; lng: number }
export interface SupportCard { title: string; body: string; kind: string }
export interface Toast { id: number; message: string; level: string }
export interface Line { id: number; role: string; data: string }

export interface AppState {
  mode: Mode
  brief: TripBrief | null
  trip: Trip | null
  budget: Budget | null
  agents: Record<AgentName, AgentStatus>
  grounding: Record<string, number>
  options: { category: string; options: Option[] } | null
  disruption: { message: string; flight_id?: string | null } | null
  supportCards: SupportCard[]
  toasts: Toast[]
  transcript: Line[]
  mapPins: MapPin[]
  mapCities: string[]
  modelLabel: string | null
  lastChangedId: string | null
  weather: Record<string, Weather>
  packing: Packing | null
  cost: Cost | null
  thinking: ThinkingStep[]
}

// A reducer action is either a UI event {type,payload} or a frame-derived action.
export interface UiEvent { type: string; payload?: any }
