"""Cymbal Travels — FastAPI backend entrypoint."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Cymbal Travels")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


# Static mount for the built frontend (only when it exists, so tests/dev work).
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="static")


def run() -> None:
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8470")))


if __name__ == "__main__":
    run()
