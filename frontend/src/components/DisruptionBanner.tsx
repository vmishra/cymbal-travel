import { Icon } from './Icon'

export function DisruptionBanner({ message }: { message: string }) {
  return (
    <div data-testid="disruption" className="anim-cardin flex items-center gap-3 rounded-xl bg-event/8 px-4 py-3 ring-1 ring-event/25">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-event/15 text-event">
        <Icon name="alert" size={18} />
      </span>
      <div className="text-[14px] font-medium text-ink">{message}</div>
    </div>
  )
}
