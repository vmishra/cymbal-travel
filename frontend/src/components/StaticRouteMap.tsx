import type { MapPin } from '../state/types'

// A stylized "journey" map: evenly spaced stops along a gentle arc. Clearer than a
// literal projection (the curated cities are geographically close) and needs no
// network tiles — the happy path never depends on a live map.
export function StaticRouteMap({ cities, pins }: { cities: string[]; pins: MapPin[] }) {
  const stops = (pins.length ? pins.map((p) => p.city) : cities).filter(Boolean)
  const n = Math.max(stops.length, 1)
  const W = 400
  const H = 170
  const mx = 44
  const pts = stops.map((_, i) => {
    const x = n === 1 ? W / 2 : mx + (i * (W - 2 * mx)) / (n - 1)
    const y = H / 2 + Math.sin(i * 0.9 + 0.6) * 26 - 6
    return { x, y }
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <div data-testid="static-map" className="relative overflow-hidden rounded-xl ring-1 ring-line">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Trip route">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eaf1fe" />
            <stop offset="1" stopColor="#f6f8fc" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#sky)" />
        {/* soft abstract landmass */}
        <path d="M-10 130 Q 80 95 160 120 T 410 110 L 410 180 L -10 180 Z" fill="#e3ecfb" opacity="0.7" />
        <path d="M-10 150 Q 120 120 240 140 T 410 135 L 410 180 L -10 180 Z" fill="#dbe7fa" opacity="0.7" />
        {/* route */}
        <path data-route d={path} fill="none" stroke="#1a73e8" strokeWidth="2.5"
          strokeDasharray="2 6" strokeLinecap="round" opacity="0.85" />
        {pts.map((p, i) => (
          <g key={stops[i] + i} data-stop>
            <circle cx={p.x} cy={p.y} r="8" fill="#fff" stroke="#1a73e8" strokeWidth="2.5" />
            <circle cx={p.x} cy={p.y} r="3" fill={i === 0 ? '#ea4335' : '#1a73e8'} />
            <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="11" fontWeight="600" fill="#202124">
              {stops[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
