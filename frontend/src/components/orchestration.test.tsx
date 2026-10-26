import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrchestrationPanel } from './OrchestrationPanel'

describe('orchestration panel', () => {
  it('shows four agent lanes carrying their status', () => {
    render(<OrchestrationPanel
      agents={{ Flights: 'done', Hotels: 'running', Itinerary: 'done', Events: 'queued' }}
      grounding={{}} />)
    const panel = screen.getByTestId('orchestration')
    expect(panel.querySelectorAll('[data-agent]').length).toBe(4)
    expect(panel.querySelector('[data-agent="Flights"]')?.getAttribute('data-status')).toBe('done')
    expect(panel.querySelector('[data-agent="Events"]')?.getAttribute('data-status')).toBe('queued')
  })

  it('activates grounding chips that have pinged', () => {
    render(<OrchestrationPanel
      agents={{ Flights: 'idle', Hotels: 'idle', Itinerary: 'idle', Events: 'idle' }}
      grounding={{ Maps: 2, Search: 1 }} />)
    expect(screen.getByText('Maps').closest('[data-grounding]')?.getAttribute('data-active')).toBe('true')
    expect(screen.getByText('WeatherNext').closest('[data-grounding]')?.getAttribute('data-active')).toBe('false')
  })
})
