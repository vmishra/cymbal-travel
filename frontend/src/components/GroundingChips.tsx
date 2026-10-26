import { GROUNDING } from '../state/types'
import { Icon } from './Icon'

export function GroundingChips({ grounding }: { grounding: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GROUNDING.map((source) => {
        const count = grounding[source] ?? 0
        const active = count > 0
        return (
          <span
            key={`${source}-${count}`}
            data-grounding={source}
            data-active={active}
            className={`anim-chippop inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${
              active ? 'bg-sky text-brand ring-brand/20' : 'bg-paper text-muted ring-line'
            }`}
          >
            <Icon name={source === 'Maps' ? 'map' : 'sparkle'} size={12} />
            {source}
          </span>
        )
      })}
    </div>
  )
}
