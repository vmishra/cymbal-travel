import type { Line } from '../state/types'

export function TranscriptRail({ lines }: { lines: Line[] }) {
  const recent = lines.slice(-5)
  return (
    <div data-testid="transcript" className="flex flex-col gap-1.5">
      {recent.map((l) => {
        const user = l.role === 'user'
        return (
          <div
            key={l.id}
            className={`anim-slidein max-w-[90%] rounded-2xl px-3 py-1.5 text-[14px] leading-snug ${
              user ? 'self-end bg-brand text-white' : 'self-start bg-card text-ink ring-1 ring-line'
            }`}
          >
            {l.data}
          </div>
        )
      })}
    </div>
  )
}
