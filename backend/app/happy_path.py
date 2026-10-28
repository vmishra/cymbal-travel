"""The scripted Japan rehearsal — one continuous narrative: plan → enrich →
live-edit → ask cost → post-sale. Replayed by the sim pipeline through the SAME
real tools the live voice uses (no fake delays). Isha speaks chic Hinglish. Each
step: {delay_ms, speaker, text, tool, args}. tool=None means speak only.
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
     "text": "Plan a seven-night, eight-day family trip to Japan from Bangalore, for me and my "
             "eight-year-old son. Budget around two lakh per person. Three or four cities, leisurely — "
             "I want Mount Fuji, the bullet train, and a popular seasonal event."},
    {"delay_ms": 700, "speaker": "assistant", "tool": "set_trip_requirements", "args": REQUIREMENTS,
     "text": "Ooh, a December Japan trip with the little one — love it! So basically Tokyo, a Fuji day, "
             "then the bullet train to Kyoto. Ek second, let me put it all together…"},
    {"delay_ms": 600, "speaker": "assistant", "tool": "plan_trip", "args": {},
     "text": "Okay so I'm firing up my Flights, Hotels, Itinerary and Events agents in parallel, "
             "grounding in Maps, Search and WeatherNext."},
    {"delay_ms": 2600, "speaker": "assistant", "tool": None,
     "text": "Done! Seven nights across Tokyo, Hakone and Kyoto — and trust me, December weather there "
             "is just gorgeous. All comfortably under your budget."},
    {"delay_ms": 1500, "speaker": "user", "tool": "get_cost_summary", "args": {},
     "text": "Nice — what's the total cost looking like?"},
    {"delay_ms": 900, "speaker": "assistant", "tool": None,
     "text": "So per person it's about one-point-five lakh — flights and hotels are the big chunks, "
             "and you've still got room to splurge a little."},
    {"delay_ms": 1500, "speaker": "user", "tool": "swap_hotel", "args": {"city": "Tokyo", "tier": "premium"},
     "text": "Let's make the Tokyo hotel a bit more premium."},
    {"delay_ms": 1300, "speaker": "assistant", "tool": "add_dinner",
     "args": {"city": "Tokyo", "name": "a local ramen house", "day_index": 1},
     "text": "Done — upgraded to a lovely one near the station. And suno, I'm adding a cosy ramen dinner "
             "on night two, your son will love it."},
    {"delay_ms": 1400, "speaker": "user", "tool": "add_activity",
     "args": {"city": "Kyoto", "name": "Traditional tea-ceremony experience"},
     "text": "Can we add a tea ceremony in Kyoto?"},
    {"delay_ms": 1300, "speaker": "assistant", "tool": "get_packing_list", "args": {"city": "Kyoto"},
     "text": "Added! And since Kyoto evenings get crisp in December, here's a quick packing list too."},
    {"delay_ms": 1600, "speaker": "assistant", "tool": "switch_mode", "args": {"mode": "postsale"},
     "text": "And once you've booked, you can just call me to change things — dekhiye."},
    {"delay_ms": 1200, "speaker": "user", "tool": "reschedule_flight", "args": {"when": "a later flight"},
     "text": "Actually, can you move my Tokyo flight to a later one?"},
    {"delay_ms": 1800, "speaker": "assistant", "tool": None,
     "text": "Ek second… okay, I found a few later options. The comfort non-stop looks best for you — "
             "shall I lock it in?"},
    {"delay_ms": 1400, "speaker": "user", "tool": "rebook_flight", "args": {"tier": "comfort"},
     "text": "Perfect, book that one."},
    {"delay_ms": 900, "speaker": "assistant", "tool": None,
     "text": "Done! You're rebooked end-to-end — your confirmation reference is on screen. "
             "Anything else, main yahin hoon."},
]
