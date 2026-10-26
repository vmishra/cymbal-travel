// Audio helpers for the Gemini Live loop: mic 16 kHz PCM up, model 24 kHz PCM
// down, with a gapless scheduler that supports barge-in (flush).

export function clampInt16(v: number): number {
  const s = Math.max(-1, Math.min(1, v))
  return Math.round(s < 0 ? s * 0x8000 : s * 0x7fff)
}

export function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) out[i] = clampInt16(input[i])
  return out
}

/** Downsample mono Float32 audio at `inputRate` to 16 kHz Int16 PCM. */
export function downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === 16000) return floatToInt16(input)
  const ratio = inputRate / 16000
  const outLen = Math.floor(input.length / ratio)
  const out = new Int16Array(outLen)
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.floor((i + 1) * ratio)
    let sum = 0
    let count = 0
    for (let j = start; j < end && j < input.length; j++) {
      sum += input[j]
      count++
    }
    out[i] = clampInt16(count ? sum / count : input[start] || 0)
  }
  return out
}

type CtxFactory = () => AudioContext

/** Schedules 24 kHz PCM chunks back-to-back; flush() enables clean barge-in. */
export class Pcm24Player {
  ctx: AudioContext | null = null
  cursor = 0
  sources: AudioBufferSourceNode[] = []
  private factory: CtxFactory

  constructor(factory?: CtxFactory) {
    this.factory = factory ?? (() => new AudioContext({ sampleRate: 24000 }))
  }

  play(int16: Int16Array): void {
    if (!this.ctx) {
      this.ctx = this.factory()
      this.cursor = this.ctx.currentTime
    }
    const f32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000
    const buf = this.ctx.createBuffer(1, f32.length, 24000)
    buf.getChannelData(0).set(f32)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.connect(this.ctx.destination)
    const startAt = Math.max(this.ctx.currentTime, this.cursor)
    src.start(startAt)
    this.cursor = startAt + buf.duration
    this.sources.push(src)
    src.onended = () => {
      this.sources = this.sources.filter((s) => s !== src)
    }
  }

  /** Stop and drop everything scheduled (barge-in). */
  flush(): void {
    for (const s of this.sources) {
      try { s.stop() } catch { /* already stopped */ }
    }
    this.sources = []
    if (this.ctx) this.cursor = this.ctx.currentTime
  }
}

/** Decode a base64 24k PCM payload into Int16. */
export function base64ToInt16(b64: string): Int16Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}
