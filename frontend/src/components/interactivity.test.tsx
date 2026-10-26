import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Activity, HotelStay } from '../state/types'
import { PlaceCard } from './PlaceCard'
import { DetailModal } from './DetailModal'

const activity: Activity = {
  kind: 'activity', id: 'a1', title: 'Fushimi Inari shrine hike', price_inr: 1500,
  city: 'Kyoto', slot: 'morning', duration: '2.5 hrs', description: 'The endless vermilion torii gates.',
  image_url: '/api/img/x',
}

const hotel: HotelStay = {
  kind: 'hotel', id: 'h1', title: 'Azure Grand Tokyo', price_inr: 22000, hotel: 'Azure Grand Tokyo',
  city: 'Tokyo', nights: 3, check_in: '2026-12-10', tier: 'premium', description: 'Central boutique stay.',
  image_url: '/api/img/y',
}

describe('interactivity', () => {
  it('clicking a place card opens it (calls onOpen)', () => {
    const onOpen = vi.fn()
    render(<PlaceCard item={activity} onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Fushimi Inari shrine hike'))
    expect(onOpen).toHaveBeenCalledWith(activity)
  })

  it('detail modal shows rich detail for a place', () => {
    render(<DetailModal item={activity} onClose={() => {}} />)
    expect(screen.getByText('Fushimi Inari shrine hike')).toBeInTheDocument()
    expect(screen.getByText('Traveller reviews')).toBeInTheDocument()
  })

  it('detail modal shows amenities + Book for a hotel', () => {
    render(<DetailModal item={hotel} onClose={() => {}} />)
    expect(screen.getByText('Amenities')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument()
  })
})
