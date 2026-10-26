from app.session import ItinerarySession
from app.tools import TOOL_DECLARATIONS, dispatch


def _event_types(events):
    return [e["type"] for e in events]


REQ = {
    "title": "Japan", "origin": "Bangalore", "destinations": ["Tokyo", "Hakone", "Kyoto"],
    "nights": 7, "start_date": "2026-12-10", "budget_per_person": 200000,
    "travellers": [{"type": "adult"}, {"type": "adult"}, {"type": "child", "age": 8}],
    "must_dos": ["Mount Fuji", "Bullet train"],
}


def test_tool_declarations_are_sdk_agnostic_dicts():
    assert isinstance(TOOL_DECLARATIONS, list) and TOOL_DECLARATIONS
    names = {d["name"] for d in TOOL_DECLARATIONS}
    assert {"set_trip_requirements", "plan_trip", "swap_hotel", "remove_item"} <= names


def test_dispatch_set_requirements_emits_trip_brief():
    s = ItinerarySession()
    result, events = dispatch("set_trip_requirements", REQ, s)
    assert result["ok"] is True
    assert "trip_brief" in _event_types(events)
    assert s.trip.destinations == ["Tokyo", "Hakone", "Kyoto"]


def test_dispatch_plan_trip_emits_agent_status_and_grounding_and_itinerary():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    result, events = dispatch("plan_trip", {}, s)
    types = _event_types(events)
    assert result["ok"] is True
    assert "agent_status" in types
    assert "grounding_ping" in types
    assert "itinerary_set" in types
    assert "budget_update" in types
    # all four agents are represented
    agents = {e["payload"]["agent"] for e in events if e["type"] == "agent_status"}
    assert {"Flights", "Hotels", "Itinerary", "Events"} <= agents
    assert len(s.trip.days) > 0


def test_dispatch_swap_hotel_emits_item_swap_and_budget():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    dispatch("plan_trip", {}, s)
    result, events = dispatch("swap_hotel", {"tier": "luxury"}, s)
    types = _event_types(events)
    assert result["ok"] is True
    assert "item_swap" in types
    assert "budget_update" in types


def test_dispatch_remove_missing_item_returns_ok_false_and_toast():
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    dispatch("plan_trip", {}, s)
    result, events = dispatch("remove_item", {"item_id": "nope-404"}, s)
    assert result["ok"] is False
    assert "toast" in _event_types(events)


def test_dispatch_unknown_tool_returns_ok_false():
    s = ItinerarySession()
    result, events = dispatch("make_coffee", {}, s)
    assert result["ok"] is False
    assert events == []
