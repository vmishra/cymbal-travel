"""Pre-generate the Japan hero image set (+ map background) into the disk cache,
so the live demo loads real Nano Banana images instantly.

Run:  .venv/bin/python prewarm_images.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app import images  # noqa: E402
from app.mock_services import get_activities, get_events, get_hotels  # noqa: E402

CITIES = ["Tokyo", "Hakone", "Kyoto"]


def seeds() -> list[tuple[str, str, str]]:
    out: list[tuple[str, str, str]] = [("map", "", "")]
    for city in CITIES:
        for o in get_activities(city):
            out.append(("activity", o.name, city))
        ev = get_events(city)
        out.append(("event", ev[1].name, city))  # the composed (comfort) event
        hs = get_hotels(city, 3, 3)
        out.append(("hotel", hs[1].name, city))   # comfort (default)
        out.append(("hotel", hs[2].name, city))   # premium (swap target)
    return out


def main() -> int:
    items = seeds()
    print(f"Pre-generating {len(items)} images…")
    done = 0
    for cat, name, city in items:
        slug = "mapbg" if cat == "map" else images.register(cat, name, city)
        prompt = images.REGISTRY.get(slug) or images.prompt_for(cat, name, city)
        if images.has_image(slug):
            done += 1
            continue
        ok = images.generate(prompt, slug)
        done += 1 if ok else 0
        print(f"  [{done}/{len(items)}] {cat}: {name or 'map'} {city} → {'ok' if ok else 'FAILED'}")
    print(f"Done: {done}/{len(items)} cached in {images.CACHE_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
