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
MODEL_2_5 = "gemini-2.5-flash-native-audio-latest"
# Default to the proven 2.5 native-audio model (a proven reference) for the
# most reliable Hinglish + female-voice experience. Set GEMINI_LIVE_MODEL=gemini-3.8-live
# to use 3.8 (now configured per best practices).
DEFAULT_MODEL = MODEL_2_5
VOICE_NAME = "Aoede"  # female HD voice. Never a male voice (Charon/Puck/Fenrir) or Kore/Sulafat.
LANGUAGE_CODE = "en-IN"  # Indian English hint to curb accent/language drift.

# Domain words to bias speech recognition (3.8 custom_vocabulary).
CUSTOM_VOCAB = ["Cymbal Travels", "Maya", "Hinglish", "Tokyo", "Hakone", "Kyoto",
                "Bangalore", "bullet train", "ryokan", "onsen", "itinerary"]

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


def _non_blocking():
    b = getattr(types, "Behavior", None)
    return getattr(b, "NON_BLOCKING", None) if b is not None else None


def _function_declarations(model: str) -> list[types.FunctionDeclaration]:
    # Gemini 3.8 Live requires every tool to be NON_BLOCKING (async). The 2.5
    # fallback keeps the default (blocking) behaviour.
    behavior = _non_blocking() if tool_behavior(model)["async"] else None
    decls = []
    for d in TOOL_DECLARATIONS:
        kwargs = dict(
            name=d["name"],
            description=d.get("description", ""),
            parameters=_to_schema(d["parameters"]),
        )
        if behavior is not None:
            kwargs["behavior"] = behavior
        try:
            decls.append(types.FunctionDeclaration(**kwargs))
        except Exception:
            kwargs.pop("behavior", None)
            decls.append(types.FunctionDeclaration(**kwargs))
    return decls


def _speech_config() -> types.SpeechConfig:
    # Native-audio models reject an explicit language_code (server error), so accent /
    # language is controlled entirely via the system instruction. Only the voice is pinned.
    return types.SpeechConfig(
        voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME))
    )


def _input_transcription(model: str) -> types.AudioTranscriptionConfig:
    # custom_vocabulary biases domain words (supported on 3.8 Live).
    if is_38(model):
        try:
            return types.AudioTranscriptionConfig(custom_vocabulary=CUSTOM_VOCAB)
        except Exception:
            pass
    return types.AudioTranscriptionConfig()


def _compression():
    # Keep long sessions alive (native audio ~25 tokens/sec); evict old context.
    try:
        return types.ContextWindowCompressionConfig(
            trigger_tokens=25600,
            sliding_window=types.SlidingWindow(target_tokens=8000),
        )
    except Exception:
        return None


def live_config(model: str | None = None) -> types.LiveConnectConfig:
    model = model or resolve_model()
    tool = types.Tool(function_declarations=_function_declarations(model))
    kwargs = dict(
        response_modalities=["AUDIO"],
        speech_config=_speech_config(),
        system_instruction=types.Content(parts=[types.Part(text=build_system_instruction())]),
        tools=[tool],
        input_audio_transcription=_input_transcription(model),
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
    comp = _compression()
    if comp is not None:
        kwargs["context_window_compression"] = comp
    try:
        return types.LiveConnectConfig(**kwargs)
    except Exception:
        kwargs.pop("context_window_compression", None)
        return types.LiveConnectConfig(**kwargs)
