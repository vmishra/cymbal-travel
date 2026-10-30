import { useEffect, useRef, type ReactNode } from 'react'
import type { AppState, Flight, HotelStay, PendingChange, Transfer } from '../state/types'
import { rupees } from '../theme'
import { Icon } from './Icon'
import { VoiceOrb, type OrbState } from './VoiceOrb'

// "Cymbal Care" — the post-sale support experience. A deliberately calmer, two-column
// support desk (conversation + live case panel), distinct from the planner's three panes.
// Shares the same design tokens, but reads as a structured case file, not a card grid.

const KIND_ICON: Record<PendingChange['kind'], 'flight' | 'hotel' | 'activity' | 'event' | 'transfer' | 'check'> = {
  flight: 'flight', hotel: 'hotel', detail: 'check', activity: 'activity', refund: 'event',
}
const KIND_COLOR: Record<PendingChange['kind'], string> = {
  flight: '#1a73e8', hotel: '#34a853', detail: '#9334e6', activity: '#f9ab00', refund: '#ea4335',
}

export function PostSaleView({ state, orbState, running, onOrbClick, voiceInput }: {
  state: AppState
  orbState: OrbState
  running: boolean
  onOrbClick: () => void
  voiceInput?: ReactNode
}) {
  const ctx = state.customer
  return (
    <div data-testid="postsale" className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_420px]">
      {/* LEFT — the support conversation */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-line">
        <CareHeader connected={running || !!ctx} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {ctx ? <Conversation state={state} /> : <OpeningCase state={state} running={running} />}
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-line px-5 py-3">
          <VoiceOrb state={orbState} onClick={onOrbClick} size={running ? 76 : 104} />
          {voiceInput}
        </div>
      </section>

      {/* RIGHT — the live case panel */}
      <aside className="min-h-0 overflow-y-auto">
        {ctx ? <CasePanel state={state} /> : <CaseSkeleton />}
      </aside>
    </div>
  )
}

function CareHeader({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand"><Icon name="mic" size={16} /></span>
        <div>
          <div className="text-[15px] font-semibold leading-none">Cymbal Care</div>
          <div className="mt-1 text-[11px] text-muted">Post-sale support · Isha</div>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-hotel blink' : 'bg-line'}`} />
        {connected ? 'Secure line · connected' : 'Ready'}
      </span>
    </div>
  )
}

function OpeningCase({ state, running }: { state: AppState; running: boolean }) {
  if (!running && state.thinking.length === 0) {
    return (
      <div className="grid h-full place-items-center text-center">
        <div className="max-w-xs">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Icon name="mic" size={26} /></span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Cymbal Care</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Press Start to connect a mid-trip customer and pull up their live booking.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="grid h-full place-items-center">
      <div className="w-full max-w-sm">
        <div className="mb-3 text-center text-[13px] font-medium text-muted">Opening your case…</div>
        <div className="space-y-2">
          {state.thinking.map((t) => (
            <div key={t.label} className="anim-slidein flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line">
              <span className={`grid h-5 w-5 place-items-center rounded-full ${t.status === 'done' ? 'bg-hotel text-white' : 'bg-brand/15 text-brand'}`}>
                {t.status === 'done' ? <Icon name="check" size={12} /> : <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />}
              </span>
              <span className="text-[13px]">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Conversation({ state }: { state: AppState }) {
  const lines = state.transcript
  const endRef = useRef<HTMLDivElement>(null)
  const custInitials = state.customer ? initials(state.customer.customer.name) : 'You'
  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }) }, [lines.length])
  return (
    <div className="space-y-3">
      {lines.map((l) => {
        const agent = l.role !== 'user'
        return (
          <div key={l.id} className={`anim-cardin flex gap-2.5 ${agent ? '' : 'flex-row-reverse'}`}>
            {agent
              ? <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white"><Icon name="mic" size={13} /></span>
              : <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white">{custInitials}</span>}
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed ring-1 ${
              agent ? 'rounded-tl-sm bg-paper ring-line' : 'rounded-tr-sm bg-brand text-white ring-brand'}`}>
              {l.data}
            </div>
          </div>
        )
      })}
      {lines.length === 0 && <div className="py-10 text-center text-[13px] text-muted">Connecting to the customer…</div>}
      <div ref={endRef} />
    </div>
  )
}

function CasePanel({ state }: { state: AppState }) {
  const ctx = state.customer!
  const c = ctx.customer
  const trip = state.trip
  const totalDays = trip?.days.length ?? ctx.total_days
  const currentDay = Math.min(c.current_day_index, totalDays - 1)
  const items = trip?.days.flatMap((d) => d.items) ?? []
  const hotel = items.find((it): it is HotelStay => it.kind === 'hotel' && it.city === ctx.current_city)
  const flight = items.find((it): it is Flight => it.kind === 'flight')
  const train = items.find((it): it is Transfer => it.kind === 'transfer')

  return (
    <div className="space-y-3">
      {/* customer identity */}
      <div data-testid="care-customer" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-transfer text-[15px] font-semibold text-white">
              {initials(c.name)}
            </span>
            <div>
              <div className="text-[15px] font-semibold leading-tight">{c.name}</div>
              <div className="text-[12px] text-muted">{c.party}</div>
            </div>
          </div>
          {c.loyalty && <span className="rounded-full bg-activity/15 px-2 py-0.5 text-[11px] font-medium text-[#b06f00]">{c.loyalty}</span>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <Field label="Booking" value={c.booking_ref} />
          <Field label="Phone" value={c.phone ?? '—'} />
          <Field label="Seats" value={c.seats ?? '—'} />
          <Field label="Meal" value={c.meal ?? '—'} />
        </div>
      </div>

      {/* where they are now */}
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[13px] font-semibold">Where they are now</div>
          <span className="rounded-full bg-sky px-2 py-0.5 text-[11px] font-medium text-brand">Day {currentDay + 1} of {totalDays}</span>
        </div>
        <DayRail total={totalDays} current={currentDay} />
        <div className="mt-3 space-y-2">
          <Leg color="#34a853" icon="hotel" title={hotel ? hotel.hotel : `Staying in ${ctx.current_city}`} sub={`${ctx.current_city} · current stay`} live />
          {flight && <Leg color="#1a73e8" icon="flight" title={flight.title} sub={`${flight.origin || trip?.origin} → ${flight.destination} · ${flight.duration || ''}`} />}
          {train && <Leg color="#9334e6" icon="transfer" title={train.title} sub={`${train.origin} → ${train.destination}`} />}
        </div>
      </div>

      {/* pending changes ledger */}
      <PendingChanges changes={state.pendingChanges} />

      {/* payment */}
      <PaymentBlock state={state} />
    </div>
  )
}

function PendingChanges({ changes }: { changes: PendingChange[] }) {
  const billable = changes.filter((c) => c.amount_inr > 0)
  const total = billable.reduce((s, c) => s + c.amount_inr, 0)
  return (
    <div data-testid="pending-changes" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
      <div className="mb-2.5 text-[13px] font-semibold">Pending changes</div>
      {changes.length === 0 ? (
        <div className="rounded-xl bg-paper px-3 py-4 text-center text-[12px] text-muted">No changes yet — listening for the request.</div>
      ) : (
        <div className="space-y-1.5">
          {changes.map((c) => (
            <div key={c.id} className="anim-cardin flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2 ring-1 ring-line">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ color: KIND_COLOR[c.kind], background: KIND_COLOR[c.kind] + '18' }}>
                <Icon name={KIND_ICON[c.kind]} size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{c.label}</div>
                {c.detail && <div className="truncate text-[11px] text-muted">{c.detail}</div>}
              </div>
              <div className="shrink-0 text-right">
                {c.amount_inr > 0 && <div className="tabular text-[13px] font-semibold">+{rupees(c.amount_inr)}</div>}
                <StatusPill status={c.status} />
              </div>
            </div>
          ))}
          {total > 0 && (
            <div className="flex items-center justify-between px-1 pt-1.5 text-[13px]">
              <span className="font-medium text-muted">Amount due</span>
              <span className="tabular text-[15px] font-semibold">{rupees(total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PaymentBlock({ state }: { state: AppState }) {
  const pay = state.payment
  const c = state.customer!.customer
  const billable = state.pendingChanges.filter((x) => x.amount_inr > 0)
  const due = billable.reduce((s, x) => s + x.amount_inr, 0)
  if (!pay && due === 0) return null

  const paid = pay?.status === 'paid'
  const requested = pay?.status === 'requested'
  return (
    <div data-testid="payment" className={`rounded-2xl p-4 shadow-sm ring-1 transition ${
      paid ? 'bg-hotel/8 ring-hotel/40' : requested ? 'bg-brand/6 ring-brand/40' : 'bg-card ring-line'}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[13px] font-semibold">Payment</div>
        {paid
          ? <span className="inline-flex items-center gap-1 rounded-full bg-hotel px-2 py-0.5 text-[11px] font-medium text-white"><Icon name="check" size={11} /> Paid</span>
          : requested
            ? <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white blink">Awaiting authorization</span>
            : <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-muted ring-1 ring-line">On file</span>}
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line">
        <span className="grid h-9 w-12 place-items-center rounded-md bg-gradient-to-br from-ink to-muted text-[10px] font-bold tracking-wide text-white">
          {(pay?.brand ?? c.payment.brand).toUpperCase()}
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-medium">•••• •••• •••• {pay?.last4 ?? c.payment.last4}</div>
          <div className="text-[11px] text-muted">{c.payment.label ?? 'Authorized card on file'}</div>
        </div>
        <div className="text-right">
          <div className="tabular text-[15px] font-semibold">{rupees(pay?.amount_inr ?? due)}</div>
          <div className="text-[11px] text-muted">{paid ? 'charged' : 'due'}</div>
        </div>
      </div>
      {paid && pay?.ref && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-hotel/10 px-3 py-2 text-[12px]">
          <span className="text-muted">Confirmation</span>
          <span className="tabular font-semibold tracking-wide text-[#1e7e34]">{pay.ref}</span>
        </div>
      )}
    </div>
  )
}

// --- small pieces ---
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper px-2.5 py-1.5 ring-1 ring-line">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="truncate text-[12.5px] font-medium">{value}</div>
    </div>
  )
}

function Leg({ color, icon, title, sub, live }: { color: string; icon: 'hotel' | 'flight' | 'transfer'; title: string; sub: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color, background: color + '18' }}><Icon name={icon} size={15} /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{title}</div>
        <div className="truncate text-[11px] text-muted">{sub}</div>
      </div>
      {live && <span className="inline-flex items-center gap-1 rounded-full bg-hotel/12 px-2 py-0.5 text-[10px] font-medium text-[#1e7e34]"><span className="h-1.5 w-1.5 rounded-full bg-hotel blink" /> here now</span>}
    </div>
  )
}

function DayRail({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className={`h-1.5 w-full rounded-full ${i < current ? 'bg-brand/40' : i === current ? 'bg-brand' : 'bg-line'}`} />
          <span className={`text-[9px] ${i === current ? 'font-semibold text-brand' : 'text-muted'}`}>{i + 1}</span>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: PendingChange['status'] }) {
  return status === 'confirmed'
    ? <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1e7e34]"><Icon name="check" size={10} /> confirmed</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#b06f00]"><span className="h-1.5 w-1.5 rounded-full bg-activity blink" /> proposed</span>
}

function CaseSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
          <div className="h-3 w-24 animate-pulse rounded bg-line" />
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-paper" />
        </div>
      ))}
    </div>
  )
}

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}
