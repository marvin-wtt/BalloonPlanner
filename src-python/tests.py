import pytest

# solver under test
from vehicle_solver import solve

"""Extended test‑suite for balloon_camp_solver
------------------------------------------------
Covers
• hard constraints: operator rules, capacity, weight, uniqueness
• frozen assignments (operator / passenger / absent)
• weight‑driven empty‑seat behaviour
"""


# ---------------------------------------------------------------------------
# Shared tiny instance (hard‑rule regression) --------------------------------
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def demo_data():
  """Return a manifest that exercises every hard constraint."""
  balloons = [
    {  # tight capacity + weight
      "id": "B01", "capacity": 3, "max_weight": 240,
      "allowed_operators": ["p1", "p2"],
    },
    {  # roomy balloon
      "id": "B02", "capacity": 4, "max_weight": 400,
      "allowed_operators": ["p3"],
    },
  ]
  cars = [
    {
      "id": "C01", "capacity": 4,
      "allowed_operators": ["p4", "p5", "p1"],  # many potential drivers
    }
  ]
  people = [
    {"id": "p1", "flights": 5, "nationality": "DE", "weight": 70},
    {"id": "p2", "flights": 2, "nationality": "FR", "weight": 70},
    {"id": "p3", "flights": 10, "nationality": "DE", "weight": 80},
    {"id": "p4", "flights": 1, "nationality": "FR", "weight": 90},
    {"id": "p5", "flights": 0, "nationality": "FR", "weight": 90},
    {"id": "p6", "flights": 6, "nationality": "DE", "weight": 75},
    {"id": "p7", "flights": 3, "nationality": "DE", "weight": 60},
    {"id": "p8", "flights": 8, "nationality": "NL", "weight": 85},
    {"id": "p9", "flights": 4, "nationality": "FR", "weight": 85},
  ]

  manifest = solve(balloons, cars, people, time_limit_s=5)
  vehicles_by_id = {v["id"]: v for v in balloons + cars}
  people_by_id = {p["id"]: p for p in people}
  return {"manifest": manifest, "vehicles": vehicles_by_id, "people": people_by_id}


# ---------------------------------------------------------------------------
# HARD CONSTRAINT TESTS -----------------------------------------------------
# ---------------------------------------------------------------------------

def test_one_operator_and_in_passengers(demo_data):
  for vid, crew in demo_data["manifest"].items():
    assert len(crew["operator"]) == 1, f"{vid} has !=1 operator"
    op = crew["operator"][0]
    assert op in crew["passengers"], f"{op} not counted as passenger in {vid}"


def test_operator_authorisation(demo_data):
  vehicles = demo_data["vehicles"]
  for vid, crew in demo_data["manifest"].items():
    allowed = set(vehicles[vid]["allowed_operators"])
    assert crew["operator"][0] in allowed, "unqualified operator"


def test_capacity(demo_data):
  vehicles = demo_data["vehicles"]
  for vid, crew in demo_data["manifest"].items():
    assert len(crew["passengers"]) <= vehicles[vid]["capacity"], "capacity overflow"


def test_weight(demo_data):
  veh = demo_data["vehicles"]
  ppl = demo_data["people"]
  for vid, crew in demo_data["manifest"].items():
    limit = veh[vid].get("max_weight", -1)
    if limit > 0:
      total = sum(ppl[p]["weight"] for p in crew["passengers"])
      assert total <= limit, f"{vid} overweight"  # operator already included


def test_person_uniqueness(demo_data):
  placement, operator_role = {}, {}
  for vid, crew in demo_data["manifest"].items():
    for p in crew["passengers"]:
      assert p not in placement, f"{p} in {placement[p]} and {vid}"
      placement[p] = vid
    for op in crew["operator"]:
      assert op not in operator_role, f"{op} operator in {operator_role[op]} and {vid}"
      operator_role[op] = vid


# ---------------------------------------------------------------------------
# WEIGHT‑DRIVEN EMPTY‑SEAT TEST ---------------------------------------------
# ---------------------------------------------------------------------------

def test_empty_seat_due_to_weight():
  """Balloon capacity 4 but max_weight allows only 3 × 80 kg."""
  balloons = [
    {"id": "B", "capacity": 4, "max_weight": 240, "allowed_operators": ["pilot"]}
  ]
  cars, people = [], []
  # pilot + 3 heavy pax (80 kg) + 1 light pax (50 kg) – light pax should be dropped
  people.extend([
    {"id": "pilot", "flights": 0, "nationality": "DE", "weight": 80},
    {"id": "p1", "flights": 0, "nationality": "DE", "weight": 80},
    {"id": "p2", "flights": 0, "nationality": "DE", "weight": 80},
    {"id": "p3", "flights": 0, "nationality": "DE", "weight": 80},
    {"id": "light", "flights": 0, "nationality": "DE", "weight": 50},
  ])

  manifest = solve(balloons, cars, people, time_limit_s=5)
  passengers = manifest["B"]["passengers"]
  assert len(passengers) == 3, "weight limit should leave one seat empty"


# ---------------------------------------------------------------------------
# FROZEN ASSIGNMENT TESTS ---------------------------------------------------
# ---------------------------------------------------------------------------

def test_frozen_passenger_and_absent():
  """Lock one passenger into a car and one person absent."""
  balloons = [
    {"id": "B", "capacity": 3, "allowed_operators": ["pilot"]}
  ]
  cars = [
    {"id": "C", "capacity": 2, "allowed_operators": ["driver", "pilot"]}
  ]
  people = [
    {"id": "pilot", "flights": 0, "nationality": "DE"},
    {"id": "driver", "flights": 0, "nationality": "DE"},
    {"id": "p_fixed", "flights": 0, "nationality": "NL"},
    {"id": "abs", "flights": 0, "nationality": "FR"},
  ]

  frozen = [
    {"person": "p_fixed", "vehicle": "C", "role": "passenger"},
    {"person": "abs", "vehicle": None, "role": "absent"},
  ]

  manifest = solve(balloons, cars, people, frozen=frozen, time_limit_s=5)

  assert "p_fixed" in manifest["C"]["passengers"], "frozen passenger moved"
  for crew in manifest.values():
    assert "abs" not in crew["passengers"], "absent person placed anyway"
