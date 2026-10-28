import { useCallback, useMemo, useReducer, useRef, useState, type FormEvent } from 'react'
import { initialState, reducer } from './state/reducer'
import { openSocket, type Frame, type Socket } from './net/socket'
import { useGeminiLiveVoice } from './voice/useGeminiLiveVoice'
import { AssistantPane } from './components/AssistantPane'
import { ItineraryPane } from './components/ItineraryPane'
import { MapCanvas } from './components/MapCanvas'
import { GoogleTripMap } from './components/GoogleTripMap'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
import { DisruptionBanner } from './components/DisruptionBanner'
import { VoiceOrb, type OrbState } from './components/VoiceOrb'
import { Icon } from './components/Icon'
import { ArchitecturePage } from './components/ArchitecturePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { Item, Option } from './state/types'

type Source = 'sim' | 'voice'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [source, setSource] = useState<Source>('sim')
  const [view, setView] = useState<'app' | 'arch'>('app')
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
    sockRef.current?.close(); sockRef.current = null; setSimRunning(false)
  }, [source, voice])

  const sendDraft = useCallback((e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim(); if (!text) return
    dispatch({ type: 'transcript', payload: { role: 'user', data: text } })
    voice.sendText(text); setDraft('')
  }, [draft, voice])

  const selectOption = useCallback((id: string) => {
    if (source === 'voice') { voice.sendTool('select_option', { option_id: id }); dispatch({ type: 'options_clear' }); return }
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
    <div className="flex h-[100dvh] flex-col bg-paper text-ink">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-card/80 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white"><Icon name="flight" size={15} strokeWidth={2} /></span>
          <span className="text-lg font-semibold tracking-tight">Cymbal Travels</span>
          {state.modelLabel && <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-medium text-brand">{state.modelLabel}</span>}
        </div>
        <Toggle value={view} options={[['app', 'Planner'], ['arch', 'Architecture']]} onChange={(v) => setView(v as 'app' | 'arch')} />
        <div className="flex items-center gap-2 text-sm">
          <Toggle value={state.mode} options={[['plan', 'Plan'], ['postsale', 'Post-sale']]} onChange={(m) => dispatch({ type: 'mode_switch', payload: { mode: m } })} />
          <Toggle value={source} options={[['sim', 'Sim'], ['voice', 'Voice']]} onChange={(s) => setSource(s as Source)} />
          {running
            ? <button onClick={stop} className="rounded-full bg-event px-4 py-1.5 font-medium text-white transition hover:brightness-95">Stop</button>
            : <button onClick={start} className="rounded-full bg-brand px-4 py-1.5 font-medium text-white transition hover:brightness-95">Start</button>}
        </div>
      </header>

      {voice.error && source === 'voice' && <div className="shrink-0 bg-event/8 px-6 py-2 text-center text-sm text-event">{voice.error}</div>}

      {view === 'arch' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ErrorBoundary><ArchitecturePage /></ErrorBoundary>
        </div>
      ) : !started ? (
        <div className="hero-bg flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <VoiceOrb state={orbState} onClick={start} size={168} />
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight">Plan your trip, just by talking.</h1>
            <p className="mt-2 text-muted">Tell Isha where you'd like to go — she finds flights, hotels, activities and weather, and builds your day-by-day trip while you watch.</p>
          </div>
        </div>
      ) : (
        <ErrorBoundary>
        <main data-testid="workspace" className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[360px_1fr_400px]">
          <div className="flex min-h-0 flex-col gap-2 rounded-2xl bg-card/60 p-3 ring-1 ring-line">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AssistantPane state={state} orbState={orbState} running={running}
                onSelect={selectOption} onDismissOptions={() => dispatch({ type: 'options_clear' })}
                onOrbClick={running ? stop : start} />
            </div>
            {source === 'voice' && running && (
              <form onSubmit={sendDraft} className="flex shrink-0 gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type instead of talking…"
                  className="flex-1 rounded-full bg-paper px-4 py-2 text-sm ring-1 ring-line outline-none focus:ring-brand" />
                <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">Send</button>
              </form>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
            {state.disruption && state.mode === 'postsale' && <DisruptionBanner message={state.disruption.message} />}
            {state.trip
              ? <ItineraryPane trip={state.trip} weather={state.weather} cost={state.cost} packing={state.packing} lastChangedId={state.lastChangedId} />
              : <div className="grid flex-1 place-items-center text-muted">Composing your itinerary…</div>}
          </div>

          <div className="hidden min-h-0 lg:block">
            {MAPS_KEY
              ? <GoogleTripMap apiKey={MAPS_KEY} trip={state.trip} weather={state.weather} cities={state.mapCities} />
              : <MapCanvas trip={state.trip} weather={state.weather} cities={state.mapCities} />}
          </div>
        </main>
        </ErrorBoundary>
      )}
    </div>
  )
}

function optionToItem(opt: Option, city: string): Item {
  const base = { id: `${opt.id}-sel`, title: opt.name, price_inr: opt.price_inr, description: opt.description }
  switch (opt.category) {
    case 'hotel': return { ...base, kind: 'hotel', hotel: opt.name, city, nights: 2, check_in: '', tier: opt.tier }
    case 'flight': return { ...base, kind: 'flight', airline: opt.name, origin: '', destination: city, depart: '', arrive: '', tier: opt.tier }
    case 'event': return { ...base, kind: 'event', city, date: '', slot: 'evening' }
    default: return { ...base, kind: 'activity', city, slot: 'afternoon' }
  }
}

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-paper p-0.5 ring-1 ring-line">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-full px-3 py-1 transition ${value === v ? 'bg-card font-medium shadow-sm' : 'text-muted'}`}>{label}</button>
      ))}
    </div>
  )
}
