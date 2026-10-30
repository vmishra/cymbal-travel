import type {
  AppState,
  Budget,
  Item,
  Trip,
  UiEvent,
} from './types'

let _toastId = 1
let _lineId = 1

export function initialState(): AppState {
  return {
    mode: 'plan',
    brief: null,
    trip: null,
    budget: null,
    agents: { Flights: 'idle', Hotels: 'idle', Itinerary: 'idle', Events: 'idle' },
    grounding: {},
    options: null,
    disruption: null,
    supportCards: [],
    toasts: [],
    transcript: [],
    mapPins: [],
    mapCities: [],
    modelLabel: null,
    lastChangedId: null,
    weather: {},
    packing: null,
    cost: null,
    thinking: [],
    customer: null,
    pendingChanges: [],
    payment: null,
  }
}

function allItems(trip: Trip): Item[] {
  return trip.days.flatMap((d) => d.items)
}

export function perPersonTotal(trip: Trip): number {
  return allItems(trip).reduce((sum, it) => sum + (it.price_inr || 0), 0)
}

function deriveBudget(trip: Trip): Budget {
  const total = perPersonTotal(trip)
  return { per_person_total: total, budget_per_person: trip.budget_per_person, over: total > trip.budget_per_person }
}

// Immutably map the item with `id` through `fn` (or drop it when fn returns null).
function mapItems(trip: Trip, id: string, fn: (it: Item) => Item | null): Trip {
  return {
    ...trip,
    days: trip.days.map((d) => ({
      ...d,
      items: d.items.flatMap((it) => (it.id === id ? ([fn(it)].filter(Boolean) as Item[]) : [it])),
    })),
  }
}

export function reducer(state: AppState, event: UiEvent): AppState {
  const p = event.payload ?? {}
  switch (event.type) {
    case 'trip_brief':
      return { ...state, brief: p }

    case 'itinerary_set': {
      const trip = p.trip as Trip
      return { ...state, trip, budget: deriveBudget(trip) }
    }

    case 'agent_status':
      return { ...state, agents: { ...state.agents, [p.agent]: p.status } }

    case 'grounding_ping':
      return { ...state, grounding: { ...state.grounding, [p.source]: (state.grounding[p.source] ?? 0) + 1 } }

    case 'item_add': {
      if (!state.trip) return state
      const trip: Trip = {
        ...state.trip,
        days: state.trip.days.map((d) =>
          d.index === p.day_index ? { ...d, items: [...d.items, p.item as Item] } : d,
        ),
      }
      return { ...state, trip, budget: deriveBudget(trip), lastChangedId: p.item?.id ?? null }
    }

    case 'item_remove': {
      if (!state.trip) return state
      const trip = mapItems(state.trip, p.item_id, () => null)
      return { ...state, trip, budget: deriveBudget(trip), lastChangedId: p.item_id }
    }

    case 'item_swap':
    case 'option_selected': {
      if (!state.trip) return state
      const item = p.item as Item
      // Swap replaces an existing item by id; option_selected may also target an id.
      const exists = allItems(state.trip).some((it) => it.id === item.id)
      let trip: Trip
      if (exists) {
        trip = mapItems(state.trip, item.id, () => item)
      } else {
        trip = state.trip
      }
      return { ...state, trip, budget: deriveBudget(trip), lastChangedId: item.id }
    }

    case 'item_reorder': {
      if (!state.trip) return state
      const trip: Trip = {
        ...state.trip,
        days: state.trip.days.map((d) => {
          if (d.index !== p.day_index) return d
          const byId = new Map(d.items.map((it) => [it.id, it]))
          const items = (p.item_ids as string[]).map((id) => byId.get(id)).filter(Boolean) as Item[]
          return { ...d, items }
        }),
      }
      return { ...state, trip }
    }

    case 'options_show':
      return { ...state, options: { category: p.category, options: p.options } }

    case 'options_clear':
      return { ...state, options: null }

    case 'budget_update':
      return { ...state, budget: { per_person_total: p.per_person_total, budget_per_person: p.budget_per_person, over: p.over } }

    case 'map_update':
      return { ...state, mapPins: p.pins ?? [], mapCities: p.cities ?? [] }

    case 'mode_switch':
      return { ...state, mode: p.mode === 'postsale' ? 'postsale' : 'plan' }

    case 'disruption':
      return { ...state, disruption: { message: p.message, flight_id: p.flight_id } }

    case 'support_card':
      return { ...state, supportCards: [...state.supportCards, { title: p.title, body: p.body, kind: p.kind }] }

    // --- post-sale ("Cymbal Care") ---
    case 'customer_context':
      // A fresh case: reset any prior pending changes / payment, keep the booked trip.
      return { ...state, customer: { customer: p.customer, current_city: p.current_city, total_days: p.total_days }, pendingChanges: [], payment: null }

    case 'pending_change': {
      const next = { id: p.id, kind: p.kind, label: p.label, detail: p.detail, amount_inr: p.amount_inr ?? 0, status: p.status }
      const idx = state.pendingChanges.findIndex((c) => c.id === p.id)
      const pendingChanges = [...state.pendingChanges]
      if (idx >= 0) pendingChanges[idx] = next
      else pendingChanges.push(next)
      return { ...state, pendingChanges }
    }

    case 'payment_request':
      return { ...state, payment: { status: 'requested', amount_inr: p.amount_inr, brand: p.brand, last4: p.last4 } }

    case 'payment_confirmed':
      return { ...state, payment: { status: 'paid', amount_inr: p.amount_inr, brand: p.brand, last4: p.last4, ref: p.ref } }

    case 'toast':
      return { ...state, toasts: [...state.toasts, { id: _toastId++, message: p.message, level: p.level }] }

    case 'thinking_step': {
      const existing = state.thinking.findIndex((t) => t.label === p.label)
      const thinking = [...state.thinking]
      if (existing >= 0) thinking[existing] = { label: p.label, status: p.status }
      else thinking.push({ label: p.label, status: p.status })
      return { ...state, thinking }
    }

    case 'weather_set':
      return { ...state, weather: { ...state.weather, [p.city]: p } }

    case 'packing_set':
      return { ...state, packing: p }

    case 'cost_summary':
      return { ...state, cost: p }

    case 'travel_note':
      return state

    // frame-derived actions
    case 'transcript':
      return { ...state, transcript: [...state.transcript, { id: _lineId++, role: p.role, data: p.data }] }

    case 'ready':
      return { ...state, modelLabel: p.model_label ?? null }

    default:
      return state
  }
}
