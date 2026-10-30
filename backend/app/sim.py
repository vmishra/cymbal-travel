"""Credential-free sim pipeline: replays the happy-path script through the exact
same dispatch() -> ui-events pipeline the live voice uses. Perfect for a rock-solid
on-stage demo and for driving the frontend e2e tests without a mic or API key.
"""
from __future__ import annotations

import asyncio
from typing import Awaitable, Callable

from .happy_path import CARE_SCRIPT, SIM_SCRIPT
from .session import ItinerarySession
from .tools import dispatch

Send = Callable[[dict], Awaitable[None]]

SCRIPTS = {"plan": SIM_SCRIPT, "postsale": CARE_SCRIPT}


async def run_sim(send: Send, fast: bool = False, scenario: str = "plan") -> None:
    """Replay a scripted scenario, emitting transcript + ui frames on its timeline."""
    script = SCRIPTS.get(scenario, SIM_SCRIPT)
    session = ItinerarySession()
    await send({"kind": "ready", "model_label": "Cymbal Sim"})
    for step in script:
        delay = 0 if fast else step.get("delay_ms", 0) / 1000.0
        if delay:
            await asyncio.sleep(delay)
        if step.get("text"):
            await send({"kind": "transcript", "role": step["speaker"], "data": step["text"]})
        tool = step.get("tool")
        if tool:
            _result, events = dispatch(tool, step.get("args", {}), session)
            for event in events:
                await send({"kind": "ui", "event": event})
                if not fast:
                    # Stream events so the work visibly unfolds, not all at once.
                    et = event.get("type")
                    await asyncio.sleep(0.45 if et in ("thinking_step", "agent_status", "options_show") else 0.18)
    await send({"kind": "turn_complete"})
