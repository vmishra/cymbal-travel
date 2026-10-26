"""Static, brand-neutral seed pools for the mock travel services.

Rich curated content for the happy-path cities (Tokyo / Hakone / Kyoto) plus
generic pools + generators used for ANY other city. All names are invented or
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
HOTEL_DESCRIPTORS = [
    "with skyline views and a rooftop lounge",
    "a quiet boutique stay near the old quarter",
    "steps from the metro and the best cafés",
    "by the waterfront with a spa and pool",
    "a design hotel loved by families",
    "calm, green, and walkable to everything",
]

# Curated activities: {name, desc, duration}
CURATED_ACTIVITIES = {
    "Tokyo": [
        {"name": "Shibuya & Harajuku street walk", "desc": "The famous crossing, teen-fashion lanes and a crepe stop.", "duration": "3 hrs"},
        {"name": "Immersive digital-art museum", "desc": "Room-scale light installations kids and adults both love.", "duration": "2.5 hrs"},
        {"name": "Hands-on sushi-making class", "desc": "Roll your own with a local chef, lunch included.", "duration": "2 hrs"},
        {"name": "Asakusa & Senso-ji temple morning", "desc": "Tokyo's oldest temple and the Nakamise market lane.", "duration": "3 hrs"},
        {"name": "Akihabara pop-culture tour", "desc": "Anime, arcades and gadget streets — a hit with kids.", "duration": "2.5 hrs"},
    ],
    "Hakone": [
        {"name": "Mount Fuji viewpoint lake cruise", "desc": "A pirate-ship cruise on Lake Ashi with Fuji on a clear day.", "duration": "1.5 hrs"},
        {"name": "Open-air sculpture park", "desc": "Art in the hills with a kids' play maze.", "duration": "2.5 hrs"},
        {"name": "Owakudani volcanic valley ropeway", "desc": "Steam vents, black eggs, and sweeping Fuji views.", "duration": "2 hrs"},
        {"name": "Lake Ashi scenic ferry", "desc": "Gentle crossing framed by the red torii gate.", "duration": "1 hr"},
        {"name": "Hot-spring onsen afternoon", "desc": "A family-friendly onsen to unwind after the climb.", "duration": "2 hrs"},
    ],
    "Kyoto": [
        {"name": "Fushimi Inari shrine hike", "desc": "The endless vermilion torii gates up the hillside.", "duration": "2.5 hrs"},
        {"name": "Arashiyama bamboo grove", "desc": "The towering bamboo path and riverside town.", "duration": "2 hrs"},
        {"name": "Golden pavilion & zen gardens", "desc": "Kinkaku-ji shimmering over its reflecting pond.", "duration": "1.5 hrs"},
        {"name": "Gion old-town evening walk", "desc": "Lantern-lit lanes in the historic geisha district.", "duration": "2 hrs"},
        {"name": "Traditional tea-ceremony experience", "desc": "A calm matcha ceremony in a machiya townhouse.", "duration": "1.5 hrs"},
    ],
}

CURATED_EVENTS = {
    "Tokyo": [
        {"name": "Autumn Koyo Lantern Festival", "desc": "Maple-leaf illuminations along the river."},
        {"name": "Winter Illuminations Night", "desc": "Millions of lights across the city gardens."},
        {"name": "Riverside Street-Food Matsuri", "desc": "A weekend food festival with live music."},
    ],
    "Kyoto": [
        {"name": "Arashiyama Light & Blossom Festival", "desc": "The bamboo grove lit up after dark."},
        {"name": "Autumn Leaves Night Viewing", "desc": "Temples open late among the red maples."},
    ],
    "Hakone": [{"name": "Hakone Mountain Autumn Bonfire", "desc": "A hillside bonfire with Fuji behind."}],
}

GENERIC_ACTIVITY_TEMPLATES = [
    ("{city} old town & markets walk", "A guided stroll through {city}'s historic heart and local bazaars.", "3 hrs"),
    ("Street-food crawl in {city}", "Taste {city}'s best bites with a local foodie guide.", "2.5 hrs"),
    ("Day trip around {city}", "A scenic half-day escape to the countryside near {city}.", "5 hrs"),
    ("Sunset viewpoint over {city}", "The city's favourite spot to watch the sky turn gold.", "1.5 hrs"),
    ("Museums & heritage of {city}", "The landmark museum and a heritage quarter of {city}.", "3 hrs"),
    ("Hidden-gems local tour of {city}", "Backstreets, cafés and photo spots only locals know.", "2.5 hrs"),
]

GENERIC_EVENT_TEMPLATES = [
    ("{city} Night Market", "A buzzing evening market with food and crafts."),
    ("{city} Riverside Light Festival", "Seasonal lights and performances along the water."),
    ("{city} Culture Carnival", "A lively weekend of music, dance and street food."),
]

# Coordinates for map pins (curated cities + common Indian origins).
CITY_COORDS = {
    "Tokyo": (35.6762, 139.6503), "Hakone": (35.2324, 139.1069), "Kyoto": (35.0116, 135.7681),
    "Osaka": (34.6937, 135.5023), "Bangalore": (12.9716, 77.5946), "Delhi": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777), "Bali": (-8.4095, 115.1889), "Paris": (48.8566, 2.3522),
    "Dubai": (25.2048, 55.2708), "Singapore": (1.3521, 103.8198), "Bangkok": (13.7563, 100.5018),
}

# --- weather -------------------------------------------------------------- #
WEATHER_CONDITIONS = [
    ("Clear & sunny", "☀️"), ("Partly cloudy", "⛅"), ("Crisp & cool", "🍂"),
    ("Warm & humid", "🌤️"), ("Light showers", "🌦️"), ("Cool & breezy", "🍃"),
]

# --- packing -------------------------------------------------------------- #
BASE_PACKING = ["Passport & copies", "Universal power adapter", "Chargers + power bank", "Comfortable walking shoes"]
PACKING_BY_CONDITION = {
    "Clear & sunny": ["Sunglasses & SPF", "Light breathable clothes", "A hat"],
    "Partly cloudy": ["A light layer for evenings", "Compact umbrella"],
    "Crisp & cool": ["A warm jacket", "Scarf & light gloves", "Layers"],
    "Warm & humid": ["Breathable cottons", "SPF & a cap", "Refillable water bottle"],
    "Light showers": ["Compact umbrella", "A light rain jacket", "Quick-dry shoes"],
    "Cool & breezy": ["A windbreaker", "A light sweater"],
}
