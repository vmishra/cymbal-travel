"""Gemini Live configuration — dual model (3.8 primary, 2.5 fallback).

The decision logic (model resolution, label, tool behaviour) is pure and unit
tested. `live_config()` builds the SDK config object including tool declarations.
"""
from __future__ import annotations

import os

from google.genai import types

from .system_prompt import build_system_instruction
from .tools import TOOL_DECLARATIONS

MODEL_3_8 = "gemini-3.8-live"
MODEL_2_5 = "gemini-live-2.5-flash-native-audio"
DEFAULT_MODEL = MODEL_3_8
VOICE_NAME = "Aoede"

_JSON_TO_TYPE = {
    "object": types.Type.OBJECT,
    "string": types.Type.STRING,
    "integer": types.Type.INTEGER,
    "number": types.Type.NUMBER,
    "boolean": types.Type.BOOLEAN,
    "array": types.Type.ARRAY,
}


def resolve_model() -> str:
    return os.environ.get("GEMINI_LIVE_MODEL", DEFAULT_MODEL)


def is_38(model: str) -> bool:
    return "3.8" in model


def model_label(model: str) -> str:
    """Branded only for 3.8; the fallback is narrated generically (never '3.8')."""
    return "Gemini 3.8 Live" if is_38(model) else "Gemini Live"


def tool_behavior(model: str) -> dict:
    """3.8 uses async (NON_BLOCKING) tools, no affective dialog, no thinking.
    The 2.5 fallback uses synchronous tool responses."""
    return {"async": is_38(model), "affective": False, "thinking": False}


def _to_schema(d: dict) -> types.Schema:
    t = _JSON_TO_TYPE.get(d.get("type", "string"), types.Type.STRING)
    schema = types.Schema(type=t)
    if "description" in d:
        schema.description = d["description"]
    if t == types.Type.OBJECT:
        props = {k: _to_schema(v) for k, v in d.get("properties", {}).items()}
        schema.properties = props or None
        if d.get("required"):
            schema.required = d["required"]
    if t == types.Type.ARRAY and "items" in d:
        schema.items = _to_schema(d["items"])
    return schema


def _function_declarations(model: str) -> list[types.FunctionDeclaration]:
    async_tools = tool_behavior(model)["async"]
    decls = []
    for d in TOOL_DECLARATIONS:
        fd = types.FunctionDeclaration(
            name=d["name"],
            description=d.get("description", ""),
            parameters=_to_schema(d["parameters"]),
        )
        if async_tools:
            # Best-effort: enable non-blocking behaviour when the SDK supports it.
            try:
                fd.behavior = types.Behavior.NON_BLOCKING  # type: ignore[attr-defined]
            except Exception:
                pass
        decls.append(fd)
    return decls


def live_config(model: str | None = None) -> types.LiveConnectConfig:
    model = model or resolve_model()
    tool = types.Tool(function_declarations=_function_declarations(model))
    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
            )
        ),
        system_instruction=types.Content(parts=[types.Part(text=build_system_instruction())]),
        tools=[tool],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        realtime_input_config=types.RealtimeInputConfig(
            automatic_activity_detection=types.AutomaticActivityDetection(
                disabled=False,
                start_of_speech_sensitivity=types.StartSensitivity.START_SENSITIVITY_LOW,
                end_of_speech_sensitivity=types.EndSensitivity.END_SENSITIVITY_HIGH,
                prefix_padding_ms=200,
                silence_duration_ms=500,
            )
        ),
    )
