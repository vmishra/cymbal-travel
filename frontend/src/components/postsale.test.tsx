import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '../state/reducer'
import type { AppState, Trip } from '../state/types'
import { PostSaleView } from './PostSaleView'

const trip: Trip = {
  id: 't1', title: 'Japan — booked', origin: 'Bangalore', destinations: ['Tokyo', 'Kyoto'],
  start_date: '2026-12-10', nights: 5, travellers: [{ type: 'adult' }, { type: 'adult' }, { type: 'child', age: 8 }],
  budget_per_person: 200000, pace: 'leisure', must_dos: [],
  days: [
    { index: 0, city: 'Tokyo', items: [
      { kind: 'flight', id: 'f1', title: 'Nimbus Airways BLR–NRT', price_inr: 41000, airline: 'Nimbus', origin: 'Bangalore', destination: 'Tokyo', depart: '08:00', arrive: '18:30', tier: 'comfort' },
      { kind: 'hotel', id: 'h1', title: 'Cedar & Stone Tokyo', price_inr: 60000, hotel: 'Cedar & Stone Tokyo', city: 'Tokyo', nights: 3, check_in: '2026-12-10', tier: 'comfort' },
    ] },
    { index: 1, city: 'Tokyo', items: [] },
    { index: 2, city: 'Tokyo', items: [] },
  ],
}

const customer = {
  name: 'Vikas Mishra', party: '2 adults · 1 child', booking_ref: 'CYMBAL-7K2D',
  loyalty: 'Cymbal Gold', phone: '+91 98•• ••• 210', current_day_index: 2,
  seats: '14A · 14B · 14C', meal: 'Vegetarian', payment: { brand: 'Visa', last4: '4242', label: 'authorized card on file' },
}

function careState(): AppState {
  let s = reducer(initialState(), { type: 'itinerary_set', payload: { trip } })
  s = reducer(s, { type: 'customer_context', payload: { customer, current_city: 'Tokyo', total_days: 3 } })
  s = reducer(s, { type: 'pending_change', payload: { id: 'pc-flight', kind: 'flight', label: 'Move flight to the next day', detail: 'Bangalore → Tokyo', amount_inr: 10000, status: 'proposed' } })
  return s
}

const noop = () => {}

describe('post-sale (Cymbal Care)', () => {
  it('shows the customer, their current leg and the pending change', () => {
    render(<PostSaleView state={careState()} orbState="idle" running={false} onOrbClick={noop} />)
    expect(screen.getByTestId('postsale')).toBeInTheDocument()
    expect(screen.getByTestId('care-customer')).toHaveTextContent('Vikas Mishra')
    expect(screen.getByTestId('care-customer')).toHaveTextContent('CYMBAL-7K2D')
    expect(screen.getByText('Move flight to the next day')).toBeInTheDocument()
    expect(screen.getByText('Cedar & Stone Tokyo')).toBeInTheDocument()
  })

  it('shows payment as paid with a confirmation reference', () => {
    let s = careState()
    s = reducer(s, { type: 'payment_confirmed', payload: { amount_inr: 10000, brand: 'Visa', last4: '4242', ref: 'CYMBAL-ABCD' } })
    render(<PostSaleView state={s} orbState="idle" running={false} onOrbClick={noop} />)
    const pay = screen.getByTestId('payment')
    expect(pay).toHaveTextContent('Paid')
    expect(pay).toHaveTextContent('CYMBAL-ABCD')
  })

  it('shows the Cymbal Care opening screen before a customer is loaded', () => {
    render(<PostSaleView state={initialState()} orbState="idle" running={false} onOrbClick={noop} />)
    expect(screen.getByTestId('postsale')).toBeInTheDocument()
    expect(screen.getAllByText('Cymbal Care').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('care-customer')).toBeNull()
  })
})
