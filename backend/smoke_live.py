"""Live smoke test for the Gemini Live voice path (no mic).

Sends a planning utterance as text over a real Live session and reports whether
the model responds (audio/transcript) and fires tool calls. Tries the configured
model, then the 2.5 fallback. Never prints the API key.

Run:  .venv/bin/python smoke_live.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from google import genai  # noqa: E402
from google.genai import types  # noqa: E402

from app.live_config import live_config  # noqa: E402
from app.session import ItinerarySession  # noqa: E402
from app.tools import dispatch  # noqa: E402
from app.voice import live_client  # noqa: E402

UTTERANCE = (
    "Plan a three-day trip to Goa for two people with a budget of fifty thousand "
    "rupees each. Keep it relaxed."
)


async def try_model(model: str) -> dict:
    session = ItinerarySession()
    audio_chunks = 0
    transcripts: list[str] = []
    tool_calls: list[str] = []
    client = live_client()
    async with client.aio.live.connect(model=model, config=live_config(model)) as live:
        await live.send_client_content(
            turns=[types.Content(role="user", parts=[types.Part(text=UTTERANCE)])],
            turn_complete=True,
        )
        async def pump():
            nonlocal audio_chunks
            turns = 0
            while turns < 3:
                async for response in live.receive():
                    tc = getattr(response, "tool_call", None)
                    if tc and getattr(tc, "function_calls", None):
                        responses = []
                        for fc in tc.function_calls:
                            tool_calls.append(fc.name)
                            result, _events = dispatch(fc.name, dict(fc.args or {}), session)
                            responses.append(types.FunctionResponse(
                                id=getattr(fc, "id", None), name=fc.name, response=result))
                        await live.send_tool_response(function_responses=responses)
                        continue
                    if getattr(response, "data", None):
                        audio_chunks += 1
                    sc = getattr(response, "server_content", None)
                    if sc is not None:
                        ot = getattr(sc, "output_transcription", None)
                        if ot and getattr(ot, "text", None):
                            transcripts.append(ot.text)
                        if getattr(sc, "turn_complete", None):
                            turns += 1
                            if tool_calls or audio_chunks:
                                return
        await asyncio.wait_for(pump(), timeout=40)
    return {"model": model, "audio_chunks": audio_chunks,
            "transcript": "".join(transcripts)[:160], "tool_calls": tool_calls}


async def main() -> int:
    for model in ("gemini-3.8-live", "gemini-live-2.5-flash-native-audio"):
        try:
            print(f"→ trying {model} …")
            r = await try_model(model)
            print(f"✅ {model} OK — audio chunks: {r['audio_chunks']}, "
                  f"tool calls: {r['tool_calls']}, transcript: {r['transcript']!r}")
            print(f"\nUse this in .env:  GEMINI_LIVE_MODEL={model}")
            return 0
        except Exception as exc:  # noqa: BLE001
            print(f"❌ {model} failed: {type(exc).__name__}: {str(exc)[:200]}")
    print("\nNo model worked — check the key and model access.")
    return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
