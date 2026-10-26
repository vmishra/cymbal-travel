import { useCallback, useRef, useState } from 'react'
import { openSocket, type Frame, type Socket } from '../net/socket'
import { Pcm24Player, base64ToInt16, downsampleTo16k } from './audio'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Refs {
  sock?: Socket
  micCtx?: AudioContext
  proc?: ScriptProcessorNode
  srcNode?: MediaStreamAudioSourceNode
  stream?: MediaStream
  player?: Pcm24Player
}

/**
 * Manages a real Gemini Live voice session: mic 16 kHz PCM up, model 24 kHz PCM
 * down (gapless), clean barge-in on `interrupted`, and a 4-state machine.
 * Non-audio frames (ui/transcript/ready) are forwarded to `onFrame` so the app
 * reducer can drive the screen.
 */
export function useGeminiLiveVoice(onFrame: (f: Frame) => void) {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const refs = useRef<Refs>({})

  const start = useCallback(async () => {
    setError(null)
    const player = new Pcm24Player()
    const sock = openSocket('/api/ws/voice', (f) => {
      if (f.kind === 'audio' && f.data) {
        setState('speaking')
        player.play(base64ToInt16(f.data))
      } else if (f.kind === 'interrupted') {
        player.flush()
        setState('listening')
      } else if (f.kind === 'turn_complete') {
        setState('listening')
      } else if (f.kind === 'error') {
        setError(f.message ?? 'Voice error')
      } else {
        if (f.kind === 'transcript' && f.role === 'user') setState('thinking')
        onFrame(f)
      }
    }, { onClose: () => setState('idle') })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      const micCtx = new AudioContext()
      const srcNode = micCtx.createMediaStreamSource(stream)
      const proc = micCtx.createScriptProcessor(2048, 1, 1)
      proc.onaudioprocess = (e: AudioProcessingEvent) => {
        const pcm = downsampleTo16k(e.inputBuffer.getChannelData(0), micCtx.sampleRate)
        sock.sendBytes(pcm.buffer)
      }
      srcNode.connect(proc)
      proc.connect(micCtx.destination)
      refs.current = { sock, micCtx, proc, srcNode, stream, player }
      setState('listening')
    } catch {
      setError('Microphone permission is required for voice.')
      sock.close()
      setState('idle')
    }
  }, [onFrame])

  const stop = useCallback(() => {
    const r = refs.current
    try { r.proc?.disconnect() } catch { /* noop */ }
    try { r.srcNode?.disconnect() } catch { /* noop */ }
    r.stream?.getTracks().forEach((t) => t.stop())
    try { r.micCtx?.close() } catch { /* noop */ }
    r.player?.flush()
    r.sock?.sendJson({ kind: 'end' })
    r.sock?.close()
    refs.current = {}
    setState('idle')
  }, [])

  const sendText = useCallback((text: string) => {
    refs.current.sock?.sendJson({ kind: 'text', data: text })
    setState('thinking')
  }, [])

  // Client-initiated tool call on the live session (e.g. tap-to-select), so the
  // backend stays authoritative rather than the UI mutating locally.
  const sendTool = useCallback((name: string, args: Record<string, unknown>) => {
    refs.current.sock?.sendJson({ kind: 'tool', name, args })
  }, [])

  const isLive = () => refs.current.sock != null

  return { state, error, start, stop, sendText, sendTool, isLive }
}
