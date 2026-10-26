const TIPS: [string, string][] = [
  ['🎟️', 'Reserve timed-entry tickets for popular attractions online — slots sell out weeks ahead.'],
  ['🚆', 'Grab a prepaid transit card on arrival for tap-and-go metros and trains.'],
  ['👟', 'Expect lots of walking — pack supportive shoes (and a light stroller for young kids).'],
  ['🛂', 'Finish digital immigration / customs forms online before you fly to breeze through the airport.'],
]

export function TipsPanel() {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-line">
      <div className="mb-2 text-sm font-semibold">✈️ Good to know</div>
      <div className="space-y-2">
        {TIPS.map(([icon, tip]) => (
          <div key={tip} className="flex gap-2 text-[13px] text-muted">
            <span className="shrink-0">{icon}</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
