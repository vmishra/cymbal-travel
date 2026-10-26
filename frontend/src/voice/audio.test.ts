import { describe, expect, it } from 'vitest'
import { downsampleTo16k, Pcm24Player } from './audio'

describe('audio', () => {
  it('downsampleTo16k halves length from 32k and returns Int16', () => {
    const out = downsampleTo16k(new Float32Array(32000), 32000)
    expect(out).toBeInstanceOf(Int16Array)
    expect(out.length).toBe(16000)
  })

  it('downsampleTo16k is identity-length at 16k', () => {
    const out = downsampleTo16k(new Float32Array(1600), 16000)
    expect(out.length).toBe(1600)
  })

  it('flush() stops and clears scheduled sources', () => {
    const stopped: unknown[] = []
    const fakeCtx = {
      currentTime: 0,
      destination: {},
      createBuffer: (_c: number, len: number) => ({ duration: len / 24000, getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => {
        const s: any = { buffer: null, connect() {}, start() {}, stop() { stopped.push(s) }, onended: null }
        return s
      },
    }
    const player = new Pcm24Player(() => fakeCtx as unknown as AudioContext)
    player.play(new Int16Array(240))
    player.play(new Int16Array(240))
    expect(player.sources.length).toBe(2)
    player.flush()
    expect(stopped.length).toBe(2)
    expect(player.sources.length).toBe(0)
  })
})
