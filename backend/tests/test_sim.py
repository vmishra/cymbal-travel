from fastapi.testclient import TestClient

from app.happy_path import CARE_SCRIPT, SIM_SCRIPT
from app.main import app


def test_presale_sim_script_covers_plan_and_edit():
    tools = [s["tool"] for s in SIM_SCRIPT if s.get("tool")]
    for t in ["set_trip_requirements", "plan_trip", "swap_hotel", "add_dinner", "add_activity"]:
        assert t in tools, f"missing {t} in pre-sale sim script"
    # Pre-sale is purely planning now — post-sale lives in its own scenario.
    assert "rebook_flight" not in tools and "open_care" not in tools


def test_care_sim_script_covers_post_sale_flow():
    tools = [s["tool"] for s in CARE_SCRIPT if s.get("tool")]
    for t in ["open_care", "reschedule_flight", "confirm_change_detail",
              "extend_hotel", "request_payment", "confirm_payment"]:
        assert t in tools, f"missing {t} in care sim script"


def test_care_sim_ws_streams_customer_context_then_payment():
    client = TestClient(app)
    with client.websocket_connect("/api/ws/sim?fast=1&scenario=postsale") as ws:
        ws.send_json({"kind": "start"})
        ui_types: list[str] = []
        while True:
            msg = ws.receive_json()
            if msg["kind"] == "ui":
                ui_types.append(msg["event"]["type"])
            elif msg["kind"] == "turn_complete":
                break
        assert "customer_context" in ui_types
        assert "pending_change" in ui_types
        assert "payment_confirmed" in ui_types
        assert ui_types.index("customer_context") < ui_types.index("payment_confirmed")


def test_sim_ws_streams_itinerary_set_then_edits():
    client = TestClient(app)
    with client.websocket_connect("/api/ws/sim?fast=1") as ws:
        ws.send_json({"kind": "start"})
        ui_types: list[str] = []
        while True:
            msg = ws.receive_json()
            if msg["kind"] == "ui":
                ui_types.append(msg["event"]["type"])
            elif msg["kind"] == "turn_complete":
                break
        assert "itinerary_set" in ui_types
        assert "item_swap" in ui_types
        assert ui_types.index("itinerary_set") < ui_types.index("item_swap")
