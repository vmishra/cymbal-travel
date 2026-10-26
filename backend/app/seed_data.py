"""Static, brand-neutral seed pools for the mock travel services.

Curated content for the happy-path destinations (Tokyo / Hakone / Kyoto) plus
generic pools used as a fallback for any other city. All names are invented or
public landmark/geography names — never airline/hotel/OTA brands.
"""
from __future__ import annotations

TIERS = ["value", "comfort", "premium", "luxury"]

# Per-person base prices (INR) by tier.
FLIGHT_PRICES = {"value": 28000, "comfort": 41000, "premium": 63000, "luxury": 96000}
HOTEL_PRICES = {"value": 12000, "comfort": 22000, "premium": 38000, "luxury": 70000}
ACTIVITY_PRICES = {"value": 1500, "comfort": 3200, "premium": 6000, "luxury": 12000}
EVENT_PRICES = {"value": 2000, "comfort": 3800, "premium": 7200, "luxury": 14000}

AIRLINE_POOL = ["AeroNova", "Zephyr Air", "SkyBridge", "Nimbus Airways", "Aurora Jet"]

HOTEL_PREFIXES = [
    "Azure Grand", "Sakura Garden", "Harborlight", "Meridian Grand",
    "Lumière", "Cedar & Stone", "The Lantern House",
]

CURATED_ACTIVITIES = {
    "Tokyo": [
        "Shibuya & Harajuku street walk",
        "Immersive digital-art museum",
        "Hands-on sushi-making class",
        "Asakusa & Senso-ji temple morning",
        "Akihabara pop-culture tour",
    ],
    "Hakone": [
        "Mount Fuji viewpoint lake cruise",
        "Open-air sculpture park",
        "Owakudani volcanic valley ropeway",
        "Lake Ashi scenic ferry",
        "Hot-spring onsen afternoon",
    ],
    "Kyoto": [
        "Fushimi Inari shrine hike",
        "Arashiyama bamboo grove",
        "Golden pavilion & gardens",
        "Gion old-town evening walk",
        "Traditional tea-ceremony experience",
    ],
}

CURATED_EVENTS = {
    "Tokyo": ["Autumn Koyo Lantern Festival", "Winter Illuminations Night", "Riverside Street-Food Matsuri"],
    "Kyoto": ["Arashiyama Light & Blossom Festival", "Autumn Leaves Night Viewing"],
    "Hakone": ["Hakone Mountain Autumn Bonfire"],
}

GENERIC_ACTIVITIES = [
    "City highlights walking tour",
    "Local food & market crawl",
    "Old town & heritage quarter",
    "Sunset viewpoint & skyline",
    "Museum & culture half-day",
]

GENERIC_EVENTS = [
    "Seasonal Night Market",
    "Riverside Light Festival",
    "Local Culture Carnival",
]
