"""Cymbal Travels domain model.

Pricing convention (ruling): every `price_inr` is a **per-person** amount, and the
single source of truth for cost is `trip.days[].items`. `flights`/`stays` are
computed views over those items, never summed separately.
"""
from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

Tier = Literal["value", "comfort", "premium", "luxury"]
Category = Literal["flight", "hotel", "activity", "event", "transfer"]


class Traveller(BaseModel):
    type: Literal["adult", "child"]
    age: int | None = None


class Option(BaseModel):
    """A selectable choice returned by a mock service."""

    id: str
    category: Category
    name: str
    tier: Tier
    price_inr: int
    rating: float = 4.5
    highlights: list[str] = Field(default_factory=list)
    image_url: str = ""


class _BaseItem(BaseModel):
    id: str
    title: str
    price_inr: int = 0


class Flight(_BaseItem):
    kind: Literal["flight"] = "flight"
    airline: str
    origin: str
    destination: str
    depart: str
    arrive: str
    tier: Tier = "comfort"


class HotelStay(_BaseItem):
    kind: Literal["hotel"] = "hotel"
    hotel: str
    city: str
    nights: int
    check_in: str
    tier: Tier = "comfort"


class Activity(_BaseItem):
    kind: Literal["activity"] = "activity"
    city: str
    time: str | None = None


class Event(_BaseItem):
    kind: Literal["event"] = "event"
    city: str
    date: str | None = None


class Transfer(_BaseItem):
    kind: Literal["transfer"] = "transfer"
    mode: str
    origin: str
    destination: str


Item = Annotated[
    Union[Flight, HotelStay, Activity, Event, Transfer],
    Field(discriminator="kind"),
]


class Day(BaseModel):
    index: int
    city: str
    items: list[Item] = Field(default_factory=list)


class Trip(BaseModel):
    id: str
    title: str
    origin: str
    destinations: list[str] = Field(default_factory=list)
    start_date: str
    nights: int
    travellers: list[Traveller] = Field(default_factory=list)
    budget_per_person: int
    pace: str = "leisure"
    must_dos: list[str] = Field(default_factory=list)
    days: list[Day] = Field(default_factory=list)

    @property
    def flights(self) -> list[Flight]:
        return [it for it in _all_items(self) if isinstance(it, Flight)]

    @property
    def stays(self) -> list[HotelStay]:
        return [it for it in _all_items(self) if isinstance(it, HotelStay)]


def _all_items(trip: Trip) -> list:
    return [it for day in trip.days for it in day.items]


def per_person_total(trip: Trip) -> int:
    """Sum of per-person prices across every itinerary item."""
    return sum(it.price_inr for it in _all_items(trip))


def is_over_budget(trip: Trip) -> bool:
    return per_person_total(trip) > trip.budget_per_person
