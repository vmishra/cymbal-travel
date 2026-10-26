"""Voice-callable tool layer.

`dispatch(name, args, session)` runs the tool against the authoritative
ItinerarySession and returns `(result_for_model, ui_events)`. This module has NO
google-genai import on purpose — it stays pure and unit-testable. The voice layer
(voice.py) converts TOOL_DECLARATIONS into SDK function declarations.
"""
from __future__ import annotations

from datetime import date, timedelta

from . import ui_events as ev
from .domain import Activity, Event, Flight, HotelStay, Option, Transfer, Trip
from .mock_services import get_activities, get_events, get_flights, get_hotels
from .seed_data import CITY_COORDS
from .session import ItineraryError, ItinerarySession
from .ui_events import AGENTS, GROUNDING

TRANSFER_PRICE = 9000  # per-person bullet-train leg


# --------------------------------------------------------------------------- #
# Itinerary composition
# --------------------------------------------------------------------------- #
def _date_plus(start: str, days: int) -> str:
    try:
        y, m, d = map(int, start.split("-"))
        return (date(y, m, d) + timedelta(days=days)).isoformat()
    except Exception:
        return start


def _pick(options: list[Option], tier: str) -> Option:
    return next((o for o in options if o.tier == tier), options[-1])


def _activity_item(opt: Option, city: str, day_index: int, time: str | None = None) -> Activity:
    return Activity(id=f"{opt.id}-d{day_index}", title=opt.name, price_inr=opt.price_inr,
                    city=city, time=time)


def _event_item(opt: Option, city: str, day_index: int, when: str) -> Event:
    return Event(id=f"{opt.id}-d{day_index}", title=opt.name, price_inr=opt.price_inr,
                 city=city, date=when)


def compose_itinerary(trip: Trip) -> Trip:
    cities = trip.destinations or ["Tokyo"]
    pax = max(1, len(trip.travellers))
    total_nights = trip.nights or len(cities) * 2

    base = max(1, total_nights // len(cities))
    nights_per = [base] * len(cities)
    rem = total_nights - base * len(cities)
    k = 0
    while rem > 0:
        nights_per[k % len(cities)] += 1
        rem -= 1
        k += 1

    from .domain import Day

    days: list[Day] = []
    day_index = 0
    cur_date = trip.start_date
    event_added = False

    # Arrival flight into the first city.
    fopt = _pick(get_flights(trip.origin, cities[0], trip.start_date, pax), "comfort")
    arrival_flight = Flight(
        id=fopt.id, title=fopt.name, price_inr=fopt.price_inr,
        airline=fopt.name.split(" ")[0], origin=trip.origin, destination=cities[0],
        depart="08:00", arrive="18:30", tier=fopt.tier,
    )

    for ci, city in enumerate(cities):
        hopt = _pick(get_hotels(city, nights_per[ci], pax), "comfort")
        hotel = HotelStay(
            id=hopt.id, title=hopt.name, price_inr=hopt.price_inr, hotel=hopt.name,
            city=city, nights=nights_per[ci], check_in=cur_date, tier=hopt.tier,
        )
        acts = get_activities(city)

        first_items: list = []
        if ci == 0:
            first_items.append(arrival_flight)
        else:
            first_items.append(Transfer(
                id=f"transfer-{ci}", title=f"Bullet train to {city}", price_inr=TRANSFER_PRICE,
                mode="Bullet train", origin=cities[ci - 1], destination=city,
            ))
        first_items.append(hotel)
        first_items.append(_activity_item(acts[0], city, day_index))
        days.append(Day(index=day_index, city=city, items=first_items))
        day_index += 1

        for n in range(1, nights_per[ci]):
            items: list = [_activity_item(acts[n % len(acts)], city, day_index)]
            if not event_added:
                eopt = _pick(get_events(city), "comfort")
                items.append(_event_item(eopt, city, day_index, cur_date))
                event_added = True
            days.append(Day(index=day_index, city=city, items=items))
            day_index += 1

        cur_date = _date_plus(cur_date, nights_per[ci])

    return trip.model_copy(update={"days": days})


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _find_item(trip: Trip, item_id: str):
    for day in trip.days:
        for it in day.items:
            if it.id == item_id:
                return it
    return None


def _first_flight(trip: Trip) -> Flight | None:
    return next((it for day in trip.days for it in day.items if isinstance(it, Flight)), None)


def _map_pins(trip: Trip) -> list[dict]:
    cities = [trip.origin] + list(trip.destinations)
    pins = []
    for c in cities:
        if c in CITY_COORDS:
            lat, lng = CITY_COORDS[c]
            pins.append({"city": c, "lat": lat, "lng": lng})
    return pins


def _last_day_index(trip: Trip, city: str | None) -> int:
    if city:
        matches = [d.index for d in trip.days if d.city == city]
        if matches:
            return matches[-1]
    return trip.days[-1].index if trip.days else 0


def _set_last_options(session: ItinerarySession, options: list[Option]) -> None:
    session.last_options = {o.id: o for o in options}  # dynamic cache


def _get_last_option(session: ItinerarySession, option_id: str) -> Option | None:
    return getattr(session, "last_options", {}).get(option_id)


# --------------------------------------------------------------------------- #
# dispatch
# --------------------------------------------------------------------------- #
def dispatch(name: str, args: dict, session: ItinerarySession) -> tuple[dict, list[dict]]:
    args = args or {}
    try:
        handler = _HANDLERS.get(name)
        if handler is None:
            return {"ok": False, "error": f"unknown_tool:{name}"}, []
        return handler(args, session)
    except ItineraryError as e:
        return {"ok": False, "reason": e.reason}, [ev.toast(e.reason, "warn")]


def _h_set_requirements(args, session):
    trip = session.set_requirements(args)
    return {"ok": True, "requirements": args}, [ev.trip_brief(trip)]


def _h_plan_trip(args, session):
    if session.trip is None:
        return {"ok": False, "reason": "no requirements yet"}, [ev.toast("Tell me your trip first", "warn")]
    events = [ev.agent_status(a, "running") for a in AGENTS]
    events += [ev.grounding_ping(g) for g in GROUNDING]
    trip = compose_itinerary(session.trip)
    session.apply_plan(trip)
    events += [ev.agent_status(a, "done") for a in AGENTS]
    events.append(ev.itinerary_set(trip))
    events.append(ev.budget_update(trip))
    events.append(ev.map_update(list(trip.destinations), _map_pins(trip)))
    return {"ok": True, "summary": f"{trip.nights}-night {'/'.join(trip.destinations)} trip"}, events


def _h_show_options(args, session):
    category = args.get("category", "hotel")
    city = args.get("city") or (session.trip.destinations[0] if session.trip and session.trip.destinations else "Tokyo")
    if category == "flight":
        opts = get_flights(session.trip.origin if session.trip else "Bangalore", city, "", len(session.trip.travellers) if session.trip else 2)
    elif category == "activity":
        opts = get_activities(city)
    elif category == "event":
        opts = get_events(city)
    else:
        category = "hotel"
        opts = get_hotels(city, 3, len(session.trip.travellers) if session.trip else 2)
    _set_last_options(session, opts)
    return {"ok": True, "options": [o.model_dump() for o in opts]}, [ev.options_show(category, opts)]


def _h_select_option(args, session):
    opt = _get_last_option(session, args.get("option_id", ""))
    if opt is None:
        return {"ok": False, "reason": "unknown option"}, [ev.toast("I lost track of that option", "warn")]
    day_index = int(args.get("day_index", _last_day_index(session.trip, None)))
    city = session.trip.days[day_index].city if session.trip.days else "Tokyo"
    item = _item_from_option(opt, city, day_index)
    session.add_item(day_index, item)
    return {"ok": True, "item": item.model_dump()}, [ev.option_selected(item), ev.item_add(day_index, item), ev.budget_update(session.trip)]


def _item_from_option(opt: Option, city: str, day_index: int):
    if opt.category == "hotel":
        return HotelStay(id=f"{opt.id}-sel", title=opt.name, price_inr=opt.price_inr,
                         hotel=opt.name, city=city, nights=2, check_in="", tier=opt.tier)
    if opt.category == "flight":
        return Flight(id=f"{opt.id}-sel", title=opt.name, price_inr=opt.price_inr,
                      airline=opt.name.split(" ")[0], origin="", destination=city,
                      depart="", arrive="", tier=opt.tier)
    if opt.category == "event":
        return _event_item(opt, city, day_index, "")
    return _activity_item(opt, city, day_index)


def _h_swap_hotel(args, session):
    tier = args.get("tier", "premium")
    item_id = args.get("item_id")
    target = None
    if item_id:
        target = _find_item(session.trip, item_id)
    if target is None:
        city = args.get("city")
        stays = session.trip.stays
        target = next((s for s in stays if s.city == city), None) if city else (stays[0] if stays else None)
    if target is None:
        return {"ok": False, "reason": "no hotel to swap"}, [ev.toast("No hotel to swap yet", "warn")]
    opts = get_hotels(target.city, target.nights, max(1, len(session.trip.travellers)))
    chosen = _pick(opts, tier)
    session.swap_item(target.id, chosen)
    new_item = _find_item(session.trip, target.id)
    return {"ok": True, "hotel": chosen.name}, [ev.item_swap(new_item), ev.budget_update(session.trip)]


def _h_add_activity(args, session):
    city = args.get("city") or (session.trip.destinations[0] if session.trip.destinations else "Tokyo")
    day_index = int(args.get("day_index", _last_day_index(session.trip, city)))
    name = args.get("name")
    if name:
        item = Activity(id=f"act-{abs(hash(name)) % 10**8}", title=name, price_inr=int(args.get("price_inr", 3000)), city=city)
    else:
        opts = get_activities(city)
        chosen = _pick(opts, args.get("tier", "comfort"))
        item = _activity_item(chosen, city, day_index)
        item.id = f"{chosen.id}-add{day_index}"
    session.add_item(day_index, item)
    return {"ok": True, "activity": item.title}, [ev.item_add(day_index, item), ev.budget_update(session.trip)]


def _h_add_dinner(args, session):
    city = args.get("city") or (session.trip.destinations[0] if session.trip.destinations else "Tokyo")
    day_index = int(args.get("day_index", _last_day_index(session.trip, city)))
    where = args.get("name", "a local favourite")
    item = Activity(id=f"dinner-{day_index}-{abs(hash(where)) % 10**6}", title=f"Dinner at {where}",
                    price_inr=int(args.get("price_inr", 2500)), city=city, time="evening")
    session.add_item(day_index, item)
    return {"ok": True, "dinner": item.title}, [ev.item_add(day_index, item), ev.budget_update(session.trip)]


def _h_remove_item(args, session):
    session.remove_item(args.get("item_id", ""))
    return {"ok": True}, [ev.item_remove(args.get("item_id", "")), ev.budget_update(session.trip)]


def _h_reorder_day(args, session):
    di = int(args.get("day_index", 0))
    ids = args.get("item_ids", [])
    session.reorder_day(di, ids)
    return {"ok": True}, [ev.item_reorder(di, ids)]


def _h_change_dates(args, session):
    session.trip.start_date = args.get("start_date", session.trip.start_date)
    return {"ok": True}, [ev.itinerary_set(session.trip), ev.trip_brief(session.trip)]


def _h_show_on_map(args, session):
    return {"ok": True}, [ev.map_update(list(session.trip.destinations), _map_pins(session.trip))]


def _h_set_budget(args, session):
    session.trip.budget_per_person = int(args.get("budget_per_person", session.trip.budget_per_person))
    return {"ok": True}, [ev.budget_update(session.trip)]


def _h_switch_mode(args, session):
    mode = args.get("mode", "plan")
    return {"ok": True, "mode": mode}, [ev.mode_switch(mode)]


def _h_get_trip_status(args, session):
    if session.trip is None:
        return {"ok": False, "reason": "no trip"}, [ev.toast("No booked trip", "warn")]
    return {"ok": True}, [ev.itinerary_set(session.trip), ev.budget_update(session.trip)]


def _h_report_disruption(args, session):
    flight = _find_item(session.trip, args["flight_id"]) if args.get("flight_id") else _first_flight(session.trip)
    fid = flight.id if flight else None
    dest = flight.destination if flight else (session.trip.destinations[0] if session.trip.destinations else "Tokyo")
    opts = get_flights(session.trip.origin, dest, session.trip.start_date, max(1, len(session.trip.travellers)))
    _set_last_options(session, opts)
    events = [
        ev.disruption(f"Your flight to {dest} is delayed. Let's find alternatives.", fid),
        ev.agent_status("Flights", "running"),
        ev.options_show("flight", opts),
        ev.agent_status("Flights", "done"),
    ]
    return {"ok": True, "flight_id": fid}, events


def _h_rebook_flight(args, session):
    flight = _find_item(session.trip, args["flight_id"]) if args.get("flight_id") else _first_flight(session.trip)
    if flight is None:
        return {"ok": False, "reason": "no flight"}, [ev.toast("No flight to rebook", "warn")]
    opt = _get_last_option(session, args.get("option_id", "")) or _pick(
        get_flights(session.trip.origin, flight.destination, session.trip.start_date, max(1, len(session.trip.travellers))),
        args.get("tier", "comfort"),
    )
    session.rebook_flight(flight.id, opt)
    new_item = _find_item(session.trip, flight.id)
    return {"ok": True, "flight": opt.name}, [
        ev.item_swap(new_item), ev.budget_update(session.trip),
        ev.support_card("Flight rebooked", f"You're now on {opt.name}.", "success"),
    ]


def _h_extend_trip(args, session):
    city = args.get("city") or (session.trip.destinations[-1] if session.trip.destinations else "Tokyo")
    session.add_night(city)
    return {"ok": True, "city": city}, [
        ev.itinerary_set(session.trip), ev.budget_update(session.trip),
        ev.support_card("Trip extended", f"Added a night in {city}.", "success"),
    ]


def _h_request_refund(args, session):
    item_id = args.get("item_id", "")
    item = _find_item(session.trip, item_id)
    title = item.title if item else "item"
    session.refund_item(item_id)
    return {"ok": True}, [
        ev.item_remove(item_id), ev.budget_update(session.trip),
        ev.support_card("Refund requested", f"We've started a refund for {title}.", "success"),
    ]


def _h_add_night(args, session):
    city = args.get("city") or (session.trip.destinations[-1] if session.trip.destinations else "Tokyo")
    session.add_night(city)
    return {"ok": True, "city": city}, [ev.itinerary_set(session.trip), ev.budget_update(session.trip)]


_HANDLERS = {
    "set_trip_requirements": _h_set_requirements,
    "plan_trip": _h_plan_trip,
    "show_options": _h_show_options,
    "select_option": _h_select_option,
    "swap_hotel": _h_swap_hotel,
    "add_activity": _h_add_activity,
    "add_dinner": _h_add_dinner,
    "remove_item": _h_remove_item,
    "reorder_day": _h_reorder_day,
    "change_dates": _h_change_dates,
    "show_on_map": _h_show_on_map,
    "set_budget": _h_set_budget,
    "switch_mode": _h_switch_mode,
    "get_trip_status": _h_get_trip_status,
    "report_disruption": _h_report_disruption,
    "rebook_flight": _h_rebook_flight,
    "extend_trip": _h_extend_trip,
    "request_refund": _h_request_refund,
    "add_night": _h_add_night,
}


# --------------------------------------------------------------------------- #
# Tool declarations (SDK-agnostic dicts)
# --------------------------------------------------------------------------- #
def _str(desc):
    return {"type": "string", "description": desc}


TOOL_DECLARATIONS: list[dict] = [
    {"name": "set_trip_requirements",
     "description": "Capture the traveller's structured trip requirements from what they said.",
     "parameters": {"type": "object", "properties": {
         "title": _str("short trip title"), "origin": _str("origin city"),
         "destinations": {"type": "array", "items": {"type": "string"}, "description": "cities to visit"},
         "nights": {"type": "integer"}, "start_date": _str("YYYY-MM-DD if known"),
         "budget_per_person": {"type": "integer", "description": "INR per person"},
         "travellers": {"type": "array", "items": {"type": "object"}},
         "pace": _str("leisure|balanced|packed"),
         "must_dos": {"type": "array", "items": {"type": "string"}},
     }, "required": ["origin", "destinations"]}},
    {"name": "plan_trip", "description": "Run the agentic orchestration and compose the itinerary.",
     "parameters": {"type": "object", "properties": {}}},
    {"name": "show_options", "description": "Show 4-5 options for a category.",
     "parameters": {"type": "object", "properties": {
         "category": _str("flight|hotel|activity|event"), "city": _str("city"), "tier": _str("optional tier")},
         "required": ["category"]}},
    {"name": "select_option", "description": "Select a previously shown option and add it to the trip.",
     "parameters": {"type": "object", "properties": {"option_id": _str("id"), "day_index": {"type": "integer"}}, "required": ["option_id"]}},
    {"name": "swap_hotel", "description": "Swap a hotel for a different tier/property.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "item_id": _str("hotel id"), "tier": _str("value|comfort|premium|luxury")}}},
    {"name": "add_activity", "description": "Add an activity to a day.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "name": _str("activity name"), "day_index": {"type": "integer"}, "tier": _str("tier")}}},
    {"name": "add_dinner", "description": "Add a dinner reservation to a day.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "name": _str("place name"), "day_index": {"type": "integer"}}}},
    {"name": "remove_item", "description": "Remove an itinerary item by id.",
     "parameters": {"type": "object", "properties": {"item_id": _str("id")}, "required": ["item_id"]}},
    {"name": "reorder_day", "description": "Reorder the items within a day.",
     "parameters": {"type": "object", "properties": {"day_index": {"type": "integer"}, "item_ids": {"type": "array", "items": {"type": "string"}}}, "required": ["day_index", "item_ids"]}},
    {"name": "change_dates", "description": "Change the trip start date.",
     "parameters": {"type": "object", "properties": {"start_date": _str("YYYY-MM-DD")}, "required": ["start_date"]}},
    {"name": "show_on_map", "description": "Focus the map on the trip or a city.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
    {"name": "set_budget", "description": "Set the per-person budget in INR.",
     "parameters": {"type": "object", "properties": {"budget_per_person": {"type": "integer"}}, "required": ["budget_per_person"]}},
    {"name": "switch_mode", "description": "Switch between 'plan' and 'postsale' modes.",
     "parameters": {"type": "object", "properties": {"mode": _str("plan|postsale")}, "required": ["mode"]}},
    {"name": "get_trip_status", "description": "Show the current booked trip (post-sale).",
     "parameters": {"type": "object", "properties": {}}},
    {"name": "report_disruption", "description": "Report a flight disruption and fetch alternatives.",
     "parameters": {"type": "object", "properties": {"flight_id": _str("id"), "city": _str("city")}}},
    {"name": "rebook_flight", "description": "Rebook onto an alternative flight.",
     "parameters": {"type": "object", "properties": {"flight_id": _str("id"), "option_id": _str("id"), "tier": _str("tier")}}},
    {"name": "extend_trip", "description": "Add a night to the trip in a city.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
    {"name": "request_refund", "description": "Request a refund for an item.",
     "parameters": {"type": "object", "properties": {"item_id": _str("id")}, "required": ["item_id"]}},
    {"name": "add_night", "description": "Add a night in a city during planning.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
]
