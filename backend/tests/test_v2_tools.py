from app.mock_services import get_packing_list, get_travel_time, get_weather
from app.session import ItinerarySession
from app.tools import dispatch

REQ = {
    "title": "Japan", "origin": "Bangalore", "destinations": ["Tokyo", "Kyoto"],
    "nights": 6, "start_date": "2026-12-10", "budget_per_person": 200000,
    "travellers": [{"type": "adult"}, {"type": "adult"}, {"type": "child", "age": 8}],
}


def _types(events):
    return [e["type"] for e in events]


def _planned():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    dispatch("plan_trip", {}, s)
    return s


def test_weather_service_is_deterministic_and_rich():
    a = get_weather("Tokyo", "December")
    b = get_weather("Tokyo", "December")
    assert a == b
    assert "condition" in a and "high_c" in a and a["icon"]


def test_travel_time_and_packing():
    tt = get_travel_time("Bangalore", "Tokyo", "flight")
    assert tt["duration"] and tt["mode"] == "flight"
    p = get_packing_list("Kyoto", "December")
    assert len(p["items"]) >= 4


def test_search_flights_emits_options_and_work():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    result, events = dispatch("search_flights", {"dest": "Tokyo"}, s)
    assert result["ok"] and len(result["options"]) >= 4
    t = _types(events)
    assert "options_show" in t and "agent_status" in t and "thinking_step" in t


def test_plan_trip_emits_weather_cost_and_thinking():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    _r, events = dispatch("plan_trip", {}, s)
    t = _types(events)
    assert "thinking_step" in t
    assert "weather_set" in t
    assert "cost_summary" in t
    assert "packing_set" in t
    # activities carry a time-of-day slot
    slots = [it.slot for d in s.trip.days for it in d.items if it.kind in ("activity", "event")]
    assert any(sl in ("morning", "afternoon", "evening") for sl in slots)


def test_get_cost_summary_total_and_category():
    s = _planned()
    result, events = dispatch("get_cost_summary", {}, s)
    assert result["ok"] and result["cost"]["per_person"] > 0
    assert "cost_summary" in _types(events)
    r2, _ = dispatch("get_cost_summary", {"category": "flights"}, s)
    assert r2["cost"]["category"] == "flights"


def test_get_weather_tool_emits_weather_set():
    s = _planned()
    result, events = dispatch("get_weather", {"city": "Kyoto"}, s)
    assert result["ok"] and result["weather"]["city"] == "Kyoto"
    assert "weather_set" in _types(events)
