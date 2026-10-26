"""Nano Banana (Gemini image) generation with on-disk caching.

Generates travel imagery for place/hotel/map blocks and caches PNGs so the demo
loads instantly and works offline once warmed. Falls back silently (the frontend
shows a gradient) when a key or the model is unavailable.
"""
from __future__ import annotations

import hashlib
import logging
import os
import pathlib

logger = logging.getLogger("cymbal.images")

CACHE_DIR = pathlib.Path(__file__).resolve().parent.parent / "generated_images"
CACHE_DIR.mkdir(exist_ok=True)

# Nano Banana (GA) first, then Nano Banana Pro.
IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"]


def slugify(seed: str) -> str:
    return hashlib.md5(seed.encode()).hexdigest()[:16]


def cache_path(slug: str) -> pathlib.Path:
    return CACHE_DIR / f"{slug}.png"


def has_image(slug: str) -> bool:
    p = cache_path(slug)
    return p.exists() and p.stat().st_size > 0


def _api_key() -> str | None:
    return (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_CLOUD_API_KEY"))


# slug -> prompt, so the /api/img route can generate on-demand for any city.
REGISTRY: dict[str, str] = {}
_IN_FLIGHT: set[str] = set()
_LOCK = __import__("threading").Lock()

_STYLE = ("Ultra-realistic travel photograph, cinematic natural light, rich colour, "
          "shallow depth of field, no text, no watermark, no logos, no people's faces in focus.")


def prompt_for(category: str, name: str, city: str) -> str:
    if category == "hotel":
        return f"{_STYLE} A beautiful boutique hotel in {city} — inviting exterior and garden, evening glow. ({name})"
    if category == "event":
        return f"{_STYLE} {name} in {city} — a festive seasonal scene, lanterns and atmosphere."
    if category == "city":
        return f"{_STYLE} An iconic skyline/landscape of {city}, golden hour, postcard-worthy."
    if category == "map":
        return ("A beautiful minimalist illustrated travel map, soft pastel colours, gentle paper texture, "
                "subtle coastlines and mountains, no text, no labels, no borders — a calm decorative map background.")
    return f"{_STYLE} {name} in {city} — a vivid, inviting travel moment."


def slug_for(category: str, name: str, city: str) -> str:
    return slugify(f"{category}|{name}|{city}")


def register(category: str, name: str, city: str) -> str:
    slug = slug_for(category, name, city)
    REGISTRY.setdefault(slug, prompt_for(category, name, city))
    return slug


def ensure_async(slug: str) -> None:
    """Kick off background generation for a known slug (no-op if cached/in-flight)."""
    if has_image(slug) or slug not in REGISTRY:
        return
    import threading
    with _LOCK:
        if slug in _IN_FLIGHT:
            return
        _IN_FLIGHT.add(slug)

    def _work():
        try:
            generate(REGISTRY[slug], slug)
        finally:
            with _LOCK:
                _IN_FLIGHT.discard(slug)

    threading.Thread(target=_work, daemon=True).start()


def prewarm(seeds: list[tuple[str, str, str]]) -> None:
    """Register + background-generate a batch of (category, name, city) seeds."""
    for cat, name, city in seeds:
        ensure_async(register(cat, name, city))


# Stable, frontend-referenceable slug for the map background.
REGISTRY["mapbg"] = prompt_for("map", "", "")


def generate(prompt: str, slug: str) -> bool:
    """Generate and cache an image for `slug`. Returns True if a file is present."""
    if has_image(slug):
        return True
    key = _api_key()
    if not key:
        return False
    try:
        from google import genai
        from google.genai import types
    except Exception:
        return False
    # Images always use AI Studio (API key), even when voice runs on Vertex.
    client = genai.Client(vertexai=False, api_key=key)
    for model in IMAGE_MODELS:
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
            )
            for cand in getattr(resp, "candidates", []) or []:
                for part in getattr(cand.content, "parts", []) or []:
                    inline = getattr(part, "inline_data", None)
                    if inline and getattr(inline, "data", None):
                        cache_path(slug).write_bytes(inline.data)
                        return True
        except Exception as exc:  # try the next model
            logger.info("image model %s failed: %s", model, str(exc)[:160])
            continue
    return False
