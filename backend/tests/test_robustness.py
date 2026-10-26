"""Regression guards from the whole-branch review."""
from app.session import ItinerarySession
from app.tools import dispatch

REQ = {
    "title": "Japan", "origin": "Bangalore", "destinations": ["Tokyo"],
    "nights": 3, "start_date": "2026-12-10", "budget_per_person": 200000,
    "travellers": [{"type": "adult"}],
}


def _types(events):
    return [e["type"] for e in events]


def test_edit_on_empty_session_returns_ok_false_not_raise():
    # Finding 1: a planning-edit tool fired before any trip exists must not raise
    # (which would tear down the live voice session) — it returns ok:False + toast.
    s = ItinerarySession()
    for tool in ("swap_hotel", "add_activity", "add_dinner", "show_on_map", "set_budget", "change_dates"):
        result, events = dispatch(tool, {"tier": "premium", "budget_per_person": 1, "start_date": "x"}, s)
        assert result["ok"] is False, tool
        assert "toast" in _types(events), tool


def test_show_options_then_select_adds_one_item():
    # Finding 2: the authoritative backend select path (used by the voice tool
    # channel for tap-to-select) adds exactly one item.
    s = ItinerarySession()
    dispatch("set_trip_requirements", REQ, s)
    dispatch("plan_trip", {}, s)
    _r, opts = dispatch("show_options", {"category": "activity", "city": "Tokyo"}, s)
    opt_id = opts[-1]["payload"]["options"][0]["id"]
    before = sum(len(d.items) for d in s.trip.days)
    result, events = dispatch("select_option", {"option_id": opt_id}, s)
    assert result["ok"] is True
    assert "item_add" in _types(events)
    assert sum(len(d.items) for d in s.trip.days) == before + 1
