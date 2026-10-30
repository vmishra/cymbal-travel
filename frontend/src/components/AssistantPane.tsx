import type { AppState } from '../state/types'
import { rupees } from '../theme'
import { StatTile } from './StatTile'
import { ThinkingSteps } from './ThinkingSteps'
import { GroundingChips } from './GroundingChips'
import { TranscriptRail } from './TranscriptRail'
import { OptionsCarousel } from './OptionsCarousel'
import { SupportCard } from './SupportCard'
import { VoiceOrb, type OrbState } from './VoiceOrb'
import { LivePanel } from './LivePanel'
import { Icon } from './Icon'

const SEASONS = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
  'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter']

function seasonOf(startDate: string): string {
  const m = parseInt(startDate?.split('-')[1] ?? '', 10)
  return Number.isFinite(m) ? SEASONS[(m - 1) % 12] : '—'
}

export function AssistantPane({ state, orbState, running, onSelect, onDismissOptions, onOrbClick }: {
  state: AppState
  orbState: OrbState
  running: boolean
  onSelect: (id: string) => void
  onDismissOptions: () => void
  onOrbClick: () => void
}) {
  const trip = state.trip
  const firstCity = trip?.destinations[0]
  const w = firstCity ? state.weather[firstCity] : undefined
  const budget = trip?.budget_per_person ?? state.brief?.budget_per_person

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-event text-white"><Icon name="sparkle" size={15} /></span>
        <div className="text-[15px] font-semibold">Isha · your concierge</div>
      </div>

      {(trip || state.brief) && (
        <div className="grid grid-cols-2 gap-2">
          <StatTile value={trip?.nights ?? state.brief?.nights ?? '—'} unit="nights" label="Duration" icon={<Icon name="event" size={16} />} />
          <StatTile value={seasonOf(trip?.start_date ?? state.brief?.start_date ?? '')} label="Best time" icon={<Icon name="sparkle" size={16} />} />
          <StatTile value={w ? `${w.low_c}–${w.high_c}` : '—'} unit="°C" label="Weather" icon={<span>{w?.icon ?? '🌡️'}</span>} />
          <StatTile value={budget ? rupees(budget) : '—'} label="Budget / person" icon={<Icon name="hotel" size={16} />} />
        </div>
      )}

      {trip && <LivePanel city={firstCity} weather={w} />}

      {state.thinking.length > 0 && <ThinkingSteps steps={state.thinking} />}
      {Object.keys(state.grounding).length > 0 && (
        <div className="rounded-2xl bg-card p-3 ring-1 ring-line">
          <div className="mb-1.5 text-[11px] text-muted">Grounded with</div>
          <GroundingChips grounding={state.grounding} />
        </div>
      )}

      {state.options && (
        <OptionsCarousel category={state.options.category} options={state.options.options}
          onSelect={onSelect} onDismiss={onDismissOptions} />
      )}

      {state.supportCards.length > 0 && (
        <div className="space-y-2">{state.supportCards.map((c, i) => <SupportCard key={i} card={c} />)}</div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TranscriptRail lines={state.transcript} />
      </div>

      <div className="flex justify-center">
        <VoiceOrb state={orbState} onClick={onOrbClick} size={running ? 84 : 120} />
      </div>
    </div>
  )
}
