import { useCallback, useReducer, useRef, useState } from 'react'
import { initialState, reducer } from './state/reducer'
import { openSocket, type Frame, type Socket } from './net/socket'

type Source = 'sim' | 'voice'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [source, setSource] = useState<Source>('sim')
  const [running, setRunning] = useState(false)
  const sockRef = useRef<Socket | null>(null)

  const handleFrame = useCallback((f: Frame) => {
    if (f.kind === 'ui' && f.event) dispatch(f.event)
    else if (f.kind === 'transcript') dispatch({ type: 'transcript', payload: f })
    else if (f.kind === 'ready') dispatch({ type: 'ready', payload: f })
    else if (f.kind === 'turn_complete') setRunning(false)
  }, [])

  const start = useCallback(() => {
    sockRef.current?.close()
    const path = source === 'sim' ? '/api/ws/sim?fast=0' : '/api/ws/voice'
    setRunning(true)
    sockRef.current = openSocket(path, handleFrame, {
      onOpen: () => { if (source === 'sim') sockRef.current?.sendJson({ kind: 'start' }) },
      onClose: () => setRunning(false),
    })
  }, [source, handleFrame])

  const stop = useCallback(() => {
    sockRef.current?.close()
    sockRef.current = null
    setRunning(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#202124]">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-tight">Cymbal Travels</span>
          {state.modelLabel && (
            <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1a73e8]">
              {state.modelLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Toggle value={state.mode} options={[['plan', 'Plan'], ['postsale', 'Post-sale']]}
            onChange={(m) => dispatch({ type: 'mode_switch', payload: { mode: m } })} />
          <Toggle value={source} options={[['sim', 'Sim'], ['voice', 'Voice']]} onChange={(s) => setSource(s as Source)} />
          {running
            ? <button onClick={stop} className="rounded-full bg-[#ea4335] px-4 py-1.5 font-medium text-white">Stop</button>
            : <button onClick={start} className="rounded-full bg-[#1a73e8] px-4 py-1.5 font-medium text-white">Start</button>}
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]" data-testid="workspace">
        <section data-testid="itinerary" className="rounded-2xl bg-white p-4 shadow-sm">
          {state.brief && (
            <div className="mb-3 text-sm text-black/60">
              {state.brief.title} · {state.brief.nights} nights · {state.brief.travellers.length} travellers
            </div>
          )}
          {state.trip
            ? state.trip.days.map((d) => (
              <div key={d.index} className="mb-2 border-b border-black/5 pb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-black/40">Day {d.index + 1} · {d.city}</div>
                {d.items.map((it) => (
                  <div key={it.id} data-item-id={it.id} className="py-0.5 text-sm">
                    {it.title} <span className="text-black/40">₹{it.price_inr.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            ))
            : <div className="py-16 text-center text-black/40">Press Start and describe your trip.</div>}
        </section>

        <aside data-testid="orchestration" className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">Under the hood</div>
          {Object.entries(state.agents).map(([name, status]) => (
            <div key={name} data-agent={name} data-status={status} className="flex justify-between py-0.5 text-sm">
              <span>{name}</span><span className="text-black/40">{status}</span>
            </div>
          ))}
          {state.budget && (
            <div data-testid="budget" className="mt-3 text-sm">
              ₹{state.budget.per_person_total.toLocaleString('en-IN')} / ₹{state.budget.budget_per_person.toLocaleString('en-IN')} pp
              {state.budget.over && <span className="ml-1 text-[#ea4335]">over</span>}
            </div>
          )}
        </aside>
      </main>

      <footer className="px-4 pb-4">
        <div data-testid="transcript" className="max-h-28 overflow-auto rounded-xl bg-white p-3 text-sm shadow-sm">
          {state.transcript.slice(-4).map((l) => (
            <div key={l.id}><span className="font-medium">{l.role}:</span> {l.data}</div>
          ))}
        </div>
      </footer>
    </div>
  )
}

function Toggle<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-black/5 p-0.5">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 ${value === v ? 'bg-white shadow-sm font-medium' : 'text-black/50'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}
