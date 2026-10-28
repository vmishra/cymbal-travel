import { useEffect, useRef, useState } from 'react'

// Smoothly animates a number from its previous value to the new one (ease-out),
// so costs/totals "tick up" rather than snapping — a small but delightful touch.
export function useCountUp(value: number, ms = 700): number {
  const [n, setN] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const a = from.current
    const b = value
    if (a === b) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(a + (b - a) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = b
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return n
}
