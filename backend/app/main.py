"""Cymbal Travels — FastAPI backend entrypoint."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from .sim import run_sim
from .voice import voice_ws

app = FastAPI(title="Cymbal Travels")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.websocket("/api/ws/voice")
async def voice_endpoint(ws: WebSocket) -> None:
    await voice_ws(ws)


@app.websocket("/api/ws/sim")
async def sim_ws(ws: WebSocket) -> None:
    await ws.accept()
    fast = ws.query_params.get("fast") == "1"
    try:
        msg = await ws.receive_json()
        if msg.get("kind") == "start":
            await run_sim(ws.send_json, fast=fast)
    except WebSocketDisconnect:
        return
    finally:
        try:
            await ws.close()
        except RuntimeError:
            pass


# Static mount for the built frontend (only when it exists, so tests/dev work).
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="static")


def run() -> None:
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8470")))


if __name__ == "__main__":
    run()
