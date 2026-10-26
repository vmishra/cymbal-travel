import type { ItemKind } from '../state/types'

type IconName = ItemKind | 'mic' | 'map' | 'check' | 'alert' | 'sparkle'

const PATHS: Record<IconName, string> = {
  flight: 'M3 12l18-6-6 18-3-7-9-5z',
  hotel: 'M3 20v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 20h18M3 14h18M7 10V6h4v4',
  activity: 'M4 20l6-10 4 5 3-4 3 9zM8 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  event: 'M7 3v3m10-3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z',
  transfer: 'M5 17h14M6 17V8a3 3 0 013-3h6a3 3 0 013 3v9M8 20l-1.5 2M16 20l1.5 2M8.5 11h7',
  mic: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zm6-3a6 6 0 01-12 0M12 18v3',
  map: 'M9 3l6 2 6-2v16l-6 2-6-2-6 2V5l6-2zm0 0v16m6-14v16',
  check: 'M5 13l4 4L19 7',
  alert: 'M12 9v4m0 4h.01M10.3 3.3L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.3a2 2 0 00-3.4 0z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
}

export function Icon({ name, size = 18, className = '', strokeWidth = 1.8 }: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden
      className={className} stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  )
}
