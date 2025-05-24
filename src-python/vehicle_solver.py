"""Balloon‑camp crew optimiser
================================
A single‐slot (one flight) solver with:
• **Hard rules**
  – exactly one qualified operator per occupied vehicle
  – every passenger (incl. operator) occupies a seat
  – seat‑capacity and optional max‑weight per vehicle
  – each person appears in ≤ 1 vehicle and operates ≤ 1 vehicle
  – optional *frozen* assignments (operator / passenger / absent)
• **Soft rules** (linear objective)
  – give airtime to low‑flight pilots (w_fair)
  – prefer low‑flight passengers in balloons (w_low_flights)
  – reward mixed nationalities in each vehicle (w_diversity)
  – discourage putting someone in the same vehicle again (w_new_vehicle)

All weights are user‑tunable kwargs.

Dependencies: `ortools>=9.9`.  Run the smoke‑test at bottom to verify.
"""

from itertools import product, combinations
from collections import defaultdict
from typing import List, Dict, Any, Optional

from ortools.sat.python import cp_model


# ---------------------------------------------------------------------------
# Public API ----------------------------------------------------------------
# ---------------------------------------------------------------------------


def solve(
    balloons: List[Dict[str, Any]],
    cars: List[Dict[str, Any]],
    people: List[Dict[str, Any]],
    *,
    frozen: Optional[List[Dict[str, str]]] = None,
    past_flights: Optional[List[Dict[str, Any]]] = None,
    # soft‑rule weights ------------------------------------------------------
    w_fair: int = 1,
    w_low_flights: int = 10,
    w_diversity: int = 3,
    w_new_vehicle: int = 5,
    # misc -------------------------------------------------------------------
    default_person_weight: int = 70,
    time_limit_s: int = 30,
):
    """Return a manifest *{vehicle_id: {operator: [...], passengers: [...]}}*.

    Args
    ----
    balloons, cars
        Input records.  Each vehicle dict **may** include
        * ``max_weight``     – hard upper weight limit (kg)
        * ``allowed_operators`` – list of person‑ids qualified for that vehicle
    people
        Each dict must contain ``id``, ``flights`` and ``nationality``; an
        optional ``weight`` overrides *default_person_weight*.
    frozen
        List of partial assignments, each of the form
        ``{"person":"p1", "vehicle":"B01", "role":"operator"}``.
        Roles: ``operator`` | ``passenger``
    past_flights
        Historic manifests.  Used only for the *w_new_vehicle* soft rule.
    """
    frozen = frozen or []  # normalise to list

    # ------------------------------------------------------------------
    # 0. Flatten vehicle & person data into quick look‑ups --------------
    # ------------------------------------------------------------------
    vehicles: List[Dict[str, Any]] = [dict(**b, kind="balloon") for b in balloons] + [
        dict(**c, kind="car") for c in cars
    ]

    people_by_id = {p["id"]: p for p in people}
    vehicles_by_id = {v["id"]: v for v in vehicles}

    person_ids = list(people_by_id)
    vehicle_ids = list(vehicles_by_id)

    # scalar parameters -------------------------------------------------
    person_weight = {
        p_id: people_by_id[p_id].get("weight", default_person_weight)
        for p_id in person_ids
    }
    flights_so_far = {p_id: people_by_id[p_id]["flights"] for p_id in person_ids}
    nationality = {p_id: people_by_id[p_id]["nationality"] for p_id in person_ids}
    is_counselor = {
        p_id: people_by_id[p_id]["role"] == "counselor" for p_id in person_ids
    }

    capacity = {v_id: vehicles_by_id[v_id]["capacity"] for v_id in vehicle_ids}
    kind = {v_id: vehicles_by_id[v_id]["kind"] for v_id in vehicle_ids}
    allowed = {
        v_id: set(vehicles_by_id[v_id]["allowed_operators"]) for v_id in vehicle_ids
    }
    max_weight = {
        v_id: vehicles_by_id[v_id].get("max_weight", -1) for v_id in vehicle_ids
    }

    # historic occupancy map -------------------------------------------
    seen_on_vehicle: Dict[str, set] = defaultdict(set)
    if past_flights:
        for flight in past_flights:
            for group in flight["groups"]:
                balloon = group["balloon"]
                b_id = balloon["id"]
                o_id = balloon["operator"]
                seen_on_vehicle[o_id].add(b_id)
                for p_id in balloon["passengers"]:
                    seen_on_vehicle[p_id].add(b_id)
                # Add Cars
                for car in group["cars"]:
                    c_id = car["id"]
                    o_id = car["operator"]
                    seen_on_vehicle[o_id].add(c_id)
                    for p_id in car["passengers"]:
                        seen_on_vehicle[p_id].add(c_id)

    # ------------------------------------------------------------------
    # 1. Model and decision variables ----------------------------------
    # ------------------------------------------------------------------
    model = cp_model.CpModel()

    op = {  # operator‑selection vars
        (p, v): model.NewBoolVar(f"op_{p}_{v}")
        for p, v in product(person_ids, vehicle_ids)
    }
    pax = {  # passenger‑seat vars (operator counts as passenger)
        (p, v): model.NewBoolVar(f"pax_{p}_{v}")
        for p, v in product(person_ids, vehicle_ids)
    }

    # ------------------------------------------------------------------
    # 2. Hard constraints ----------------------------------------------
    # ------------------------------------------------------------------
    # 2.1 each person exactly one seat / one operator role
    for p in person_ids:
        model.Add(sum(pax[p, v] for v in vehicle_ids) == 1)
        # model.Add(sum(op[p, v] for v in vehicle_ids) == 1)

    # 2.2 operator ⇒ passenger + operator eligibility
    for p, v in product(person_ids, vehicle_ids):
        model.AddImplication(op[p, v], pax[p, v])
        if p not in allowed[v]:
            model.Add(op[p, v] == 0)

    # 2.3 capacity limit
    for v in vehicle_ids:
        model.Add(sum(pax[p, v] for p in person_ids) <= capacity[v])

    # 2.4 weight limit (skip if vehicle has no max_weight)
    for v in vehicle_ids:
        if max_weight[v] > 0:
            model.Add(
                sum(person_weight[p] * pax[p, v] for p in person_ids) <= max_weight[v]
            )

    # 2.5 occupancy flag & exactly‑one operator if occupied
    occupied = {v: model.NewBoolVar(f"occ_{v}") for v in vehicle_ids}
    for v in vehicle_ids:
        model.Add(sum(pax[p, v] for p in person_ids) >= 1).OnlyEnforceIf(occupied[v])
        model.Add(sum(pax[p, v] for p in person_ids) == 0).OnlyEnforceIf(
            occupied[v].Not()
        )

        model.Add(sum(op[p, v] for p in person_ids) == 1).OnlyEnforceIf(occupied[v])
        model.Add(sum(op[p, v] for p in person_ids) == 0).OnlyEnforceIf(
            occupied[v].Not()
        )

    # 2.6 frozen partial solution --------------------------------------
    for lock in frozen:
        p = lock["person"]
        role = lock["role"]
        if role == "operator":
            v = lock["vehicle"]
            model.Add(op[p, v] == 1)
            model.Add(pax[p, v] == 1)  # takes a seat too
        elif role == "passenger":
            v = lock["vehicle"]
            model.Add(pax[p, v] == 1)
            model.Add(op[p, v] == 0)
        else:
            raise ValueError(f"unknown frozen role: {role}")

    # ------------------------------------------------------------------
    # 3. Soft objective -------------------------------------------------
    # ------------------------------------------------------------------
    objective_terms = []

    # 3.1 Fair pilot airtime — reward low‑flight pilots becoming operator
    max_prev_flights = max(flights_so_far.values()) + 1
    for p, v in product(person_ids, vehicle_ids):
        if p in allowed[v]:
            score = max_prev_flights - flights_so_far[p]  # bigger if fewer flights
            objective_terms.append(-w_fair * score * op[p, v])

    # 3.2 Low‑flight passengers in balloons
    for p, v in product(person_ids, vehicle_ids):
        if kind[v] == "balloon":
            score = max_prev_flights - flights_so_far[p]
            objective_terms.append(-w_low_flights * score * pax[p, v])

    # 3.3 Diversity bonus — count mixed‑nationality pairs inside v
    for v in vehicle_ids:
        for p1, p2 in combinations(person_ids, 2):
            if nationality[p1] == nationality[p2]:
                continue  # skip same‑nation pair
            pair_var = model.NewBoolVar(f"mix_{p1}_{p2}_{v}")
            model.AddMinEquality(pair_var, [pax[p1, v], pax[p2, v]])
            objective_terms.append(-w_diversity * pair_var)

    # 3.4 Fresh vehicle bonus (avoid repeats)
    # pax − op  == 1 for passengers, 0 for drivers/operators, 0 when not seated
    for p, v in product(person_ids, vehicle_ids):
        if v not in seen_on_vehicle[p]:
            expr = pax[p, v] - op[p, v]
            objective_terms.append(-w_new_vehicle * expr)

    model.Minimize(sum(objective_terms))

    # ------------------------------------------------------------------
    # 4. Solve ----------------------------------------------------------
    # ------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_s
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("No feasible assignment found.")

    # ------------------------------------------------------------------
    # 5. Build manifest -------------------------------------------------
    # ------------------------------------------------------------------
    manifest: Dict[str, Dict[str, List[str]]] = {
        v: {"operator": [], "passengers": []} for v in vehicle_ids
    }
    for p, v in product(person_ids, vehicle_ids):
        if solver.BooleanValue(op[p, v]):
            manifest[v]["operator"] = p
            continue
        if solver.BooleanValue(pax[p, v]):
            manifest[v]["passengers"].append(p)

    return manifest


# ---------------------------------------------------------------------------
# Smoke‑test ---------------------------------------------------------------
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    demo_balloons = [
        {
            "id": "B01",
            "capacity": 3,
            "allowed_operators": ["pilotA", "pilotB"],
            "max_weight": 250,
        },
        {
            "id": "B02",
            "capacity": 4,
            "allowed_operators": ["pilotC"],
            "max_weight": 350,
        },
    ]
    demo_cars = [
        {"id": "C01", "capacity": 4, "allowed_operators": ["driverA", "pilotA"]},
    ]
    demo_people = [
        {"id": "pilotA", "flights": 10, "nationality": "DE", "weight": 80},
        {"id": "pilotB", "flights": 5, "nationality": "NL", "weight": 75},
        {"id": "pilotC", "flights": 0, "nationality": "FR", "weight": 78},
        {"id": "driverA", "flights": 1, "nationality": "BE", "weight": 85},
        {"id": "p1", "flights": 2, "nationality": "DE", "weight": 70},
        {"id": "p2", "flights": 0, "nationality": "FR", "weight": 68},
        {"id": "p3", "flights": 3, "nationality": "NL", "weight": 90},
        {"id": "p4", "flights": 4, "nationality": "DE", "weight": 65},
    ]

    import json
    import sys

    json.dump(
        {
            "balloons": demo_balloons,
            "cars": demo_cars,
            "people": demo_people,
        },
        sys.stdout,
    )

    from pprint import pprint

    pprint(solve(demo_balloons, demo_cars, demo_people))
