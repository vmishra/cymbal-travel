from app.domain import (
    Activity,
    Day,
    Flight,
    HotelStay,
    Traveller,
    Trip,
    is_over_budget,
    per_person_total,
)


def _trip(budget: int, items_by_day: list[list]) -> Trip:
    days = [Day(index=i, city="Tokyo", items=items) for i, items in enumerate(items_by_day)]
    return Trip(
        id="t1",
        title="Japan",
        origin="Bangalore",
        destinations=["Tokyo"],
        start_date="2026-12-10",
        nights=7,
        travellers=[Traveller(type="adult"), Traveller(type="child", age=8)],
        budget_per_person=budget,
        days=days,
    )


def test_per_person_total_sums_flights_stays_activities():
    trip = _trip(
        budget=200000,
        items_by_day=[
            [Flight(id="f1", title="BLR→NRT", price_inr=40000, airline="AeroNova",
                    origin="BLR", destination="NRT", depart="08:00", arrive="18:00")],
            [HotelStay(id="h1", title="Azure Grand", price_inr=30000, hotel="Azure Grand",
                       city="Tokyo", nights=3, check_in="2026-12-10")],
            [Activity(id="a1", title="Mt Fuji day trip", price_inr=5000, city="Hakone")],
        ],
    )
    assert per_person_total(trip) == 75000


def test_is_over_budget_true_when_total_exceeds_budget():
    trip = _trip(
        budget=50000,
        items_by_day=[[Activity(id="a1", title="x", price_inr=60000, city="Tokyo")]],
    )
    assert is_over_budget(trip) is True


def test_is_over_budget_false_at_or_under():
    at = _trip(budget=60000, items_by_day=[[Activity(id="a1", title="x", price_inr=60000, city="Tokyo")]])
    under = _trip(budget=60000, items_by_day=[[Activity(id="a2", title="y", price_inr=10000, city="Tokyo")]])
    assert is_over_budget(at) is False
    assert is_over_budget(under) is False
