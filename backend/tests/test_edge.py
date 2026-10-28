"""Robustness: odd-but-realistic inputs must never raise — they return informative
results and (where relevant) a renderable trip."""
import pytest

from app.session import ItinerarySession
from app.tools import compose_itinerary, dispatch


def _types(ev):
    return [e["type"] for e in ev]


@pytest.mark.parametrize("args", [
    {"origin": "Bangalore", "destinations": "Delhi"},                       # single domestic city, string dest
    {"origin": "Bangalore", "destinations": ["Tokyo"], "nights": 0},        # zero nights
    {"origin": "Mumbai", "destinations": ["Reykjavik", "Vik"], "nights": 99},  # uncurated + huge nights (clamped)
    {"origin": "Delhi", "destinations": ["Paris", "Rome", "Zurich", "Nice", "Milan"], "nights": 10},  # many cities
    {},                                                                      # empty
    {"destinations": ["Goa"], "travellers": 40, "budget_per_person": "fifty thousand"},  # count + text budget
])
def test_set_then_plan_never_raises_and_renders(args):
    s = ItinerarySession()
    r1, e1 = dispatch("set_trip_requirements", args, s)
    assert r1["status"] == "ok" and "trip_brief" in _types(e1)
    r2, e2 = dispatch("plan_trip", {}, s)
    assert r2["status"] == "ok"
    assert "itinerary_set" in _types(e2)
    assert len(s.trip.days) >= 1
    # every day has at least one item; ids are unique (no swap/remove collisions)
    ids = [it.id for d in s.trip.days for it in d.items]
    assert ids and len(ids) == len(set(ids))
    assert len(s.trip.travellers) <= 16 and s.trip.nights <= 30


def test_compose_single_city_has_flight_hotel_activity():
    s = ItinerarySession()
    dispatch("set_trip_requirements", {"origin": "Bangalore", "destinations": ["Delhi"], "nights": 2}, s)
    trip = compose_itinerary(s.trip)
    kinds = {it.kind for d in trip.days for it in d.items}
    assert {"flight", "hotel", "activity"} <= kinds


def test_tickets_train_activities_queries_for_any_city():
    s = ItinerarySession()
    dispatch("set_trip_requirements", {"origin": "Bangalore", "destinations": ["Delhi"], "nights": 2}, s)
    for tool, args in [("get_travel_time", {"origin": "Delhi", "dest": "Agra", "mode": "train"}),
                       ("search_activities", {"city": "Jaipur"}),
                       ("search_flights", {"dest": "Delhi"}),
                       ("get_weather", {"city": "Reykjavik"}),
                       ("get_cost_summary", {})]:
        r, _ev = dispatch(tool, args, s)
        assert r["status"] == "ok", (tool, r)


def test_unknown_city_everything_still_works():
    s = ItinerarySession()
    dispatch("set_trip_requirements", {"origin": "Pune", "destinations": ["Atlantis"], "nights": 3}, s)
    r, ev = dispatch("plan_trip", {}, s)
    assert r["status"] == "ok" and len(s.trip.days) >= 1
