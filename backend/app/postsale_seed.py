"""A pre-booked trip + customer profile so post-sale ("Cymbal Care") works
standalone (no planning first). Brand-neutral; ₹ pricing; India origin."""
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

# The caller on the line — a customer mid-trip ringing post-sale support.
CUSTOMER = {
    "name": "Vikas Mishra",
    "party": "2 adults · 1 child",
    "booking_ref": "CYMBAL-7K2D",
    "loyalty": "Cymbal Gold",
    "phone": "+91 98•• ••• 210",
    "current_day_index": 2,          # zero-based → Day 3 of the trip
    "seats": "14A · 14B · 14C",
    "meal": "Vegetarian",
    "payment": {"brand": "Visa", "last4": "4242", "holder": "Vikas Mishra",
                "label": "authorized card on file"},
}

# A realistic airline change fee / fare difference for the demo (per person, ₹).
FLIGHT_CHANGE_FEE = 10000
