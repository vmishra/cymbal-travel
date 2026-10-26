from app.session import ItinerarySession
from app.tools import dispatch


def _types(events):
    return [e["type"] for e in events]


def test_get_trip_status_loads_booked_trip_when_empty():
    s = ItinerarySession()
    result, events = dispatch("get_trip_status", {}, s)
    assert result["ok"] is True
    assert s.trip is not None and len(s.trip.days) > 0
    assert "itinerary_set" in _types(events)


def test_postsale_disruption_then_rebook_heals():
    s = ItinerarySession()
    dispatch("get_trip_status", {}, s)
    _r1, d_events = dispatch("report_disruption", {}, s)
    assert "disruption" in _types(d_events)
    assert "options_show" in _types(d_events)

    _r2, r_events = dispatch("rebook_flight", {"tier": "comfort"}, s)
    assert "item_swap" in _types(r_events)
    assert "support_card" in _types(r_events)


def test_postsale_refund_emits_support_card():
    s = ItinerarySession()
    dispatch("get_trip_status", {}, s)
    # remove the first item by its id
    first_item = s.trip.days[0].items[0]
    _r, events = dispatch("request_refund", {"item_id": first_item.id}, s)
    assert "support_card" in _types(events)
    assert "item_remove" in _types(events)
