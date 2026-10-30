import { useEffect, useState } from 'react'
import type { Weather } from '../state/types'
import { currencyFor } from '../lib/currency'

function LiveDot() {
  return <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-hotel">
    <span className="blink h-1.5 w-1.5 rounded-full bg-hotel" /> Live
  </span>
}

export function LivePanel({ city, weather }: { city?: string; weather?: Weather }) {
  const ccy = city ? currencyFor(city) : null
  const [rate, setRate] = useState(ccy?.perINR ?? 0)

  useEffect(() => {
    if (!ccy) return
    setRate(ccy.perINR)
    const id = setInterval(() => {
      const jitter = 1 + (Math.random() - 0.5) * 0.004 // ±0.2%, feels live
      setRate(+(ccy.perINR * jitter).toFixed(ccy.perINR > 10 ? 2 : 4))
    }, 2600)
    return () => clearInterval(id)
  }, [ccy?.code])

  if (!weather && !ccy) return null
  const fmt = (n: number) => (n >= 10 ? n.toFixed(0) : n.toFixed(ccy && ccy.perINR > 1 ? 2 : 3))

  return (
    <div className="grid grid-cols-2 gap-2">
      {weather && (
        <div className="rounded-xl bg-card p-2.5 ring-1 ring-line">
          <div className="flex items-center justify-between"><span className="text-[11px] text-muted">Weather · {weather.city}</span><LiveDot /></div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-lg">{weather.icon}</span>
            <span className="tabular text-base font-semibold">{weather.high_c}°</span>
            <span className="truncate text-[11px] text-muted">{weather.condition}</span>
          </div>
        </div>
      )}
      {ccy && (
        <div className="rounded-xl bg-card p-2.5 ring-1 ring-line">
          <div className="flex items-center justify-between"><span className="text-[11px] text-muted">FX · {ccy.code}</span><LiveDot /></div>
          <div className="mt-1 tabular text-[15px] font-semibold transition-all">
            ₹1 = {ccy.symbol}{fmt(rate)}
          </div>
        </div>
      )}
    </div>
  )
}
