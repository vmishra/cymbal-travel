from fastapi.testclient import TestClient

from app.happy_path import SIM_SCRIPT
from app.main import app


def test_sim_script_covers_plan_edit_postsale():
    tools = [s["tool"] for s in SIM_SCRIPT if s.get("tool")]
    for t in ["set_trip_requirements", "plan_trip", "swap_hotel", "add_dinner",
              "add_activity", "rebook_flight"]:
        assert t in tools, f"missing {t} in sim script"


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
