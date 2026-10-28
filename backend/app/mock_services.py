"""Deterministic, brand-neutral mock travel services.

Each search returns 4-5 Options spanning price tiers (value -> luxury), enriched
with descriptions/durations/"why". Curated content for the happy-path cities; a
generic generator keeps any city working. Plus weather, travel-time and packing
helpers so Isha can do (and show) real planning work. Images are gradient tokens
(``grad:<seed>``) so nothing hits the network.
"""
from __future__ import annotations

import hashlib

from . import images
from .domain import Option
from .seed_data import (
    ACTIVITY_PRICES,
    AIRLINE_POOL,
    BASE_PACKING,
    CURATED_ACTIVITIES,
    CURATED_EVENTS,
    EVENT_PRICES,
    FLIGHT_PRICES,
    GENERIC_ACTIVITY_TEMPLATES,
    GENERIC_EVENT_TEMPLATES,
    HOTEL_DESCRIPTORS,
    HOTEL_PREFIXES,
    HOTEL_PRICES,
    PACKING_BY_CONDITION,
    WEATHER_CONDITIONS,
)

TIER_LAYOUT = ["value", "comfort", "premium", "luxury", "comfort"]


def _stable(seed: str) -> int:
    return int(hashlib.md5(seed.encode()).hexdigest(), 16)


def _id(category: str, *parts) -> str:
    return f"{category}-{hashlib.md5('|'.join(map(str, parts)).encode()).hexdigest()[:8]}"


def _rating(tier: str, jitter: int) -> float:
    base = {"value": 3.9, "comfort": 4.3, "premium": 4.6, "luxury": 4.9}[tier]
    return round(min(5.0, base + (jitter % 3) * 0.03), 2)


def _price(table: dict, tier: str, seed: str) -> int:
    base = table[tier]
    delta = (_stable(seed) % 1200) - 600
    return int(round((base + delta) / 100.0)) * 100


def _flight_duration(origin: str, dest: str) -> str:
    h = 2 + _stable(f"dur{origin}{dest}") % 12
    m = (_stable(f"min{origin}{dest}") % 12) * 5
    return f"{h}h {m:02d}m"


def get_flights(origin: str, dest: str, date: str, pax: int) -> list[Option]:
    out: list[Option] = []
    dur = _flight_duration(origin, dest)
    for i, tier in enumerate(TIER_LAYOUT):
        airline = AIRLINE_POOL[(_stable(f"{origin}{dest}{i}") % len(AIRLINE_POOL))]
        seed = f"flight|{origin}|{dest}|{date}|{i}"
        nonstop = tier in ("premium", "luxury") or i % 2 == 0
        stops = "Non-stop" if nonstop else "1 stop"
        cabin = {"value": "Economy", "comfort": "Economy", "premium": "Premium economy", "luxury": "Business"}[tier]
        out.append(Option(
            id=_id("flight", origin, dest, date, i),
            category="flight", name=f"{airline} {origin}–{dest}", tier=tier,
            price_inr=_price(FLIGHT_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[stops, cabin], image_url=f"grad:flight-{i}",
            description=f"{cabin} · {stops} · {dur}", duration=dur,
            why=("Non-stop and lands early, so you start fresh" if nonstop else "Cheapest with one quick layover"),
        ))
    return out


def get_hotels(city: str, nights: int, pax: int, vibe: str | None = None) -> list[Option]:
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        prefix = HOTEL_PREFIXES[(_stable(f"{city}{i}") % len(HOTEL_PREFIXES))]
        descriptor = HOTEL_DESCRIPTORS[(_stable(f"d{city}{i}") % len(HOTEL_DESCRIPTORS))]
        seed = f"hotel|{city}|{nights}|{i}"
        out.append(Option(
            id=_id("hotel", city, nights, i),
            category="hotel", name=f"{prefix} {city}", tier=tier,
            price_inr=_price(HOTEL_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[f"{nights} nights", vibe or descriptor.split(",")[0]],
            image_url=f"/api/img/{images.register('hotel', f'{prefix} {city}', city)}",
            description=f"{descriptor.capitalize()}.",
            why=("Great location and loved by families" if tier in ("comfort", "premium") else
                 "Best value for the dates" if tier == "value" else "A standout splurge"),
        ))
    return out


def _activity_pool(city: str) -> list[dict]:
    if city in CURATED_ACTIVITIES:
        return CURATED_ACTIVITIES[city]
    return [
        {"name": n.format(city=city), "desc": d.format(city=city), "duration": dur}
        for (n, d, dur) in GENERIC_ACTIVITY_TEMPLATES
    ]


def get_activities(city: str, interests: list[str] | None = None) -> list[Option]:
    pool = _activity_pool(city)
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        a = pool[i % len(pool)]
        seed = f"activity|{city}|{i}"
        out.append(Option(
            id=_id("activity", city, i),
            category="activity", name=a["name"], tier=tier,
            price_inr=_price(ACTIVITY_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[city, a.get("duration", "")],
            image_url=f"/api/img/{images.register('activity', a['name'], city)}",
            description=a.get("desc", ""), duration=a.get("duration", ""),
            why="A local favourite that fits your pace",
        ))
    return out


def get_events(city: str, month: str | None = None) -> list[Option]:
    if city in CURATED_EVENTS:
        pool = CURATED_EVENTS[city]
    else:
        pool = [{"name": n.format(city=city), "desc": d} for (n, d) in GENERIC_EVENT_TEMPLATES]
    out: list[Option] = []
    for i, tier in enumerate(TIER_LAYOUT):
        e = pool[i % len(pool)]
        seed = f"event|{city}|{i}"
        out.append(Option(
            id=_id("event", city, i),
            category="event", name=e["name"], tier=tier,
            price_inr=_price(EVENT_PRICES, tier, seed), rating=_rating(tier, i),
            highlights=[month or "Seasonal", city],
            image_url=f"/api/img/{images.register('event', e['name'], city)}",
            description=e.get("desc", ""), why="Perfect timing for your dates",
        ))
    return out


# --- enrichment services -------------------------------------------------- #
def get_weather(city: str, month: str | None = None) -> dict:
    cond, icon = WEATHER_CONDITIONS[_stable(f"w{city}{month}") % len(WEATHER_CONDITIONS)]
    temp = 12 + _stable(f"t{city}{month}") % 22  # 12–33 °C
    low = max(4, temp - 6)
    return {
        "city": city, "month": month or "your dates", "condition": cond, "icon": icon,
        "high_c": temp, "low_c": low,
        "summary": f"{cond}, about {low}–{temp}°C in {city}.",
    }


def get_travel_time(origin: str, dest: str, mode: str = "flight") -> dict:
    if mode == "flight":
        dur = _flight_duration(origin, dest)
        note = f"Direct flight, about {dur}."
    else:
        h = 1 + _stable(f"tt{origin}{dest}{mode}") % 5
        m = (_stable(f"ttm{origin}{dest}") % 12) * 5
        dur = f"{h}h {m:02d}m"
        note = f"{mode.capitalize()} ride, about {dur} — scenic and easy."
    return {"origin": origin, "dest": dest, "mode": mode, "duration": dur, "note": note}


def get_packing_list(city: str, month: str | None = None) -> dict:
    weather = get_weather(city, month)
    items = list(BASE_PACKING) + PACKING_BY_CONDITION.get(weather["condition"], [])
    return {
        "city": city, "condition": weather["condition"], "icon": weather["icon"],
        "items": items,
        "note": f"Packed for {weather['condition'].lower()} in {city}.",
    }
