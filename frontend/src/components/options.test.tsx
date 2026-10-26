import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Option } from '../state/types'
import { OptionsCarousel } from './OptionsCarousel'

const options: Option[] = [
  { id: 'h1', category: 'hotel', name: 'Azure Grand Tokyo', tier: 'value', price_inr: 12000, rating: 4.0, highlights: ['Central'], image_url: '' },
  { id: 'h2', category: 'hotel', name: 'Sakura Garden Tokyo', tier: 'comfort', price_inr: 22000, rating: 4.3, highlights: ['Quiet'], image_url: '' },
  { id: 'h3', category: 'hotel', name: 'Meridian Grand Tokyo', tier: 'premium', price_inr: 38000, rating: 4.6, highlights: ['Views'], image_url: '' },
  { id: 'h4', category: 'hotel', name: 'Lumière Tokyo', tier: 'luxury', price_inr: 70000, rating: 4.9, highlights: ['Spa'], image_url: '' },
]

describe('options carousel', () => {
  it('renders a card per option spanning tiers with prices', () => {
    render(<OptionsCarousel category="hotel" options={options} onSelect={() => {}} />)
    const cards = screen.getByTestId('options').querySelectorAll('[data-option-id]')
    expect(cards.length).toBe(4)
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Luxury')).toBeInTheDocument()
    expect(screen.getByText('₹38,000')).toBeInTheDocument()
  })

  it('calls onSelect with the option id when a card is picked', () => {
    const picked: string[] = []
    render(<OptionsCarousel category="hotel" options={options} onSelect={(id) => picked.push(id)} />)
    fireEvent.click(screen.getByTestId('options').querySelector('[data-option-id="h3"]')!)
    expect(picked).toEqual(['h3'])
  })
})
