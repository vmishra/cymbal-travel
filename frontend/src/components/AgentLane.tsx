import type { AgentName, AgentStatus, ItemKind } from '../state/types'
import { AGENT_COLOR } from '../theme'
import { Icon } from './Icon'

const AGENT_ICON: Record<AgentName, ItemKind> = {
  Flights: 'flight',
  Hotels: 'hotel',
  Itinerary: 'activity',
  Events: 'event',
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'idle', queued: 'queued', running: 'working…', done: 'done',
}

export function AgentLane({ name, status, index }: { name: AgentName; status: AgentStatus; index: number }) {
  const color = AGENT_COLOR[name]
  const active = status === 'running' || status === 'done'
  const done = status === 'done'
  return (
    <div data-agent={name} data-status={status} className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ color, background: color + '14' }}>
        <Icon name={AGENT_ICON[name]} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium">{name}</span>
          <span className={`text-[11px] ${status === 'running' ? 'anim-pulse' : 'text-muted'}`}
            style={status === 'running' ? { color } : undefined}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
            style={{ width: active ? '100%' : '0%', background: color, transitionDelay: `${index * 220}ms` }}
          />
        </div>
      </div>
      <span className="grid w-4 place-items-center" style={{ color }}>
        {done && <Icon name="check" size={14} strokeWidth={2.4} />}
      </span>
    </div>
  )
}
