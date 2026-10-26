import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StaticRouteMap } from './StaticRouteMap'
import { TripMap } from './TripMap'

const pins = [
  { city: 'Bangalore', lat: 12.97, lng: 77.59 },
  { city: 'Tokyo', lat: 35.68, lng: 139.65 },
  { city: 'Kyoto', lat: 35.01, lng: 135.77 },
]

describe('map', () => {
  it('static route map renders one stop per pin with labels and a route', () => {
    render(<StaticRouteMap cities={['Tokyo', 'Kyoto']} pins={pins} />)
    const map = screen.getByTestId('static-map')
    expect(map.querySelectorAll('[data-stop]').length).toBe(3)
    expect(map.querySelector('[data-route]')).toBeTruthy()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Kyoto')).toBeInTheDocument()
  })

  it('TripMap falls back to the static map when no API key is set', () => {
    render(<TripMap cities={['Tokyo']} pins={pins} />)
    expect(screen.getByTestId('static-map')).toBeInTheDocument()
  })
})
