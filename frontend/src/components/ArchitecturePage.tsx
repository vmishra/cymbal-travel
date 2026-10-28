// A premium, accurate reference-architecture view: how to build an agentic travel
// planner on Google Cloud. Brand-neutral, Google colours. Marks which pieces the
// live demo uses vs. the fuller production blueprint (so the diagram can exceed the
// demo, including newer models like Gemini 3.8 Live).
import { Icon } from './Icon'

const BLUE = '#1a73e8', GREEN = '#34a853', AMBER = '#f9ab00', RED = '#ea4335', PURPLE = '#9334e6', TEAL = '#12a4b4', INK = '#5f6368'

type Node = { name: string; tag?: string; used?: boolean }
type Band = { layer: string; color: string; blurb: string; nodes: Node[] }

const PIPELINE = [
  ['Traveller', 'Voice or web — one request'],
  ['Agent Runtime', 'Intent + plan (ADK)'],
  ['Parallel tools · MCP', 'Flights · hotels · maps · weather'],
  ['Sub-agents compose', 'Flights / Hotels / Itinerary / Events'],
  ['Gemini synthesises', 'Grounded, cited itinerary'],
  ['Respond + write-back', 'Calendar · Wallet · Memory'],
]

const BANDS: Band[] = [
  {
    layer: 'Experience', color: BLUE,
    blurb: 'How travellers interact — hands-free voice is the hero.',
    nodes: [
      { name: 'Voice — Gemini 3.8 Live (native audio)', tag: 'Live API', used: true },
      { name: 'Web / Mobile app', used: true },
      { name: 'Live Translate (97 languages)', tag: 'Preview' },
      { name: 'Gemini TTS', tag: 'GA' },
    ],
  },
  {
    layer: 'Agent runtime', color: PURPLE,
    blurb: 'Vertex AI Agent Engine orchestrates a graph of specialist agents.',
    nodes: [
      { name: 'Vertex AI Agent Engine · Agent Runtime', tag: 'GA' },
      { name: 'ADK Orchestrator (fan-out / fan-in)', tag: 'GA', used: true },
      { name: 'Flights · Hotels · Itinerary · Events agents', used: true },
      { name: 'Payments agent', },
      { name: 'A2A — partner agents', tag: 'Preview' },
    ],
  },
  {
    layer: 'Models (Gemini)', color: RED,
    blurb: 'The latest Gemini models, matched to each job.',
    nodes: [
      { name: 'Gemini 3 Pro — reasoning & synthesis', tag: 'GA' },
      { name: 'Gemini 3.8 Live — speech-to-speech', tag: 'Live', used: true },
      { name: 'Nano Banana Pro — imagery', tag: 'GA', used: true },
      { name: 'Embeddings', tag: 'GA' },
      { name: 'Veo — video', tag: 'GA' },
    ],
  },
  {
    layer: 'Grounding & tools', color: GREEN,
    blurb: 'Real-world facts over MCP — never hallucinated.',
    nodes: [
      { name: 'Google Maps Grounding — Places · Routes', tag: 'GA', used: true },
      { name: 'Grounding with Google Search', tag: 'GA', used: true },
      { name: 'WeatherNext — weather windows', tag: 'Preview', used: true },
      { name: 'Function calling (async / NON_BLOCKING)', used: true },
      { name: 'MCP Toolbox · JSON-RPC', tag: 'GA' },
    ],
  },
  {
    layer: 'Context & memory', color: AMBER,
    blurb: 'The agent remembers preferences and holds long context.',
    nodes: [
      { name: 'Agent Memory Bank — long-term prefs', tag: 'GA' },
      { name: 'Sessions — conversation state', tag: 'GA' },
      { name: 'Long context + context caching', tag: 'GA' },
      { name: 'Vertex AI Vector Search', tag: 'GA' },
    ],
  },
  {
    layer: 'Data', color: TEAL,
    blurb: 'Managed data for inventory, semantics and analytics.',
    nodes: [
      { name: 'Spanner — bookings & inventory', tag: 'GA' },
      { name: 'AlloyDB — vector / semantic search', tag: 'GA' },
      { name: 'BigQuery — fares & demand', tag: 'GA' },
      { name: 'Firestore · Memorystore', tag: 'GA' },
    ],
  },
  {
    layer: 'Platform & governance', color: INK,
    blurb: 'Serverless runtime with safety and observability built in.',
    nodes: [
      { name: 'Cloud Run · GKE', tag: 'GA' },
      { name: 'Model Armor — prompt-injection / DLP', tag: 'GA' },
      { name: 'IAM / OAuth 2.0 — no keys in prod', tag: 'GA' },
      { name: 'Cloud Trace · Audit', tag: 'GA' },
    ],
  },
]

export function ArchitecturePage() {
  return (
    <div data-testid="architecture" className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* hero */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1a73e8] via-[#9334e6] to-[#ea4335] p-6 text-white shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-white/80">Reference architecture</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Build an agentic travel planner on Google Cloud</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90">
            How Gemini, Vertex AI Agent Engine, grounding and managed data come together into a voice-first
            planner. The live demo runs a subset; this is the full state-of-the-art blueprint.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white/20 px-2.5 py-1">◆ Used in this demo</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">GA / Preview = maturity</span>
          </div>
        </div>

        {/* request pipeline */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-muted">Request flow</div>
          <div className="flex flex-wrap items-stretch gap-2">
            {PIPELINE.map(([t, s], i) => (
              <div key={t} className="flex items-center gap-2">
                <div className="min-w-[150px] rounded-xl bg-card p-3 ring-1 ring-line">
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[11px] text-muted">{s}</div>
                </div>
                {i < PIPELINE.length - 1 && <span className="text-brand">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* layered bands */}
        <div className="mt-6 space-y-3">
          {BANDS.map((b) => (
            <div key={b.layer} className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ background: b.color }} />
                <div className="flex-1 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm font-semibold" style={{ color: b.color }}>{b.layer}</div>
                    <div className="hidden text-[12px] text-muted sm:block">{b.blurb}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {b.nodes.map((n) => (
                      <div key={n.name} className="flex items-start gap-2 rounded-xl bg-paper p-2.5 ring-1 ring-line">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                          style={{ color: b.color, background: b.color + '18' }}>
                          <Icon name="sparkle" size={13} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium leading-tight">{n.name}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {n.used && <span className="rounded-full bg-brand/10 px-1.5 text-[10px] font-semibold text-brand">◆ in demo</span>}
                            {n.tag && <span className="rounded-full bg-black/5 px-1.5 text-[10px] text-muted">{n.tag}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[12px] text-muted">
          Cymbal Travels demo · grounded in Google Maps, Search & WeatherNext · voice by Gemini Live · images by Nano Banana.
        </p>
      </div>
    </div>
  )
}
