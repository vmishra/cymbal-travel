"""Authoritative, mutable trip state for one planning session."""
from __future__ import annotations

import re

from .domain import Day, Flight, HotelStay, Option, Traveller, Trip

_CHILD_WORDS = {"child", "children", "kid", "kids", "infant", "baby", "son", "daughter", "toddler", "minor"}


def _as_list(v) -> list[str]:
    if v is None:
        return []
    if isinstance(v, str):
        return [v.strip()] if v.strip() else []
    if isinstance(v, (list, tuple)):
        return [str(x).strip() for x in v if str(x).strip()]
    return [str(v)]


def _as_int(v) -> int:
    if isinstance(v, (int, float)):
        return int(v)
    m = re.search(r"\d[\d,]*", str(v or ""))
    return int(m.group().replace(",", "")) if m else 0


def _travellers(v) -> list[Traveller]:
    if isinstance(v, int):
        v = [{"type": "adult"} for _ in range(v)]
    out: list[Traveller] = []
    for t in (v or []):
        if isinstance(t, Traveller):
            out.append(t)
            continue
        if not isinstance(t, dict):
            continue
        typ = str(t.get("type", "adult")).lower()
        kind = "child" if any(w in typ for w in _CHILD_WORDS) else "adult"
        try:
            age = int(t["age"]) if t.get("age") is not None else None
        except Exception:
            age = None
        out.append(Traveller(type=kind, age=age))
    return out


class ItineraryError(Exception):
    """Raised when an operation references something that isn't there."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _apply_option(old, option: Option):
    """Return a new item of `old`'s kind with pricing/name from `option`."""
    data = old.model_dump()
    data["price_inr"] = option.price_inr
    data["title"] = option.name
    if option.image_url:
        data["image_url"] = option.image_url
    if old.kind == "hotel":
        data["hotel"] = option.name
        data["tier"] = option.tier
    elif old.kind == "flight":
        data["airline"] = option.name
        data["tier"] = option.tier
    elif old.kind == "transfer":
        data["mode"] = option.name
    return type(old)(**data)


class ItinerarySession:
    def __init__(self, trip: Trip | None = None):
        self.trip = trip

    # --- lifecycle -----------------------------------------------------------
    def set_requirements(self, req: dict) -> Trip:
        # Tolerant of whatever shape the model sends — never throws, so the trip
        # brief always renders (destinations as a string, type="children"/"kid",
        # nights/budget as "7"/"2 lakh", a traveller count, etc.).
        req = req or {}
        dests = _as_list(req.get("destinations"))
        title = req.get("title") or (f"{dests[0]} trip" if dests else "Your trip")
        self.trip = Trip(
            id=req.get("id", "trip"),
            title=str(title),
            origin=str(req.get("origin") or ""),
            destinations=dests,
            start_date=str(req.get("start_date") or ""),
            nights=_as_int(req.get("nights")),
            travellers=_travellers(req.get("travellers")),
            budget_per_person=_as_int(req.get("budget_per_person")),
            pace=str(req.get("pace") or "leisure"),
            must_dos=_as_list(req.get("must_dos")),
            days=[],
        )
        return self.trip

    def apply_plan(self, plan: Trip) -> Trip:
        self.trip = plan
        return self.trip

    def snapshot(self) -> Trip:
        self._require_trip()
        return self.trip

    # --- mutations -----------------------------------------------------------
    def add_item(self, day_index: int, item) -> Trip:
        self._require_trip()
        if day_index < 0 or day_index >= len(self.trip.days):
            raise ItineraryError(f"no day at index {day_index}")
        self.trip.days[day_index].items.append(item)
        return self.trip

    def remove_item(self, item_id: str) -> Trip:
        self._require_trip()
        for day in self.trip.days:
            for i, it in enumerate(day.items):
                if it.id == item_id:
                    del day.items[i]
                    return self.trip
        raise ItineraryError(f"item {item_id!r} not found")

    def swap_item(self, item_id: str, new: Option) -> Trip:
        self._require_trip()
        for day in self.trip.days:
            for i, it in enumerate(day.items):
                if it.id == item_id:
                    day.items[i] = _apply_option(it, new)
                    return self.trip
        raise ItineraryError(f"item {item_id!r} not found")

    def rebook_flight(self, flight_id: str, new: Option) -> Trip:
        self._require_trip()
        for day in self.trip.days:
            for it in day.items:
                if it.id == flight_id and isinstance(it, Flight):
                    idx = day.items.index(it)
                    day.items[idx] = _apply_option(it, new)
                    return self.trip
        raise ItineraryError(f"flight {flight_id!r} not found")

    def refund_item(self, item_id: str) -> Trip:
        return self.remove_item(item_id)

    def reorder_day(self, day_index: int, item_ids: list[str]) -> Trip:
        self._require_trip()
        if day_index < 0 or day_index >= len(self.trip.days):
            raise ItineraryError(f"no day at index {day_index}")
        day = self.trip.days[day_index]
        by_id = {it.id: it for it in day.items}
        if set(item_ids) != set(by_id):
            raise ItineraryError("reorder ids do not match day items")
        day.items = [by_id[i] for i in item_ids]
        return self.trip

    def add_night(self, city: str) -> Trip:
        self._require_trip()
        stay = next((s for s in self.trip.stays if s.city == city), None)
        if stay is None:
            raise ItineraryError(f"no stay in {city}")
        stay.nights += 1
        self.trip.nights += 1
        self.trip.days.append(Day(index=len(self.trip.days), city=city, items=[]))
        return self.trip

    # --- helpers -------------------------------------------------------------
    def _require_trip(self) -> None:
        if self.trip is None:
            raise ItineraryError("no trip in session")
