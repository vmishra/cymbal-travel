"""Gemini Live voice WebSocket proxy.

Browser streams 16 kHz PCM up and plays 24 kHz PCM down; this server holds the
Live session, forwards audio/transcripts, runs the tool-call loop through
dispatch() (emitting UI events on the same socket), and signals barge-in.

The live loop requires a real GOOGLE_API_KEY and is validated in the voice spike
(plan Task 7, Step 6). The config/label logic it depends on is unit-tested.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os

from fastapi import WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from .live_config import live_config, model_label, resolve_model
from .session import ItinerarySession
from .tools import dispatch

logger = logging.getLogger("cymbal.voice")


def _api_key() -> str | None:
    return (
        os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_CLOUD_API_KEY")
    )


def live_client() -> genai.Client:
    key = _api_key()
    if not key:
        raise RuntimeError("no_api_key")
    return genai.Client(api_key=key, http_options=types.HttpOptions(api_version="v1alpha"))


async def voice_ws(ws: WebSocket) -> None:
    await ws.accept()
    model = resolve_model()
    try:
        client = live_client()
    except RuntimeError:
        await ws.send_json({"kind": "error", "message": "Voice needs GOOGLE_API_KEY — use Sim mode."})
        await ws.close()
        return

    session = ItinerarySession()
    stop = asyncio.Event()
    try:
        async with client.aio.live.connect(model=model, config=live_config(model)) as live:
            await ws.send_json({"kind": "ready", "model_label": model_label(model)})
            await asyncio.gather(
                _upstream(ws, live, stop),
                _downstream(ws, live, session, stop),
            )
    except WebSocketDisconnect:
        pass
    except Exception:  # keep the server alive; never leak internals to the client
        logger.exception("voice session error")
        try:
            await ws.send_json({"kind": "error", "message": "Voice session failed — try again or use Sim mode."})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass


async def _upstream(ws: WebSocket, live, stop: asyncio.Event) -> None:
    try:
        while not stop.is_set():
            msg = await ws.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("bytes") is not None:
                await live.send_realtime_input(
                    audio=types.Blob(data=msg["bytes"], mime_type="audio/pcm;rate=16000")
                )
            elif msg.get("text"):
                data = json.loads(msg["text"])
                kind = data.get("kind")
                if kind == "text" and data.get("data"):
                    await live.send_client_content(
                        turns=[types.Content(role="user", parts=[types.Part(text=data["data"])])],
                        turn_complete=True,
                    )
                elif kind == "end":
                    break
    finally:
        stop.set()


async def _downstream(ws: WebSocket, live, session: ItinerarySession, stop: asyncio.Event) -> None:
    try:
        while not stop.is_set():
            async for response in live.receive():
                tc = getattr(response, "tool_call", None)
                if tc and getattr(tc, "function_calls", None):
                    responses = []
                    for fc in tc.function_calls:
                        result, events = dispatch(fc.name, dict(fc.args or {}), session)
                        for event in events:
                            await ws.send_json({"kind": "ui", "event": event})
                        responses.append(types.FunctionResponse(
                            id=getattr(fc, "id", None), name=fc.name, response=result))
                    await live.send_tool_response(function_responses=responses)
                    continue

                sc = getattr(response, "server_content", None)
                if sc is not None:
                    if getattr(sc, "interrupted", None):
                        await ws.send_json({"kind": "interrupted"})
                    it = getattr(sc, "input_transcription", None)
                    if it and getattr(it, "text", None):
                        await ws.send_json({"kind": "transcript", "role": "user", "data": it.text})
                    ot = getattr(sc, "output_transcription", None)
                    if ot and getattr(ot, "text", None):
                        await ws.send_json({"kind": "transcript", "role": "assistant", "data": ot.text})

                if getattr(response, "data", None):
                    await ws.send_json({
                        "kind": "audio",
                        "data": base64.b64encode(response.data).decode(),
                        "mime": "audio/pcm;rate=24000",
                    })

                if sc is not None and getattr(sc, "turn_complete", None):
                    await ws.send_json({"kind": "turn_complete"})
    finally:
        stop.set()
