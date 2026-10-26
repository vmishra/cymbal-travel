from app.live_config import (
    live_config,
    model_label,
    resolve_model,
    tool_behavior,
)


def test_default_model_is_3_8_on_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_LIVE_MODEL", raising=False)
    assert resolve_model() == "gemini-3.8-live"


def test_model_is_env_overridable(monkeypatch):
    monkeypatch.setenv("GEMINI_LIVE_MODEL", "gemini-2.5-flash-native-audio-latest")
    assert resolve_model() == "gemini-2.5-flash-native-audio-latest"


def test_live_config_omits_affective_and_thinking():
    b = tool_behavior("gemini-3.8-live")
    assert b["affective"] is False
    assert b["thinking"] is False
    assert b["async"] is True


def test_fallback_is_synchronous():
    b = tool_behavior("gemini-live-2.5-flash-native-audio")
    assert b["async"] is False


def test_live_config_includes_tool_declarations():
    cfg = live_config("gemini-3.8-live")
    assert cfg.tools and cfg.tools[0].function_declarations
    names = {fd.name for fd in cfg.tools[0].function_declarations}
    assert "set_trip_requirements" in names
    assert "plan_trip" in names


def test_fallback_model_label_is_generic():
    assert model_label("gemini-live-2.5-flash-native-audio") == "Gemini Live"


def test_3_8_label_is_branded():
    assert model_label("gemini-3.8-live") == "Gemini 3.8 Live"
