// Offline "photo" stand-ins: deterministic travel-mood gradients keyed by a seed,
// so every place card looks intentional without any network image.

const SCENES: string[] = [
  'linear-gradient(135deg,#8ec5fc 0%,#4a90e2 100%)',   // sky
  'linear-gradient(135deg,#f6b17a 0%,#e4573c 100%)',   // sunset
  'linear-gradient(135deg,#43cea2 0%,#1a7a5e 100%)',   // forest
  'linear-gradient(135deg,#2b5876 0%,#4e4376 100%)',   // city night
  'linear-gradient(135deg,#f5d6a8 0%,#d99a4e 100%)',   // sand
  'linear-gradient(135deg,#a8c0ff 0%,#3f2b96 100%)',   // dusk
  'linear-gradient(135deg,#ff9a9e 0%,#c86b98 100%)',   // blossom
  'linear-gradient(135deg,#30cfd0 0%,#187e8a 100%)',   // ocean
]

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

export function sceneFor(seed: string): string {
  return SCENES[hash(seed) % SCENES.length]
}

// A pseudo "popularity" score (like TREK's 🔥), stable per place.
export function hotScore(seed: string): string {
  return (7 + (hash(seed) % 29) / 10).toFixed(1) // 7.0–9.8
}

const MODES: [string, string][] = [['🚶', 'Walk'], ['🚇', 'Metro'], ['🚕', 'Taxi'], ['🚌', 'Bus'], ['🚆', 'Local train']]

// Deterministic, plausible hop between two places so the UI always shows HOW you
// get from one spot to the next (even if the model doesn't say it).
export function transitBetween(a: string, b: string): { icon: string; label: string; mins: number } {
  const h = hash(a + '→' + b)
  const [icon, label] = MODES[h % MODES.length]
  return { icon, label, mins: 6 + (h % 24) }
}
