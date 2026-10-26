import { AGENTS, type AgentName, type AgentStatus } from '../state/types'
import { AgentLane } from './AgentLane'
import { GroundingChips } from './GroundingChips'
import { Icon } from './Icon'

export function OrchestrationPanel({ agents, grounding }: {
  agents: Record<AgentName, AgentStatus>
  grounding: Record<string, number>
}) {
  const anyActive = AGENTS.some((a) => agents[a] === 'running')
  return (
    <div data-testid="orchestration" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`grid h-7 w-7 place-items-center rounded-lg bg-ink text-white ${anyActive ? 'anim-breathe' : ''}`}>
          <Icon name="sparkle" size={15} />
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight">ADK Orchestrator</div>
          <div className="text-[11px] text-muted">parallel fan-out over MCP</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {AGENTS.map((name, i) => (
          <AgentLane key={name} name={name} status={agents[name]} index={i} />
        ))}
      </div>

      <div className="mt-3 border-t border-line pt-2.5">
        <div className="mb-1.5 text-[11px] text-muted">Grounding</div>
        <GroundingChips grounding={grounding} />
      </div>
    </div>
  )
}
