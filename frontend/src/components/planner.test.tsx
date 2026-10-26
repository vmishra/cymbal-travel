import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Budget, Trip } from '../state/types'
import { BudgetMeter } from './BudgetMeter'
import { Itinerary } from './Itinerary'

const trip: Trip = {
  id: 't1', title: 'Japan', origin: 'Bangalore', destinations: ['Tokyo'],
  start_date: '2026-12-10', nights: 3, travellers: [{ type: 'adult' }],
  budget_per_person: 200000, pace: 'leisure', must_dos: [],
  days: [
    { index: 0, city: 'Tokyo', items: [
      { kind: 'flight', id: 'f1', title: 'AeroNova BLR–NRT', price_inr: 41000, airline: 'AeroNova', origin: 'BLR', destination: 'NRT', depart: '08:00', arrive: '18:30', tier: 'comfort' },
      { kind: 'hotel', id: 'h1', title: 'Azure Grand Tokyo', price_inr: 22000, hotel: 'Azure Grand Tokyo', city: 'Tokyo', nights: 3, check_in: '2026-12-10', tier: 'comfort' },
    ] },
  ],
}

describe('planner components', () => {
  it('renders day stations and itinerary items', () => {
    render(<Itinerary trip={trip} lastChangedId={null} />)
    expect(screen.getByText('Azure Grand Tokyo')).toBeInTheDocument()
    expect(screen.getByText('AeroNova BLR–NRT')).toBeInTheDocument()
    expect(screen.getByTestId('itinerary').querySelector('[data-day="0"]')).toBeTruthy()
    expect(screen.getByTestId('itinerary').querySelector('[data-item-id="h1"]')).toBeTruthy()
  })

  it('budget meter shows the over-budget state', () => {
    const over: Budget = { per_person_total: 250000, budget_per_person: 200000, over: true }
    render(<BudgetMeter budget={over} />)
    expect(screen.getByTestId('budget').getAttribute('data-over')).toBe('true')
    expect(screen.getByText('Over budget')).toBeInTheDocument()
  })

  it('budget meter hides over-budget when under', () => {
    const under: Budget = { per_person_total: 120000, budget_per_person: 200000, over: false }
    render(<BudgetMeter budget={under} />)
    expect(screen.getByTestId('budget').getAttribute('data-over')).toBe('false')
    expect(screen.queryByText('Over budget')).toBeNull()
  })
})
