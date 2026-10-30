"""Post-sale 'Cymbal Care' flow: open a case → reschedule → confirm details →
extend hotel → request payment → confirm payment (books end-to-end)."""
from app.postsale_seed import FLIGHT_CHANGE_FEE
from app.session import ItinerarySession
from app.tools import dispatch


def _types(events):
    return [e["type"] for e in events]


def _by_type(events, t):
    return [e for e in events if e["type"] == t]


def test_open_care_loads_booking_and_emits_customer_context():
    s = ItinerarySession()
    result, events = dispatch("open_care", {}, s)
    assert result["ok"] is True
    assert s.trip is not None and len(s.trip.days) > 0
    assert "itinerary_set" in _types(events)
    ctx = _by_type(events, "customer_context")
    assert ctx, "open_care must emit customer_context"
    payload = ctx[0]["payload"]
    assert payload["customer"]["name"] == "Vikas Mishra"
    assert payload["current_city"] == "Tokyo"   # Day 3 of the booked trip


def test_reschedule_flight_proposes_a_pending_flight_change():
    s = ItinerarySession()
    dispatch("open_care", {}, s)
    _r, events = dispatch("reschedule_flight", {"when": "next day"}, s)
    pcs = _by_type(events, "pending_change")
    assert pcs, "reschedule must propose a pending change"
    pc = pcs[0]["payload"]
    assert pc["kind"] == "flight"
    assert pc["status"] == "proposed"
    assert pc["amount_inr"] == FLIGHT_CHANGE_FEE


def test_confirm_change_detail_confirms_seats_and_meal():
    s = ItinerarySession()
    dispatch("open_care", {}, s)
    _r, events = dispatch("confirm_change_detail", {}, s)
    pc = _by_type(events, "pending_change")[0]["payload"]
    assert pc["kind"] == "detail"
    assert pc["status"] == "confirmed"


def test_extend_hotel_adds_a_night_and_bills_it():
    s = ItinerarySession()
    dispatch("open_care", {}, s)
    before = len(s.trip.days)
    _r, events = dispatch("extend_hotel", {"city": "Tokyo"}, s)
    assert len(s.trip.days) == before + 1
    assert "itinerary_set" in _types(events)
    pc = _by_type(events, "pending_change")[0]["payload"]
    assert pc["kind"] == "hotel" and pc["status"] == "confirmed"
    assert pc["amount_inr"] > 0


def test_payment_request_then_confirm_books_end_to_end():
    s = ItinerarySession()
    dispatch("open_care", {}, s)
    dispatch("reschedule_flight", {"when": "next day"}, s)
    dispatch("extend_hotel", {"city": "Tokyo"}, s)

    _r, pe = dispatch("request_payment", {}, s)
    req = _by_type(pe, "payment_request")[0]["payload"]
    assert req["amount_inr"] >= FLIGHT_CHANGE_FEE
    assert req["last4"] == "4242"

    r2, ce = dispatch("confirm_payment", {}, s)
    conf = _by_type(ce, "payment_confirmed")[0]["payload"]
    assert conf["ref"].startswith("CYMBAL-")
    assert "item_swap" in _types(ce)      # flight actually rebooked
    assert "support_card" in _types(ce)
    assert r2["status"] == "ok"
