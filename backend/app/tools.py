"""Voice-callable tool layer.

`dispatch(name, args, session)` runs the tool against the authoritative
ItinerarySession and returns `(result_for_model, ui_events)`. This module has NO
google-genai import on purpose — it stays pure and unit-testable. The voice layer
(voice.py) converts TOOL_DECLARATIONS into SDK function declarations.
"""
from __future__ import annotations

from datetime import date, timedelta

from . import ui_events as ev
from .domain import (
    Activity,
    Event,
    Flight,
    HotelStay,
    Option,
    Transfer,
    Trip,
    cost_breakdown,
    per_person_total,
)
from . import images
from .mock_services import (
    get_activities,
    get_events,
    get_flights,
    get_hotels,
    get_packing_list,
    get_travel_time,
    get_weather,
)
from .postsale_seed import BOOKED_REQUIREMENTS
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


_MONTHS = ["January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"]


def _month_of(start: str) -> str:
    try:
        return _MONTHS[int(start.split("-")[1]) - 1]
    except Exception:
        return "your dates"


def _pick(options: list[Option], tier: str) -> Option:
    return next((o for o in options if o.tier == tier), options[-1])


def _activity_item(opt: Option, city: str, day_index: int, slot: str = "afternoon") -> Activity:
    return Activity(id=f"{opt.id}-d{day_index}-{slot}", title=opt.name, price_inr=opt.price_inr,
                    city=city, time=slot, slot=slot, duration=opt.duration,
                    description=opt.description, image_url=opt.image_url)


def _event_item(opt: Option, city: str, day_index: int, when: str = "") -> Event:
    return Event(id=f"{opt.id}-d{day_index}-ev", title=opt.name, price_inr=opt.price_inr,
                 city=city, date=when, slot="evening", description=opt.description, image_url=opt.image_url)


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
        id=fopt.id, title=fopt.name, price_inr=fopt.price_inr, description=fopt.description,
        airline=fopt.name.split(" ")[0], origin=trip.origin, destination=cities[0],
        depart="08:00", arrive="18:30", tier=fopt.tier, duration=fopt.duration,
        stops=fopt.highlights[0] if fopt.highlights else "Non-stop",
    )

    for ci, city in enumerate(cities):
        hopt = _pick(get_hotels(city, nights_per[ci], pax), "comfort")
        hotel = HotelStay(
            id=hopt.id, title=hopt.name, price_inr=hopt.price_inr, hotel=hopt.name,
            city=city, nights=nights_per[ci], check_in=cur_date, tier=hopt.tier,
            description=hopt.description, image_url=hopt.image_url,
        )
        acts = get_activities(city)
        n_acts = len(acts)

        first_items: list = []
        if ci == 0:
            first_items.append(arrival_flight)
        else:
            tt = get_travel_time(cities[ci - 1], city, "train")
            first_items.append(Transfer(
                id=f"transfer-{ci}", title=f"Train to {city}", price_inr=TRANSFER_PRICE,
                mode="High-speed train", origin=cities[ci - 1], destination=city,
                description=tt["note"],
            ))
        first_items.append(hotel)
        first_items.append(_activity_item(acts[0], city, day_index, "afternoon"))
        days.append(Day(index=day_index, city=city, items=first_items))
        day_index += 1

        for n in range(1, nights_per[ci]):
            items: list = [
                _activity_item(acts[(2 * n) % n_acts], city, day_index, "morning"),
                _activity_item(acts[(2 * n + 1) % n_acts], city, day_index, "afternoon"),
            ]
            if not event_added:
                items.append(_event_item(_pick(get_events(city), "comfort"), city, day_index, cur_date))
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


def _ensure_postsale_trip(session: ItinerarySession) -> None:
    """Post-sale works standalone: load a pre-booked trip if none is active."""
    if session.trip is None:
        session.set_requirements(BOOKED_REQUIREMENTS)
        session.apply_plan(compose_itinerary(session.trip))


def _set_last_options(session: ItinerarySession, options: list[Option]) -> None:
    session.last_options = {o.id: o for o in options}  # dynamic cache


def _get_last_option(session: ItinerarySession, option_id: str) -> Option | None:
    return getattr(session, "last_options", {}).get(option_id)


# --------------------------------------------------------------------------- #
# dispatch
# --------------------------------------------------------------------------- #
# --- informative tool responses (stop Gemini 3.8 "sweeping"/redundant retries) -- #
def _ok(message: str, **data) -> dict:
    return {"ok": True, "status": "ok", "retryable": False, "message": message, **data}


def _fail(status: str, message: str, retryable: bool = False, **data) -> dict:
    return {"ok": False, "status": status, "retryable": retryable, "message": message, **data}


def _enrich(result: dict) -> dict:
    """Guarantee every result has status/retryable/message so the model never
    sweeps on an uninformative response."""
    if "status" in result and "message" in result:
        return result
    ok = result.get("ok", True)
    out = {**result}
    out.setdefault("status", "ok" if ok else "error")
    out.setdefault("retryable", False)
    out.setdefault("message", result.get("summary") or result.get("reason")
                   or ("Done." if ok else "I couldn't complete that; ask the traveller to clarify."))
    return out


def dispatch(name: str, args: dict, session: ItinerarySession) -> tuple[dict, list[dict]]:
    args = args or {}
    handler = _HANDLERS.get(name)
    if handler is None:
        return _fail("invalid_argument", f"There is no action '{name}'. Do not retry; continue the conversation."), []
    try:
        result, events = handler(args, session)
        return _enrich(result), events
    except ItineraryError as e:
        return _fail("invalid_argument",
                     f"{e.reason}. Tell the traveller and ask them to clarify — do NOT silently retry."), [ev.toast(e.reason, "warn")]
    except Exception:
        # Never tear down the live session; give the model clear, non-retryable guidance.
        return _fail("error",
                     "I couldn't do that yet — most likely no trip is set up. Ask the traveller to "
                     "share their trip first. Do NOT retry this call."), [ev.toast("Let's set up your trip first.", "warn")]


def _h_set_requirements(args, session):
    trip = session.set_requirements(args)
    return {"ok": True, "requirements": args}, [ev.trip_brief(trip)]


PLAN_THINKING = [
    "Understanding your trip", "Finding the best flights", "Gathering hotel options",
    "Mapping day-by-day activities", "Checking the weather window", "Finalizing your itinerary",
]


def _h_plan_trip(args, session):
    if session.trip is None:
        return {"ok": False, "reason": "no requirements yet"}, [ev.toast("Tell me your trip first", "warn")]
    events: list[dict] = []
    for step in PLAN_THINKING:
        events.append(ev.thinking_step(step, "running"))
    events += [ev.agent_status(a, "running") for a in AGENTS]
    events += [ev.grounding_ping(g) for g in GROUNDING]

    trip = compose_itinerary(session.trip)
    session.apply_plan(trip)
    month = _month_of(trip.start_date)

    events += [ev.agent_status(a, "done") for a in AGENTS]
    events += [ev.thinking_step(step, "done") for step in PLAN_THINKING]
    events.append(ev.itinerary_set(trip))
    for city in trip.destinations:
        events.append(ev.weather_set(get_weather(city, month)))
    events.append(ev.packing_set(get_packing_list(trip.destinations[-1] if trip.destinations else "Tokyo", month)))
    events.append(ev.cost_summary(trip))
    events.append(ev.budget_update(trip))
    events.append(ev.map_update(list(trip.destinations), _map_pins(trip)))
    return {"ok": True, "summary": f"{trip.nights}-night {'/'.join(trip.destinations)} trip, "
            f"about ₹{per_person_total(trip):,}/person"}, events


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
    return {"ok": True, "item": item.model_dump()}, [ev.option_selected(item), ev.item_add(day_index, item), ev.budget_update(session.trip), ev.options_clear()]


def _item_from_option(opt: Option, city: str, day_index: int):
    if opt.category == "hotel":
        return HotelStay(id=f"{opt.id}-sel", title=opt.name, price_inr=opt.price_inr,
                         hotel=opt.name, city=city, nights=2, check_in="", tier=opt.tier,
                         image_url=opt.image_url, description=opt.description)
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
        item = Activity(id=f"act-{abs(hash(name)) % 10**8}", title=name, price_inr=int(args.get("price_inr", 3000)),
                        city=city, image_url=f"/api/img/{images.register('activity', name, city)}")
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
                    price_inr=int(args.get("price_inr", 2500)), city=city, time="evening", slot="evening",
                    description=f"A cosy dinner at {where}.",
                    image_url=f"/api/img/{images.register('activity', f'Dinner at {where} in {city}', city)}")
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
    _ensure_postsale_trip(session)
    return {"ok": True}, [ev.itinerary_set(session.trip), ev.budget_update(session.trip)]


def _h_report_disruption(args, session):
    _ensure_postsale_trip(session)
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


def _h_reschedule_flight(args, session):
    """Customer-initiated flight change: show alternative flights to confirm."""
    _ensure_postsale_trip(session)
    flight = _first_flight(session.trip)
    if flight is None:
        return _fail("no_results", "There's no flight on this trip to reschedule. Ask the traveller what they'd like to change."), [ev.toast("No flight on this trip.", "warn")]
    opts = get_flights(session.trip.origin, flight.destination, args.get("when", ""), _pax(session))
    _set_last_options(session, opts)
    events = [
        ev.thinking_step("Finding alternative flights", "running"),
        ev.agent_status("Flights", "running"), ev.grounding_ping("Search"),
        ev.options_show("flight", opts),
        ev.agent_status("Flights", "done"),
        ev.thinking_step("Finding alternative flights", "done"),
    ]
    return _ok(f"Found {len(opts)} alternative flights to {flight.destination}. Tell the traveller the best option "
               f"and the fare, then ask them to confirm before you book. Do not search again.",
               options=_opts_summary(opts)), events


def _booking_ref() -> str:
    import random
    return "CYMBAL-" + "".join(random.choice("ACDEFHJKLMNPRTUVWXY349") for _ in range(4))


def _h_rebook_flight(args, session):
    _ensure_postsale_trip(session)
    flight = _find_item(session.trip, args["flight_id"]) if args.get("flight_id") else _first_flight(session.trip)
    if flight is None:
        return _fail("no_results", "There's no flight to rebook. Ask the traveller which flight they mean."), [ev.toast("No flight to rebook.", "warn")]
    opt = _get_last_option(session, args.get("option_id", "")) or _pick(
        get_flights(session.trip.origin, flight.destination, session.trip.start_date, _pax(session)),
        args.get("tier", "comfort"),
    )
    session.rebook_flight(flight.id, opt)
    new_item = _find_item(session.trip, flight.id)
    ref = _booking_ref()
    return _ok(f"Booked end-to-end. New flight: {opt.name}, {opt.duration}. Confirmation reference {ref}. "
               f"Read the reference back to the traveller ONE CHARACTER AT A TIME.", flight=opt.name, booking_ref=ref), [
        ev.options_clear(), ev.item_swap(new_item), ev.budget_update(session.trip), ev.cost_summary(session.trip),
        ev.support_card("Flight booked ✓", f"You're confirmed on {opt.name}. Reference {ref}.", "success"),
    ]


def _h_extend_trip(args, session):
    _ensure_postsale_trip(session)
    city = args.get("city") or (session.trip.destinations[-1] if session.trip.destinations else "Tokyo")
    session.add_night(city)
    return {"ok": True, "city": city}, [
        ev.itinerary_set(session.trip), ev.budget_update(session.trip),
        ev.support_card("Trip extended", f"Added a night in {city}.", "success"),
    ]


def _h_request_refund(args, session):
    _ensure_postsale_trip(session)
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


def _opts_summary(options):
    return [{"id": o.id, "name": o.name, "tier": o.tier, "price_inr": o.price_inr,
             "why": o.why, "duration": o.duration} for o in options]


def _search(agent, category, options, session):
    _set_last_options(session, options)
    label = {"flight": "flights", "hotel": "hotels", "activity": "activities", "event": "events"}[category]
    events = [
        ev.thinking_step(f"Finding {label}", "running"),
        ev.agent_status(agent, "running"),
        ev.grounding_ping("Search"), ev.grounding_ping("Maps"),
        ev.options_show(category, options),
        ev.agent_status(agent, "done"),
        ev.thinking_step(f"Finding {label}", "done"),
    ]
    return {"ok": True, "options": _opts_summary(options)}, events


def _origin(session):
    return session.trip.origin if session.trip else "Bangalore"


def _first_city(session):
    if session.trip and session.trip.destinations:
        return session.trip.destinations[0]
    return "Tokyo"


def _pax(session):
    return max(1, len(session.trip.travellers)) if session.trip else 2


def _h_search_flights(args, session):
    dest = args.get("dest") or _first_city(session)
    return _search("Flights", "flight",
                   get_flights(args.get("origin") or _origin(session), dest, args.get("date", ""), _pax(session)),
                   session)


def _h_search_hotels(args, session):
    city = args.get("city") or _first_city(session)
    return _search("Hotels", "hotel", get_hotels(city, 3, _pax(session), args.get("vibe")), session)


def _h_search_activities(args, session):
    city = args.get("city") or _first_city(session)
    return _search("Itinerary", "activity", get_activities(city), session)


def _h_search_events(args, session):
    city = args.get("city") or _first_city(session)
    return _search("Events", "event", get_events(city, args.get("month")), session)


def _add_from_last(args, session, prefer):
    opts = getattr(session, "last_options", {})
    opt = opts.get(args.get("option_id", ""))
    if opt is None:
        opt = next((o for o in opts.values() if o.category == prefer), None) or next(iter(opts.values()), None)
    if opt is None or session.trip is None:
        return {"ok": False, "reason": "search first"}, [ev.toast("Let me search some options first.", "warn")]
    day_index = 0 if prefer == "flight" else _last_day_index(session.trip, None)
    city = session.trip.days[day_index].city if session.trip.days else _first_city(session)
    item = _item_from_option(opt, city, day_index)
    session.add_item(day_index, item)
    return ({"ok": True, "added": opt.name},
            [ev.item_add(day_index, item), ev.budget_update(session.trip), ev.cost_summary(session.trip), ev.options_clear()])


def _h_add_flight(args, session):
    return _add_from_last(args, session, "flight")


def _h_add_hotel(args, session):
    return _add_from_last(args, session, "hotel")


def _h_add_event(args, session):
    return _add_from_last(args, session, "event")


def _h_get_weather(args, session):
    city = args.get("city") or _first_city(session)
    month = args.get("month") or (_month_of(session.trip.start_date) if session.trip else "your dates")
    w = get_weather(city, month)
    return {"ok": True, "weather": w}, [ev.weather_set(w)]


def _h_get_travel_time(args, session):
    origin = args.get("origin") or _origin(session)
    dest = args.get("dest") or _first_city(session)
    tt = get_travel_time(origin, dest, args.get("mode", "flight"))
    return {"ok": True, "travel": tt}, [ev.travel_note(tt), ev.toast(tt["note"], "info")]


def _h_get_packing_list(args, session):
    city = args.get("city") or _first_city(session)
    month = args.get("month") or (_month_of(session.trip.start_date) if session.trip else "your dates")
    p = get_packing_list(city, month)
    return {"ok": True, "packing": p}, [ev.packing_set(p)]


def _h_get_cost_summary(args, session):
    if session.trip is None:
        return {"ok": False, "reason": "no trip yet"}, [ev.toast("Let's plan the trip first.", "warn")]
    cb = cost_breakdown(session.trip)
    category = args.get("category")
    answer = cb
    if category and category in cb["breakdown"]:
        answer = {"category": category, "per_person": cb["breakdown"][category],
                  "party_total": cb["breakdown"][category] * cb["travellers"]}
    return {"ok": True, "cost": answer}, [ev.cost_summary(session.trip)]


_HANDLERS = {
    "set_trip_requirements": _h_set_requirements,
    "plan_trip": _h_plan_trip,
    "search_flights": _h_search_flights,
    "search_hotels": _h_search_hotels,
    "search_activities": _h_search_activities,
    "search_events": _h_search_events,
    "add_flight": _h_add_flight,
    "add_hotel": _h_add_hotel,
    "add_event": _h_add_event,
    "get_weather": _h_get_weather,
    "get_travel_time": _h_get_travel_time,
    "get_packing_list": _h_get_packing_list,
    "get_cost_summary": _h_get_cost_summary,
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
    "reschedule_flight": _h_reschedule_flight,
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
    {"name": "plan_trip", "description": "Run the agentic orchestration and compose the full day-by-day itinerary in one go.",
     "parameters": {"type": "object", "properties": {}}},
    {"name": "search_flights", "description": "Search flights for the route and show 4-5 options.",
     "parameters": {"type": "object", "properties": {"origin": _str("origin city"), "dest": _str("destination city"), "date": _str("YYYY-MM-DD")}}},
    {"name": "search_hotels", "description": "Search hotels in a city and show 4-5 options.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "vibe": _str("optional vibe")}}},
    {"name": "search_activities", "description": "Find things to do in a city and show options.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
    {"name": "search_events", "description": "Find events/festivals in a city for the dates.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "month": _str("month")}}},
    {"name": "add_flight", "description": "Add a searched flight to the trip (defaults to the best option).",
     "parameters": {"type": "object", "properties": {"option_id": _str("id")}}},
    {"name": "add_hotel", "description": "Add a searched hotel to the trip.",
     "parameters": {"type": "object", "properties": {"option_id": _str("id")}}},
    {"name": "add_event", "description": "Add a searched event to the trip.",
     "parameters": {"type": "object", "properties": {"option_id": _str("id")}}},
    {"name": "get_weather", "description": "Check the weather for a city on the travel dates.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "month": _str("month")}}},
    {"name": "get_travel_time", "description": "Get travel time between two places (flight or train).",
     "parameters": {"type": "object", "properties": {"origin": _str("from"), "dest": _str("to"), "mode": _str("flight|train")}}},
    {"name": "get_packing_list", "description": "Suggest what to pack based on the destination weather.",
     "parameters": {"type": "object", "properties": {"city": _str("city"), "month": _str("month")}}},
    {"name": "get_cost_summary", "description": "Get the live cost — total, or just flights/hotels/activities/events.",
     "parameters": {"type": "object", "properties": {"category": _str("flights|hotels|activities|events (optional)")}}},
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
    {"name": "report_disruption", "description": "Report a flight disruption (delay/cancellation) and fetch alternatives. Invoke when the traveller reports a problem with a booked flight.",
     "parameters": {"type": "object", "properties": {"flight_id": _str("id"), "city": _str("city")}}},
    {"name": "reschedule_flight", "description": "Customer-initiated flight change: show alternative flights to a new time/day. Invoke when the traveller asks to move/reschedule their flight.",
     "parameters": {"type": "object", "properties": {"when": _str("new time or day, optional")}}},
    {"name": "rebook_flight", "description": "Confirm and book one of the shown alternative flights end-to-end. Invoke ONLY after the traveller confirms a specific option.",
     "parameters": {"type": "object", "properties": {"flight_id": _str("id"), "option_id": _str("id"), "tier": _str("tier")}}},
    {"name": "extend_trip", "description": "Add a night to the trip in a city.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
    {"name": "request_refund", "description": "Request a refund for an item.",
     "parameters": {"type": "object", "properties": {"item_id": _str("id")}, "required": ["item_id"]}},
    {"name": "add_night", "description": "Add a night in a city during planning.",
     "parameters": {"type": "object", "properties": {"city": _str("city")}}},
]
