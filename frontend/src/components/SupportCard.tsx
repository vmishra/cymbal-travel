import type { SupportCard as Card } from '../state/types'
import { Icon } from './Icon'

export function SupportCard({ card }: { card: Card }) {
  const success = card.kind === 'success'
  const color = success ? '#34a853' : '#1a73e8'
  return (
    <div className="anim-cardin flex items-start gap-3 rounded-xl bg-card p-3 ring-1 ring-line">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color, background: color + '18' }}>
        <Icon name={success ? 'check' : 'sparkle'} size={17} strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-[14px] font-medium">{card.title}</div>
        <div className="text-[13px] text-muted">{card.body}</div>
      </div>
    </div>
  )
}
