import { describe, expect, it } from 'vitest'
import { initialState, reducer } from './reducer'
import type { AppState, Trip } from './types'

const trip: Trip = {
  id: 't1', title: 'Japan', origin: 'Bangalore', destinations: ['Tokyo'],
  start_date: '2026-12-10', nights: 3, travellers: [{ type: 'adult' }],
  budget_per_person: 200000, pace: 'leisure', must_dos: [],
  days: [
    { index: 0, city: 'Tokyo', items: [
      { kind: 'flight', id: 'f1', title: 'AeroNova', price_inr: 40000, airline: 'AeroNova', origin: 'BLR', destination: 'NRT', depart: '08:00', arrive: '18:00', tier: 'comfort' },
      { kind: 'hotel', id: 'h1', title: 'Azure Grand', price_inr: 30000, hotel: 'Azure Grand', city: 'Tokyo', nights: 3, check_in: '2026-12-10', tier: 'comfort' },
    ] },
  ],
}

function withTrip(): AppState {
  return reducer(initialState(), { type: 'itinerary_set', payload: { trip } })
}

describe('reducer', () => {
  it('applies itinerary_set and derives budget', () => {
    const s = withTrip()
    expect(s.trip?.id).toBe('t1')
    expect(s.budget?.per_person_total).toBe(70000)
    expect(s.budget?.over).toBe(false)
  })

  it('item_swap replaces the card and updates budget', () => {
    const s0 = withTrip()
    const newHotel = { kind: 'hotel', id: 'h1', title: 'Meridian Grand', price_inr: 50000, hotel: 'Meridian Grand', city: 'Tokyo', nights: 3, check_in: '2026-12-10', tier: 'premium' }
    const s = reducer(s0, { type: 'item_swap', payload: { item: newHotel } })
    const hotel = s.trip!.days[0].items.find((i) => i.id === 'h1')!
    expect((hotel as any).hotel).toBe('Meridian Grand')
    expect(s.budget?.per_person_total).toBe(90000)
  })

  it('item_remove drops the card', () => {
    const s0 = withTrip()
    const s = reducer(s0, { type: 'item_remove', payload: { item_id: 'h1' } })
    expect(s.trip!.days[0].items.find((i) => i.id === 'h1')).toBeUndefined()
    expect(s.budget?.per_person_total).toBe(40000)
  })

  it('agent_status updates the panel lane', () => {
    const s = reducer(initialState(), { type: 'agent_status', payload: { agent: 'Hotels', status: 'running' } })
    expect(s.agents.Hotels).toBe('running')
  })

  it('toast is non-destructive to the trip', () => {
    const s0 = withTrip()
    const s = reducer(s0, { type: 'toast', payload: { message: 'hi', level: 'info' } })
    expect(s.trip).toEqual(s0.trip)
    expect(s.toasts.at(-1)?.message).toBe('hi')
  })
})

describe('post-sale (Cymbal Care)', () => {
  const customer = {
    name: 'Vikas Mishra', party: '2 adults · 1 child', booking_ref: 'CYMBAL-7K2D',
    current_day_index: 2, payment: { brand: 'Visa', last4: '4242' },
  }

  it('customer_context sets the case and resets any prior pending changes', () => {
    let s = reducer(initialState(), { type: 'pending_change', payload: { id: 'old', kind: 'flight', label: 'stale', amount_inr: 1, status: 'proposed' } })
    s = reducer(s, { type: 'customer_context', payload: { customer, current_city: 'Tokyo', total_days: 7 } })
    expect(s.customer?.customer.name).toBe('Vikas Mishra')
    expect(s.customer?.current_city).toBe('Tokyo')
    expect(s.pendingChanges).toHaveLength(0)
    expect(s.payment).toBeNull()
  })

  it('pending_change upserts by id (propose then confirm)', () => {
    let s = reducer(initialState(), { type: 'pending_change', payload: { id: 'pc-flight', kind: 'flight', label: 'Move flight', amount_inr: 10000, status: 'proposed' } })
    expect(s.pendingChanges).toHaveLength(1)
    s = reducer(s, { type: 'pending_change', payload: { id: 'pc-flight', kind: 'flight', label: 'Flight rebooked', amount_inr: 10000, status: 'confirmed' } })
    expect(s.pendingChanges).toHaveLength(1)
    expect(s.pendingChanges[0].status).toBe('confirmed')
  })

  it('payment_request then payment_confirmed tracks the charge', () => {
    let s = reducer(initialState(), { type: 'payment_request', payload: { amount_inr: 12000, brand: 'Visa', last4: '4242' } })
    expect(s.payment?.status).toBe('requested')
    s = reducer(s, { type: 'payment_confirmed', payload: { amount_inr: 12000, brand: 'Visa', last4: '4242', ref: 'CYMBAL-ABCD' } })
    expect(s.payment?.status).toBe('paid')
    expect(s.payment?.ref).toBe('CYMBAL-ABCD')
  })
})

describe('screen advances on trip_brief', () => {
  it('sets brief so the workspace (trip||brief) shows', () => {
    const s = reducer(initialState(), { type: 'trip_brief', payload: { title: 'Japan', origin: 'Bangalore', destinations: ['Tokyo'], nights: 7, travellers: [], budget_per_person: 200000 } })
    expect(s.brief).toBeTruthy()
    expect(Boolean(s.trip || s.brief)).toBe(true)
  })
})
