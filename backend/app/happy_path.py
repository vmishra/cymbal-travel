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
    {"delay_ms": 1200, "speaker": "assistant", "tool": None,
     "text": "Your itinerary's all set, comfortably under budget. Once you've booked, you can call me "
             "anytime to change things — I'm right here."},
]


# --- Post-sale "Cymbal Care": a mid-trip customer support call --------------- #
# A separate scripted scenario (scenario=postsale) that drives the Care screen:
# locate the caller → extend a day → move the flight → confirm details → extend
# the hotel → pay with the authorized card. Runs through the SAME real tools.
CARE_SCRIPT: list[dict] = [
    {"delay_ms": 300, "speaker": "assistant", "tool": "open_care", "args": {},
     "text": "Namaste, Cymbal Care — ek second, main aapki booking nikaalti hoon…"},
    {"delay_ms": 2200, "speaker": "assistant", "tool": None,
     "text": "Mil gayi, Vikas ji. You're on Day three of your Japan trip, currently in Tokyo. "
             "Tell me, how can I help?"},
    {"delay_ms": 1400, "speaker": "user", "tool": None,
     "text": "We're loving Tokyo — I'd like to stay one more day here. Can you move our onward flight?"},
    {"delay_ms": 1000, "speaker": "assistant", "tool": None,
     "text": "Of course, ji. May I ask the reason for the change, just for our records?"},
    {"delay_ms": 1500, "speaker": "user", "tool": None,
     "text": "Nothing major — we just want an extra day to explore."},
    {"delay_ms": 900, "speaker": "assistant", "tool": "reschedule_flight", "args": {"when": "the next day"},
     "text": "Bilkul samajh sakti hoon. Let me check the same non-stop for the next day…"},
    {"delay_ms": 2000, "speaker": "assistant", "tool": None,
     "text": "Got it — the same non-stop a day later. There's a small fare difference of about ten "
             "thousand rupees. Shall I keep your seats and meals the same?"},
    {"delay_ms": 1500, "speaker": "user", "tool": None,
     "text": "Yes, keep the same seats and meals — three of us as before."},
    {"delay_ms": 900, "speaker": "assistant", "tool": "confirm_change_detail", "args": {},
     "text": "Done — same seats together, vegetarian meals, all three travellers."},
    {"delay_ms": 1300, "speaker": "assistant", "tool": None,
     "text": "And since you're staying a night longer — shall I extend your current hotel, or find one "
             "near the airport for an easy departure?"},
    {"delay_ms": 1600, "speaker": "user", "tool": None,
     "text": "Just extend our current hotel, please."},
    {"delay_ms": 900, "speaker": "assistant", "tool": "extend_hotel", "args": {"city": "Tokyo"},
     "text": "Ho gaya — ek aur raat at the same hotel in Tokyo."},
    {"delay_ms": 1500, "speaker": "assistant", "tool": "request_payment", "args": {},
     "text": "So, to summarise: your onward flight moves a day later, with one extra night in Tokyo. "
             "May I charge your authorized card ending four-two-four-two, or use a different method?"},
    {"delay_ms": 1600, "speaker": "user", "tool": None,
     "text": "Use the same card, that's fine."},
    {"delay_ms": 900, "speaker": "assistant", "tool": "confirm_payment", "args": {"tier": "comfort"},
     "text": "Charging it now…"},
    {"delay_ms": 1500, "speaker": "assistant", "tool": None,
     "text": "All done, Vikas ji — everything's rebooked end-to-end and your confirmation is on screen. "
             "Enjoy that extra day in Tokyo. Main yahin hoon, kuch aur ho to bataaiye."},
]
