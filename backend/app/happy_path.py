"""The scripted Japan happy path — one continuous narrative: plan -> live-edit ->
post-sale. Replayed by the sim pipeline (and used to seed the guided demo). Each
step: {delay_ms, speaker, text, tool, args}. `tool=None` means speak only.
"""
from __future__ import annotations

REQUIREMENTS = {
    "title": "Japan with family",
    "origin": "Bangalore",
    "destinations": ["Tokyo", "Hakone", "Kyoto"],
    "nights": 7,
    "start_date": "2026-12-10",
    "budget_per_person": 200000,
    "travellers": [{"type": "adult"}, {"type": "adult"}, {"type": "child", "age": 8}],
    "pace": "leisure",
    "must_dos": ["Mount Fuji", "Bullet train", "A seasonal festival"],
}

SIM_SCRIPT: list[dict] = [
    {"delay_ms": 400, "speaker": "user", "tool": None,
     "text": "Plan a seven-night, eight-day family trip to Japan from Bangalore, for me "
             "and my eight-year-old son. Budget around two lakh per person. Cover three or "
             "four cities, keep it leisurely — I want to see Mount Fuji, ride the bullet "
             "train, and catch a popular seasonal event."},
    {"delay_ms": 700, "speaker": "assistant", "tool": "set_trip_requirements", "args": REQUIREMENTS,
     "text": "Love it — a leisurely eight-day Japan trip for three, with Mount Fuji and the "
             "bullet train. Let me get to work."},
    {"delay_ms": 600, "speaker": "assistant", "tool": "plan_trip", "args": {},
     "text": "Firing up the Flights, Hotels, Itinerary and Events agents in parallel, "
             "grounding in Maps, Search and WeatherNext."},
    {"delay_ms": 2200, "speaker": "assistant", "tool": None,
     "text": "Here's your itinerary: Tokyo, a Mount Fuji day from Hakone, then the bullet "
             "train to Kyoto — all comfortably under budget."},
    {"delay_ms": 1600, "speaker": "user", "tool": "swap_hotel", "args": {"city": "Tokyo", "tier": "premium"},
     "text": "Swap the Tokyo hotel for something more premium."},
    {"delay_ms": 1400, "speaker": "assistant", "tool": "add_dinner",
     "args": {"city": "Tokyo", "name": "a local ramen house", "day_index": 1},
     "text": "Done. Adding a ramen dinner on your second night too."},
    {"delay_ms": 1400, "speaker": "user", "tool": "add_activity",
     "args": {"city": "Kyoto", "name": "Traditional tea-ceremony experience"},
     "text": "And add a tea ceremony in Kyoto."},
    {"delay_ms": 1200, "speaker": "assistant", "tool": None,
     "text": "Your updated itinerary is ready."},
    {"delay_ms": 1500, "speaker": "assistant", "tool": "switch_mode", "args": {"mode": "postsale"},
     "text": "Now let's look at post-sale support."},
    {"delay_ms": 1200, "speaker": "user", "tool": "report_disruption", "args": {},
     "text": "My Tokyo flight is delayed — find me alternatives."},
    {"delay_ms": 1600, "speaker": "user", "tool": "rebook_flight", "args": {"tier": "comfort"},
     "text": "Rebook me on the next good option."},
    {"delay_ms": 900, "speaker": "assistant", "tool": None,
     "text": "You're rebooked, and your itinerary has healed around the new flight."},
]
