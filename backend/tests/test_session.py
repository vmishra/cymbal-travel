import pytest

from app.domain import Activity, Day, HotelStay, Option, Traveller, Trip, per_person_total
from app.session import ItineraryError, ItinerarySession


def _base_trip() -> Trip:
    return Trip(
        id="t1",
        title="Japan",
        origin="Bangalore",
        destinations=["Tokyo"],
        start_date="2026-12-10",
        nights=3,
        travellers=[Traveller(type="adult"), Traveller(type="child", age=8)],
        budget_per_person=200000,
        days=[
            Day(index=0, city="Tokyo", items=[
                HotelStay(id="h1", title="Azure Grand", price_inr=30000, hotel="Azure Grand",
                          city="Tokyo", nights=3, check_in="2026-12-10"),
            ]),
        ],
    )


def test_add_then_remove_item():
    s = ItinerarySession(_base_trip())
    s.add_item(0, Activity(id="a1", title="Shibuya walk", price_inr=2000, city="Tokyo"))
    assert any(it.id == "a1" for it in s.trip.days[0].items)
    s.remove_item("a1")
    assert all(it.id != "a1" for it in s.trip.days[0].items)


def test_swap_item_updates_total():
    s = ItinerarySession(_base_trip())
    before = per_person_total(s.trip)
    s.swap_item("h1", Option(id="o9", category="hotel", name="Meridian Grand",
                             tier="premium", price_inr=50000))
    after = per_person_total(s.trip)
    assert after - before == 20000
    assert s.trip.stays[0].hotel == "Meridian Grand"


def test_remove_missing_item_raises_ItineraryError():
    s = ItinerarySession(_base_trip())
    with pytest.raises(ItineraryError):
        s.remove_item("does-not-exist")


def test_reorder_day_preserves_items():
    s = ItinerarySession(_base_trip())
    s.add_item(0, Activity(id="a1", title="A", price_inr=1000, city="Tokyo"))
    s.add_item(0, Activity(id="a2", title="B", price_inr=1000, city="Tokyo"))
    s.reorder_day(0, ["a2", "h1", "a1"])
    assert [it.id for it in s.trip.days[0].items] == ["a2", "h1", "a1"]


def test_add_night_adds_stay_and_day():
    s = ItinerarySession(_base_trip())
    days_before = len(s.trip.days)
    nights_before = s.trip.stays[0].nights
    s.add_night("Tokyo")
    assert len(s.trip.days) == days_before + 1
    assert s.trip.stays[0].nights == nights_before + 1
