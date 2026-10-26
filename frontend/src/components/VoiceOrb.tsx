import { Icon } from './Icon'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

const LABEL: Record<OrbState, string> = {
  idle: 'Tap to speak',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
}

export function VoiceOrb({ state, onClick, size = 128 }: { state: OrbState; onClick?: () => void; size?: number }) {
  const active = state !== 'idle'
  const coreAnim =
    state === 'thinking' ? 'anim-spin'
      : state === 'speaking' ? 'anim-breathe-fast'
        : state === 'listening' ? 'anim-breathe'
          : ''
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        aria-label={LABEL[state]}
        data-voice-state={state}
        className="relative grid place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        style={{ width: size, height: size }}
      >
        {active && [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: 'radial-gradient(circle,rgba(26,115,232,0.18),transparent 70%)',
              animation: `halo 2s ease-out ${i * 0.6}s infinite`,
            }}
          />
        ))}
        <span
          className={`relative grid place-items-center rounded-full text-white shadow-lg ${coreAnim}`}
          style={{
            width: size * 0.62,
            height: size * 0.62,
            background: 'conic-gradient(from 210deg,#1a73e8,#34a853,#f9ab00,#ea4335,#1a73e8)',
          }}
        >
          <span className="grid h-full w-full place-items-center rounded-full bg-white/10 backdrop-blur-sm">
            <Icon name="mic" size={size * 0.24} strokeWidth={2} />
          </span>
        </span>
      </button>
      <span className="text-sm text-muted">{LABEL[state]}</span>
    </div>
  )
}
