import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapCanvas } from './MapCanvas'
import { GoogleTripMap } from './GoogleTripMap'
import type { Activity } from '../state/types'

describe('map', () => {
  it('MapCanvas renders one pin per stop, with labels and a route', () => {
    render(<MapCanvas trip={null} weather={{}} cities={['Tokyo', 'Kyoto']} />)
    const map = screen.getByTestId('map')
    expect(map.querySelectorAll('[data-pin]').length).toBe(2)
    expect(map.querySelector('path[d]')).toBeTruthy()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Kyoto')).toBeInTheDocument()
  })

  it('GoogleTripMap surfaces a clicked place as a listing overlay on the map', () => {
    const focus: Activity = {
      id: 'a1', kind: 'activity', title: 'Traditional tea-ceremony experience',
      city: 'Kyoto', price_inr: 3000, description: 'A quiet machiya tea house.',
    }
    render(
      <GoogleTripMap apiKey="test-key" trip={null} weather={{}} cities={['Kyoto']}
        focus={focus} onClearFocus={() => {}} />,
    )
    const listing = screen.getByTestId('map-listing')
    expect(listing).toHaveTextContent('Traditional tea-ceremony experience')
    expect(listing).toHaveTextContent('Kyoto')
  })
})
