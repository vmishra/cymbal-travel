import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import { initialState, reducer } from './state/reducer'
import { openSocket, type Frame, type Socket } from './net/socket'
import { useGeminiLiveVoice } from './voice/useGeminiLiveVoice'
import { TripBrief } from './components/TripBrief'
import { Itinerary } from './components/Itinerary'
import { BudgetMeter } from './components/BudgetMeter'
import { TranscriptRail } from './components/TranscriptRail'
import { VoiceOrb, type OrbState } from './components/VoiceOrb'
import { OrchestrationPanel } from './components/OrchestrationPanel'
import { TripMap } from './components/TripMap'
import { OptionsCarousel } from './components/OptionsCarousel'
import { PostSaleDashboard } from './components/PostSaleDashboard'
import type { Item, Option } from './state/types'

type Source = 'sim' | 'voice'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [source, setSource] = useState<Source>('sim')
  const [simRunning, setSimRunning] = useState(false)
  const [draft, setDraft] = useState('')
  const sockRef = useRef<Socket | null>(null)

  const handleFrame = useCallback((f: Frame) => {
    if (f.kind === 'ui' && f.event) dispatch(f.event)
    else if (f.kind === 'transcript') dispatch({ type: 'transcript', payload: f })
    else if (f.kind === 'ready') dispatch({ type: 'ready', payload: f })
    else if (f.kind === 'turn_complete') setSimRunning(false)
  }, [])

  const voice = useGeminiLiveVoice(handleFrame)

  const running = source === 'voice' ? voice.state !== 'idle' : simRunning

  const start = useCallback(() => {
    if (source === 'voice') { voice.start(); return }
    sockRef.current?.close()
    const fast = new URLSearchParams(location.search).get('fast') === '1'
    setSimRunning(true)
    sockRef.current = openSocket(`/api/ws/sim?fast=${fast ? 1 : 0}`, handleFrame, {
      onOpen: () => sockRef.current?.sendJson({ kind: 'start' }),
      onClose: () => setSimRunning(false),
    })
  }, [source, handleFrame, voice])

  const stop = useCallback(() => {
    if (source === 'voice') { voice.stop(); return }
    sockRef.current?.close()
    sockRef.current = null
    setSimRunning(false)
  }, [source, voice])

  const sendDraft = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    dispatch({ type: 'transcript', payload: { role: 'user', data: text } })
    voice.sendText(text)
    setDraft('')
  }, [draft, voice])

  const selectOption = useCallback((id: string) => {
    // Voice mode: route through the backend (authoritative session) so state can't
    // diverge. Sim mode: the session is ephemeral and emits no further events, so a
    // local add is safe and keeps the scripted demo interactive.
    if (source === 'voice') {
      voice.sendTool('select_option', { option_id: id })
      dispatch({ type: 'options_clear' })
      return
    }
    const opt = state.options?.options.find((o) => o.id === id)
    if (!opt || !state.trip) return
    const dayIndex = state.trip.days.length - 1
    const city = state.trip.days[dayIndex]?.city ?? opt.name
    dispatch({ type: 'item_add', payload: { day_index: dayIndex, item: optionToItem(opt, city) } })
    dispatch({ type: 'options_clear' })
  }, [source, voice, state.options, state.trip])

  const orbState: OrbState = useMemo(() => {
    if (source === 'voice') return voice.state
    if (!simRunning) return 'idle'
    return state.transcript.at(-1)?.role === 'assistant' ? 'speaking' : 'listening'
  }, [source, voice.state, simRunning, state.transcript])

  const started = state.trip || state.brief

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l18-6-6 18-3-7-9-5z" /></svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">Cymbal Travels</span>
          {state.modelLabel && (
            <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-medium text-brand">{state.modelLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Toggle value={state.mode} options={[['plan', 'Plan'], ['postsale', 'Post-sale']]}
            onChange={(m) => dispatch({ type: 'mode_switch', payload: { mode: m } })} />
          <Toggle value={source} options={[['sim', 'Sim'], ['voice', 'Voice']]} onChange={(s) => setSource(s as Source)} />
          {running
            ? <button onClick={stop} className="rounded-full bg-event px-4 py-1.5 font-medium text-white transition hover:brightness-95">Stop</button>
            : <button onClick={start} className="rounded-full bg-brand px-4 py-1.5 font-medium text-white transition hover:brightness-95">Start</button>}
        </div>
      </header>

      {voice.error && source === 'voice' && (
        <div className="bg-event/8 px-6 py-2 text-center text-sm text-event">{voice.error}</div>
      )}

      {!started ? (
        <div className="hero-bg flex min-h-[78vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <VoiceOrb state={orbState} onClick={start} size={168} />
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight">Plan your trip, just by talking.</h1>
            <p className="mt-2 text-muted">
              Tell Cymbal Travels where you want to go. It plans flights, hotels and a day-by-day
              itinerary while you watch — then reshapes it on your word.
            </p>
          </div>
        </div>
      ) : (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]" data-testid="workspace">
          <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-line">
            {state.brief && <div className="mb-4"><TripBrief brief={state.brief} /></div>}
            {state.mode === 'plan' && state.options && (
              <div className="mb-4">
                <OptionsCarousel category={state.options.category} options={state.options.options}
                  onSelect={selectOption} onDismiss={() => dispatch({ type: 'options_clear' })} />
              </div>
            )}
            {state.trip
              ? (state.mode === 'postsale'
                ? <PostSaleDashboard trip={state.trip} disruption={state.disruption}
                    supportCards={state.supportCards} lastChangedId={state.lastChangedId}
                    options={state.options} onSelect={selectOption}
                    onDismiss={() => dispatch({ type: 'options_clear' })} />
                : <Itinerary trip={state.trip} lastChangedId={state.lastChangedId} />)
              : <div className="py-16 text-center text-muted">Composing your itinerary…</div>}
          </section>

          <aside className="flex flex-col gap-4">
            {state.trip && (
              <div className="rounded-2xl bg-card p-2 shadow-sm ring-1 ring-line">
                <TripMap cities={state.mapCities.length ? state.mapCities : state.trip.destinations} pins={state.mapPins} />
              </div>
            )}
            <OrchestrationPanel agents={state.agents} grounding={state.grounding} />
            {state.budget && (
              <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line"><BudgetMeter budget={state.budget} /></div>
            )}
            <div className="flex justify-center rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
              <VoiceOrb state={orbState} onClick={running ? stop : start} size={96} />
            </div>
          </aside>
        </main>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-4">
        <TranscriptRail lines={state.transcript} />
        {source === 'voice' && running && (
          <form onSubmit={sendDraft} className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Prefer to type? Enter a request (fallback for voice)…"
              className="flex-1 rounded-full bg-card px-4 py-2 text-sm ring-1 ring-line outline-none focus:ring-brand"
            />
            <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">Send</button>
          </form>
        )}
      </footer>
    </div>
  )
}

function optionToItem(opt: Option, city: string): Item {
  const base = { id: `${opt.id}-sel`, title: opt.name, price_inr: opt.price_inr }
  switch (opt.category) {
    case 'hotel': return { ...base, kind: 'hotel', hotel: opt.name, city, nights: 2, check_in: '', tier: opt.tier }
    case 'flight': return { ...base, kind: 'flight', airline: opt.name, origin: '', destination: city, depart: '', arrive: '', tier: opt.tier }
    case 'event': return { ...base, kind: 'event', city, date: '' }
    case 'transfer': return { ...base, kind: 'transfer', mode: opt.name, origin: '', destination: city }
    default: return { ...base, kind: 'activity', city }
  }
}

function Toggle<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-paper p-0.5 ring-1 ring-line">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 transition ${value === v ? 'bg-card font-medium shadow-sm' : 'text-muted'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}
