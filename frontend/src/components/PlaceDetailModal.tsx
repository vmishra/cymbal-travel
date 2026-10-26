import type { Activity, EventItem } from '../state/types'
import { rupees } from '../theme'
import { hotScore } from '../lib/visuals'
import { SmartImage } from './SmartImage'

export function PlaceDetailModal({ item, onClose }: { item: Activity | EventItem; onClose: () => void }) {
  const dur = 'duration' in item ? item.duration : ''
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-cardin w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-52">
          <SmartImage src={item.image_url} seed={item.title} className="h-full w-full" alt={item.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">✕</button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="text-xl font-semibold leading-tight drop-shadow">{item.title}</div>
            <div className="mt-0.5 text-[13px] opacity-90">🔥 {hotScore(item.title)} · {item.city}{dur ? ` · ${dur}` : ''}</div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {item.description && <p className="text-[14px] leading-relaxed text-ink">{item.description}</p>}
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
            {item.slot && <span className="rounded-full bg-paper px-2.5 py-1 capitalize ring-1 ring-line">{item.slot}</span>}
            {dur && <span className="rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{dur}</span>}
            {item.price_inr > 0 && <span className="tabular rounded-full bg-paper px-2.5 py-1 ring-1 ring-line">{rupees(item.price_inr)} / person</span>}
          </div>
          <div className="rounded-xl bg-sky/60 px-3 py-2 text-[13px] text-brand">
            ✨ Maya picked this — a local favourite that fits your pace.
          </div>
        </div>
      </div>
    </div>
  )
}
