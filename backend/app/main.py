"""Cymbal Travels — FastAPI backend entrypoint."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load ThinkTravel/.env (two levels up from this file) so running the backend
# directly — not only via start.sh — picks up GOOGLE_API_KEY etc.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from . import images  # noqa: E402
from .sim import run_sim  # noqa: E402
from .voice import voice_ws  # noqa: E402

app = FastAPI(title="Cymbal Travels")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/img/{slug}")
def get_image(slug: str):
    """Serve a cached Nano Banana image; kick off generation on a known miss."""
    if images.has_image(slug):
        return FileResponse(str(images.cache_path(slug)), media_type="image/png",
                            headers={"Cache-Control": "public, max-age=86400"})
    images.ensure_async(slug)
    return Response(status_code=404)


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
