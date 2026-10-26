import re

from app.domain import Option
from app.mock_services import get_activities, get_events, get_flights, get_hotels

REAL_BRANDS = [
    "marriott", "hilton", "hyatt", "taj", "oberoi", "indigo", "air india",
    "emirates", "vistara", "spicejet", "lufthansa", "ana", "jal", "booking",
    "makemytrip", "expedia", "airbnb", "radisson", "novotel",
]


def test_get_flights_returns_4_to_5():
    opts = get_flights("BLR", "NRT", "2026-12-10", 3)
    assert 4 <= len(opts) <= 5
    assert all(isinstance(o, Option) for o in opts)
    assert all(o.price_inr > 0 for o in opts)


def test_options_span_price_tiers():
    for fn in (get_flights("BLR", "NRT", "2026-12-10", 3),
               get_hotels("Tokyo", 3, 3),
               get_activities("Tokyo"),
               get_events("Tokyo", "December")):
        tiers = {o.tier for o in fn}
        assert {"value", "comfort", "premium"}.issubset(tiers)


def test_names_are_generic():
    names = []
    names += [o.name for o in get_flights("BLR", "NRT", "2026-12-10", 3)]
    names += [o.name for o in get_hotels("Tokyo", 3, 3)]
    names += [o.name for o in get_activities("Tokyo")]
    names += [o.name for o in get_events("Tokyo", "December")]
    lowered = " ".join(names).lower()
    for brand in REAL_BRANDS:
        assert not re.search(rf"\b{re.escape(brand)}\b", lowered), f"real brand leaked: {brand}"


def test_deterministic_same_args_same_ids():
    a = get_hotels("Tokyo", 3, 3)
    b = get_hotels("Tokyo", 3, 3)
    assert [o.id for o in a] == [o.id for o in b]
    assert [o.price_inr for o in a] == [o.price_inr for o in b]


def test_unknown_city_uses_generic_fallback():
    opts = get_hotels("Atlantis", 2, 2)
    assert 4 <= len(opts) <= 5
    assert all(o.price_inr > 0 for o in opts)
    acts = get_activities("Atlantis")
    assert 4 <= len(acts) <= 5
