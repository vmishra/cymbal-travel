export type Frame = { kind: string; [k: string]: any }

export interface Socket {
  sendJson(obj: unknown): void
  sendBytes(buf: ArrayBuffer): void
  close(): void
}

export function wsUrl(path: string): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}${path}`
}

export function openSocket(
  path: string,
  onFrame: (f: Frame) => void,
  opts: { onOpen?: () => void; onClose?: () => void } = {},
): Socket {
  const ws = new WebSocket(wsUrl(path))
  ws.binaryType = 'arraybuffer'
  ws.onopen = () => opts.onOpen?.()
  ws.onmessage = (ev) => {
    if (typeof ev.data === 'string') {
      try { onFrame(JSON.parse(ev.data) as Frame) } catch { /* ignore */ }
    }
  }
  ws.onclose = () => opts.onClose?.()
  return {
    sendJson: (o) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(o)) },
    sendBytes: (b) => { if (ws.readyState === WebSocket.OPEN) ws.send(b) },
    close: () => ws.close(),
  }
}
