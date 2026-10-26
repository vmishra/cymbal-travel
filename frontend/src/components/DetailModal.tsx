import type { Item } from '../state/types'
import { DOMAIN_COLOR, TIER_LABEL, rupees } from '../theme'
import { hotScore, sceneFor } from '../lib/visuals'
import { SmartImage } from './SmartImage'
import { Icon } from './Icon'

const REVIEW_POOL = [
  ['Aarti S.', 'Honestly exceeded expectations — so worth it with kids.'],
  ['Rohan M.', 'Easy to reach and never felt too crowded. Loved it.'],
  ['Meghna T.', 'A real highlight of the trip. Go early in the day!'],
  ['Dev P.', 'Great value and the staff were lovely. Would return.'],
  ['Sana K.', 'Beautiful spot, perfect for photos and a slow afternoon.'],
  ['Karan V.', 'Smooth, well organised, and genuinely memorable.'],
]
const AMENITIES = ['Free Wi-Fi', 'Breakfast included', 'Family rooms', 'Pool', 'Near the station', 'Spa & onsen']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
function pick<T>(pool: T[], seed: string, n: number): T[] {
  const start = hash(seed) % pool.length
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length])
}

export function DetailModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const color = DOMAIN_COLOR[item.kind]
  const photo = item.kind === 'activity' || item.kind === 'event' || item.kind === 'hotel'
  const score = hotScore(item.title)
  const reviewCount = 180 + (hash(item.title) % 2400)
  const subtitle =
    item.kind === 'flight' ? `${item.origin} → ${item.destination}`
      : item.kind === 'transfer' ? `${item.mode} · ${item.origin} → ${item.destination}`
        : item.city

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-cardin flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-52 shrink-0" style={{ background: sceneFor(item.title) }}>
          {photo && <SmartImage src={item.image_url} seed={item.title} className="absolute inset-0 h-full w-full" alt={item.title} />}
          {!photo && <div className="grid h-full w-full place-items-center text-white/90"><Icon name={item.kind} size={56} strokeWidth={1.4} /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">✕</button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="text-xl font-semibold leading-tight drop-shadow">{item.title}</div>
            <div className="mt-0.5 text-[13px] opacity-90">🔥 {score} · {subtitle}</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {item.description && <p className="text-[14px] leading-relaxed">{item.description}</p>}

          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
            {'tier' in item && <span className="rounded-full px-2.5 py-1 font-medium" style={{ color, background: color + '18' }}>{TIER_LABEL[item.tier]}</span>}
            {'duration' in item && item.duration && <span className="rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{item.duration}</span>}
            {'slot' in item && item.slot && <span className="rounded-full bg-paper px-2.5 py-1 capitalize ring-1 ring-line">{item.slot}</span>}
            {'nights' in item && <span className="rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{item.nights} nights</span>}
            {'stops' in item && item.stops && <span className="rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{item.stops}</span>}
            {item.price_inr > 0 && <span className="tabular rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{rupees(item.price_inr)}{item.kind === 'hotel' ? ' / night-ish' : ' pp'}</span>}
          </div>

          {item.kind === 'hotel' && (
            <div>
              <div className="mb-1 text-[13px] font-semibold">Amenities</div>
              <div className="flex flex-wrap gap-1.5">
                {pick(AMENITIES, item.title, 4).map((a) => (
                  <span key={a} className="rounded-full bg-paper px-2.5 py-1 text-[12px] ring-1 ring-line">{a}</span>
                ))}
              </div>
            </div>
          )}

          {photo && (
            <div>
              <div className="mb-1 flex items-center justify-between text-[13px] font-semibold">
                <span>Traveller reviews</span>
                <span className="text-muted">★ {(4.2 + (hash(item.title) % 7) / 10).toFixed(1)} · {reviewCount.toLocaleString('en-IN')}</span>
              </div>
              <div className="space-y-2">
                {pick(REVIEW_POOL, item.title, 2).map(([name, text]) => (
                  <div key={name} className="rounded-xl bg-paper p-2.5 text-[13px]">
                    <div className="font-medium">{name}</div>
                    <div className="text-muted">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-sky/60 px-3 py-2 text-[13px] text-brand">✨ Maya picked this for your trip.</div>
        </div>

        {item.kind === 'hotel' && (
          <div className="flex shrink-0 items-center justify-between border-t border-line p-3">
            <div className="tabular text-sm"><span className="text-muted">From </span><span className="text-base font-semibold text-hotel">{rupees(item.price_inr)}</span></div>
            <button className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:brightness-95">Book</button>
          </div>
        )}
      </div>
    </div>
  )
}
