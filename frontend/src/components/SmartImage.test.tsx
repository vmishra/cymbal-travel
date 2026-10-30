import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SmartImage } from './SmartImage'

describe('SmartImage', () => {
  it('renders a real <img> for an http/absolute-path source', () => {
    const { container } = render(<SmartImage src="/api/img/hotel-x" seed="hotel" alt="Hotel" />)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('shows only the gradient (no broken <img>) for a grad: sentinel source', () => {
    const { container } = render(<SmartImage src="grad:flight-0" seed="Nimbus Airways Bangalore–Tokyo" alt="flight" />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('shows only the gradient when there is no source', () => {
    const { container } = render(<SmartImage src={undefined} seed="x" alt="x" />)
    expect(container.querySelector('img')).toBeNull()
  })
})
