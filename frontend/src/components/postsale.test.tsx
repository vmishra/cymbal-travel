import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Trip } from '../state/types'
import { PostSaleDashboard } from './PostSaleDashboard'

const trip: Trip = {
  id: 't1', title: 'Japan — booked', origin: 'Bangalore', destinations: ['Tokyo'],
  start_date: '2026-12-10', nights: 3, travellers: [{ type: 'adult' }],
  budget_per_person: 200000, pace: 'leisure', must_dos: [],
  days: [{ index: 0, city: 'Tokyo', items: [
    { kind: 'flight', id: 'f1', title: 'AeroNova BLR–NRT', price_inr: 41000, airline: 'AeroNova', origin: 'BLR', destination: 'NRT', depart: '08:00', arrive: '18:30', tier: 'comfort' },
  ] }],
}

describe('post-sale dashboard', () => {
  it('shows the disruption banner, booked trip and support cards', () => {
    render(<PostSaleDashboard
      trip={trip}
      disruption={{ message: 'Your flight to Tokyo is delayed.' }}
      supportCards={[{ title: 'Flight rebooked', body: 'You are on Zephyr Air.', kind: 'success' }]}
      lastChangedId={null} />)
    expect(screen.getByTestId('postsale')).toBeInTheDocument()
    expect(screen.getByText(/flight to Tokyo is delayed/i)).toBeInTheDocument()
    expect(screen.getByText('Flight rebooked')).toBeInTheDocument()
    expect(screen.getByText('AeroNova BLR–NRT')).toBeInTheDocument()
  })

  it('renders without a disruption banner when there is none', () => {
    render(<PostSaleDashboard trip={trip} disruption={null} supportCards={[]} lastChangedId={null} />)
    expect(screen.queryByTestId('disruption')).toBeNull()
  })
})
