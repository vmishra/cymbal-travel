// Exec-grade reference architecture — outcome-first, polished, Google colours.
// Brand-neutral (Cymbal Travels). Accurate Google Cloud product names, presented
// for CMOs / country heads / travel & airline execs, not just engineers.
import { Icon } from './Icon'
import type { ItemKind } from '../state/types'

const BLUE = '#1a73e8', GREEN = '#34a853', AMBER = '#f9ab00', RED = '#ea4335', PURPLE = '#9334e6', TEAL = '#12a4b4', INK = '#3c4043'

type Pill = { name: string; tag?: string; demo?: boolean }
type Layer = { n: string; icon: ItemKind | 'sparkle' | 'map' | 'mic'; title: string; value: string; color: string; pills: Pill[] }

const PILLARS = [
  ['Plan by voice, in minutes', 'Gemini Live turns a conversation into a complete trip.'],
  ['Grounded, never guessed', 'Every place, route and forecast is real — Maps, Search, Weather.'],
  ['Remembers every traveller', 'Agent memory personalises the next trip, and the next.'],
]

const VALUES: [ItemKind | 'mic' | 'map' | 'sparkle', string, string, string][] = [
  ['mic', 'Voice-first', 'A natural, multilingual concierge your customers just talk to.', BLUE],
  ['map', 'Trustworthy', 'Grounded in Google Maps, Search & WeatherNext — with citations.', GREEN],
  ['sparkle', 'Personal', 'Long-term memory makes every itinerary feel hand-made.', AMBER],
  ['hotel', 'Enterprise-ready', 'Runs on Vertex AI Agent Engine, governed and observable.', PURPLE],
]

const FLOW = ['Traveller speaks', 'Agent plans', 'Tools run in parallel', 'Specialists compose', 'Gemini synthesises', 'Booked & remembered']

const LAYERS: Layer[] = [
  { n: '01', icon: 'mic', title: 'Experience', color: BLUE,
    value: 'How travellers engage — hands-free voice is the hero.',
    pills: [{ name: 'Gemini Live · native audio', tag: 'Live', demo: true }, { name: 'Web & mobile', demo: true }, { name: 'Live Translate · 97 languages', tag: 'Preview' }, { name: 'Gemini TTS' }] },
  { n: '02', icon: 'sparkle', title: 'Agent runtime', color: PURPLE,
    value: 'Vertex AI Agent Engine orchestrates a team of specialist agents.',
    pills: [{ name: 'Vertex AI Agent Engine' }, { name: 'ADK orchestrator', demo: true }, { name: 'Flights · Hotels · Itinerary · Events agents', demo: true }, { name: 'Payments agent' }, { name: 'Agent-to-Agent (A2A)', tag: 'Preview' }] },
  { n: '03', icon: 'sparkle', title: 'Models — Gemini', color: RED,
    value: 'The latest Gemini models, matched to each job.',
    pills: [{ name: 'Gemini 3 Pro — reasoning' }, { name: 'Gemini 3.8 Live — speech', tag: 'Live', demo: true }, { name: 'Nano Banana Pro — imagery', demo: true }, { name: 'Embeddings' }, { name: 'Veo — video' }] },
  { n: '04', icon: 'map', title: 'Grounding & tools', color: GREEN,
    value: 'Real-world truth over MCP — the antidote to hallucination.',
    pills: [{ name: 'Google Maps Grounding', demo: true }, { name: 'Grounding with Google Search', demo: true }, { name: 'WeatherNext', tag: 'Preview', demo: true }, { name: 'Function calling', demo: true }, { name: 'MCP Toolbox' }] },
  { n: '05', icon: 'sparkle', title: 'Memory & context', color: AMBER,
    value: 'The agent remembers preferences and holds the whole trip in context.',
    pills: [{ name: 'Agent Memory Bank' }, { name: 'Sessions' }, { name: 'Long context + caching' }, { name: 'Vertex AI Vector Search' }] },
  { n: '06', icon: 'hotel', title: 'Data', color: TEAL,
    value: 'Managed data for inventory, semantic search and analytics.',
    pills: [{ name: 'Spanner' }, { name: 'AlloyDB · vectors' }, { name: 'BigQuery' }, { name: 'Firestore' }, { name: 'Memorystore' }] },
  { n: '07', icon: 'sparkle', title: 'Trust & platform', color: INK,
    value: 'Serverless scale with safety and observability built in.',
    pills: [{ name: 'Cloud Run · GKE' }, { name: 'Model Armor' }, { name: 'IAM / OAuth 2.0' }, { name: 'Cloud Trace · Audit' }] },
]

export function ArchitecturePage() {
  return (
    <div data-testid="architecture" className="h-full overflow-y-auto bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* hero */}
        <div className="relative overflow-hidden rounded-[28px] p-8 text-white shadow-lg"
          style={{ background: 'radial-gradient(130% 130% at 0% 0%, #1a73e8 0%, #7b3fe4 45%, #ea4335 100%)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Google Cloud · Reference architecture</div>
          <h1 className="mt-2 max-w-2xl text-[32px] font-semibold leading-[1.1] tracking-tight">The agentic travel stack</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/90">
            How a voice-first travel concierge is built end-to-end on Google Cloud — the same
            foundations any travel, airline or hospitality brand can use to ship an AI agent customers love.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PILLARS.map(([t, s]) => (
              <div key={t} className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
                <div className="text-[14px] font-semibold">{t}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-white/85">{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* value cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(([icon, title, body, color]) => (
            <div key={title} className="rounded-2xl bg-card p-4 ring-1 ring-line">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ color, background: color + '18' }}><Icon name={icon} size={18} /></span>
              <div className="mt-2.5 text-[15px] font-semibold">{title}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-muted">{body}</div>
            </div>
          ))}
        </div>

        {/* flow */}
        <div className="mt-8">
          <div className="mb-3 text-center text-[12px] font-semibold uppercase tracking-[0.15em] text-muted">From a sentence to a booked trip</div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {FLOW.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="rounded-full bg-card px-3.5 py-1.5 text-[12.5px] font-medium ring-1 ring-line">
                  <span className="mr-1.5 text-muted">{i + 1}</span>{s}
                </div>
                {i < FLOW.length - 1 && <span className="text-brand/60">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* layered stack */}
        <div className="relative mt-8">
          <div className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-gradient-to-b from-brand/30 via-line to-line" aria-hidden />
          <div className="space-y-3">
            {LAYERS.map((L) => (
              <div key={L.title} className="relative flex gap-4">
                <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                  style={{ background: L.color }}>
                  <div className="text-center leading-none">
                    <Icon name={L.icon} size={16} />
                    <div className="mt-0.5 text-[10px] font-semibold opacity-90">{L.n}</div>
                  </div>
                </div>
                <div className="flex-1 rounded-2xl bg-card p-4 ring-1 ring-line">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-[16px] font-semibold" style={{ color: L.color }}>{L.title}</div>
                    <div className="text-[12.5px] text-muted">{L.value}</div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {L.pills.map((p) => (
                      <span key={p.name}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] ring-1 ${p.demo ? 'bg-paper font-medium ring-line' : 'bg-card text-muted ring-line'}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.demo ? L.color : '#c9ccd1' }} />
                        {p.name}
                        {p.tag && <span className="rounded bg-black/5 px-1 text-[10px] text-muted">{p.tag}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" /> Live in this demo</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c9ccd1]" /> Production blueprint</span>
          <span>·</span>
          <span>Cymbal Travels — voice by Gemini Live · grounded by Google Maps, Search &amp; WeatherNext · imagery by Nano Banana</span>
        </div>
      </div>
    </div>
  )
}
