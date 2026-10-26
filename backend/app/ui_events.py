"""Declarative UI-event constructors.

Every tool returns a list of these; they stream over the WebSocket and the
frontend reducer turns each into an animated change. Shape: {type, payload}.
Keep this the single source of truth for event names (mirrored by the frontend
reducer).
"""
from __future__ import annotations

from .domain import Trip, cost_breakdown, is_over_budget, per_person_total

Event = dict

AGENTS = ["Flights", "Hotels", "Itinerary", "Events"]
GROUNDING = ["Maps", "Search", "WeatherNext"]


def trip_brief(trip: Trip) -> Event:
    return {"type": "trip_brief", "payload": {
        "title": trip.title, "origin": trip.origin, "destinations": trip.destinations,
        "nights": trip.nights, "start_date": trip.start_date,
        "travellers": [t.model_dump() for t in trip.travellers],
        "budget_per_person": trip.budget_per_person, "pace": trip.pace,
        "must_dos": trip.must_dos,
    }}


def agent_status(agent: str, status: str) -> Event:
    return {"type": "agent_status", "payload": {"agent": agent, "status": status}}


def grounding_ping(source: str) -> Event:
    return {"type": "grounding_ping", "payload": {"source": source}}


def itinerary_set(trip: Trip) -> Event:
    return {"type": "itinerary_set", "payload": {"trip": trip.model_dump()}}


def item_add(day_index: int, item) -> Event:
    return {"type": "item_add", "payload": {"day_index": day_index, "item": item.model_dump()}}


def item_remove(item_id: str) -> Event:
    return {"type": "item_remove", "payload": {"item_id": item_id}}


def item_swap(item) -> Event:
    return {"type": "item_swap", "payload": {"item": item.model_dump()}}


def item_reorder(day_index: int, item_ids: list[str]) -> Event:
    return {"type": "item_reorder", "payload": {"day_index": day_index, "item_ids": item_ids}}


def options_show(category: str, options: list) -> Event:
    return {"type": "options_show", "payload": {
        "category": category, "options": [o.model_dump() for o in options],
    }}


def option_selected(item) -> Event:
    return {"type": "option_selected", "payload": {"item": item.model_dump()}}


def budget_update(trip: Trip) -> Event:
    return {"type": "budget_update", "payload": {
        "per_person_total": per_person_total(trip),
        "budget_per_person": trip.budget_per_person,
        "over": is_over_budget(trip),
    }}


def map_update(cities: list[str], pins: list[dict]) -> Event:
    return {"type": "map_update", "payload": {"cities": cities, "pins": pins}}


def mode_switch(mode: str) -> Event:
    return {"type": "mode_switch", "payload": {"mode": mode}}


def disruption(message: str, flight_id: str | None = None) -> Event:
    return {"type": "disruption", "payload": {"message": message, "flight_id": flight_id}}


def support_card(title: str, body: str, kind: str = "info") -> Event:
    return {"type": "support_card", "payload": {"title": title, "body": body, "kind": kind}}


def toast(message: str, level: str = "info") -> Event:
    return {"type": "toast", "payload": {"message": message, "level": level}}


def thinking_step(label: str, status: str = "running") -> Event:
    # status: running | done
    return {"type": "thinking_step", "payload": {"label": label, "status": status}}


def weather_set(weather: dict) -> Event:
    return {"type": "weather_set", "payload": weather}


def packing_set(packing: dict) -> Event:
    return {"type": "packing_set", "payload": packing}


def travel_note(note: dict) -> Event:
    return {"type": "travel_note", "payload": note}


def cost_summary(trip: Trip) -> Event:
    return {"type": "cost_summary", "payload": cost_breakdown(trip)}
