"""Deterministic, brand-neutral mock travel services.

Each returns 4-5 Options spanning price tiers (value -> luxury). Curated content
for the happy-path cities; a generic fallback keeps open-ended mode from ever
dead-ending. Images are gradient-placeholder tokens (``grad:<seed>``) so nothing
hits the network.
"""
from __future__ import annotations

import hashlib

from .domain import Option
from .seed_data import (
    ACTIVITY_PRICES,
    AIRLINE_POOL,
    CURATED_ACTIVITIES,
    CURATED_EVENTS,
    EVENT_PRICES,
    FLIGHT_PRICES,
    GENERIC_ACTIVITIES,
    GENERIC_EVENTS,
    HOTEL_PREFIXES,
    HOTEL_PRICES,
)

# Tier layout for a 5-option result; always contains value/comfort/premium.
TIER_LAYOUT = ["value", "comfort", "premium", "luxury", "comfort"]


def _stable(seed: str) -> int:
    return int(hashlib.md5(seed.encode()).hexdigest(), 16)


def _id(category: str, *parts) -> str:
    return f"{category}-{hashlib.md5('|'.join(map(str, parts)).encode()).hexdigest()[:8]}"


def _rating(tier: str, jitter: int) -> float:
    base = {"value": 3.9, "comfort": 4.3, "premium": 4.6, "luxury": 4.9}[tier]
    return round(min(5.0, base + (jitter % 3) * 0.03), 2)


def _price(table: dict, tier: str, seed: str) -> int:
    # Deterministic +/- up to ~6% jitter so options look organic but stable.
    base = table[tier]
    delta = (_stable(seed) % 1200) - 600
    return int(round((base + delta) / 100.0)) * 100


def get_flights(origin: str, dest: str, date: str, pax: int) -> list[Option]:
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        airline = AIRLINE_POOL[(_stable(f"{origin}{dest}{i}") % len(AIRLINE_POOL))]
        seed = f"flight|{origin}|{dest}|{date}|{i}"
        stops = "Non-stop" if tier in ("premium", "luxury") else ("1 stop" if i % 2 else "Non-stop")
        out.append(Option(
            id=_id("flight", origin, dest, date, i),
            category="flight", name=f"{airline} {origin}–{dest}", tier=tier,
            price_inr=_price(FLIGHT_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[stops, f"{pax} travellers"], image_url=f"grad:flight-{i}",
        ))
    return out


def get_hotels(city: str, nights: int, pax: int, vibe: str | None = None) -> list[Option]:
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        prefix = HOTEL_PREFIXES[(_stable(f"{city}{i}") % len(HOTEL_PREFIXES))]
        seed = f"hotel|{city}|{nights}|{i}"
        out.append(Option(
            id=_id("hotel", city, nights, i),
            category="hotel", name=f"{prefix} {city}", tier=tier,
            price_inr=_price(HOTEL_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[f"{nights} nights", vibe or "Central location"],
            image_url=f"grad:hotel-{i}",
        ))
    return out


def _activity_pool(city: str) -> list[str]:
    return CURATED_ACTIVITIES.get(city, GENERIC_ACTIVITIES)


def get_activities(city: str, interests: list[str] | None = None) -> list[Option]:
    pool = _activity_pool(city)
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        name = pool[i % len(pool)]
        seed = f"activity|{city}|{i}"
        out.append(Option(
            id=_id("activity", city, i),
            category="activity", name=name, tier=tier,
            price_inr=_price(ACTIVITY_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[city], image_url=f"grad:activity-{i}",
        ))
    return out


def get_events(city: str, month: str | None = None) -> list[Option]:
    pool = CURATED_EVENTS.get(city, GENERIC_EVENTS)
    # Events are fewer; repeat across tiers to still span price ranges.
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        name = pool[i % len(pool)]
        seed = f"event|{city}|{i}"
        out.append(Option(
            id=_id("event", city, i),
            category="event", name=name, tier=tier,
            price_inr=_price(EVENT_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[month or "Seasonal", city], image_url=f"grad:event-{i}",
        ))
    return out
