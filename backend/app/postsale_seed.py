"""A pre-booked trip so post-sale mode works standalone (no planning first)."""
from __future__ import annotations

BOOKED_REQUIREMENTS = {
    "title": "Japan — booked",
    "origin": "Bangalore",
    "destinations": ["Tokyo", "Hakone", "Kyoto"],
    "nights": 7,
    "start_date": "2026-12-10",
    "budget_per_person": 200000,
    "travellers": [{"type": "adult"}, {"type": "adult"}, {"type": "child", "age": 8}],
    "pace": "leisure",
    "must_dos": ["Mount Fuji", "Bullet train"],
}
