"""Balloon‑camp crew optimiser
================================
A single‑slot (one flight) solver with:

• Hard rules
  – exactly one qualified operator per occupied vehicle
  – every passenger (incl. operator) occupies a seat
  – seat‑capacity and optional max‑weight per vehicle
  – each person appears in ≤ 1 vehicle and operates ≤ 1 vehicle
  – optional *frozen* assignments (operator / passenger / absent)

• Soft rules (linear objective)
  – give airtime to low‑flight pilots (w_pilot_fairness)
  – prefer low‑flight passengers in balloons (w_passenger_fairness)
  – reward mixed nationalities in each vehicle (w_divers_nationalities)
  – discourage “same vehicle again” (w_vehicle_rotation)
  – discourage exactly one participant alone in a car (w_no_solo_participant)
  – cluster balance terms for leg 1 and leg 2

All weights are user‑tunable kwargs.
"""

from itertools import product
from collections import defaultdict
from typing import List, Dict, Any, Optional

from ortools.sat.python import cp_model


# ---------------------------------------------------------------------------
# Main one-leg solver (sequential-leg workflow)
# ---------------------------------------------------------------------------
def solve(
    balloons: List[Dict[str, Any]],
    cars: List[Dict[str, Any]],
    people: List[Dict[str, Any]],
    cluster: Optional[Dict[str, List[str]]] = None,
    *,
    frozen: Optional[List[Dict[str, str]]] = None,
    past_flights: Optional[List[Dict[str, Any]]] = None,
    leg: int = None,
    # soft weights
    w_pilot_fairness: int,
    w_passenger_fairness: int,
    w_no_solo_participant: int,
    w_divers_nationalities: int,
    w_cluster_passenger_balance: int,
    w_vehicle_rotation: int,
    w_low_flights_second_leg: int,
    w_overweight_second_leg: int,
    w_language_mismatch: int,
    counselor_flight_discount: int,
    # misc
    default_person_weight: int,
    time_limit_s: int,
    num_search_workers: int = 8,
    random_seed: Optional[int] = None,
):
    """Solve a *single* leg; call once per flight."""
    frozen = frozen or []
    past_flights = past_flights or []

    # ------------------------------------------------------------------
    # 0. Input validation
    # ------------------------------------------------------------------
    if w_overweight_second_leg < 0:
        raise ValueError("w_overweight_second_leg must be non-negative")
    if default_person_weight < 0:
        raise ValueError("default_person_weight must be non-negative")
    if time_limit_s <= 0:
        raise ValueError("time_limit_s must be positive")
    if leg is not None and (leg > 2 or leg < 0):
        raise ValueError("leg must be 0, 1, or 2")
    if leg is not None and leg > 1 and len(past_flights) == 0:
        raise ValueError("Flight history must be provided for multi-leg flights")
    if cluster is None:
        raise ValueError("Cluster must be provided")

    # ------------------------------------------------------------------
    # 0.a Fast look-ups
    # ------------------------------------------------------------------
    vehicles = [dict(**b, kind="balloon") for b in balloons] + [
        dict(**c, kind="car") for c in cars
    ]

    people_by_id = {p["id"]: p for p in people}
    vehicles_by_id = {v["id"]: v for v in vehicles}

    person_ids = list(people_by_id)
    vehicle_ids = list(vehicles_by_id)

    # If solving leg 2, ignore people who were not present in the previous leg
    if leg is not None and leg > 1 and past_flights:
        prev = past_flights[-1]
        prev_people = set()
        for grp in prev.get("groups", []):
            prev_people.add(grp["balloon"]["operator"])
            prev_people.update(grp["balloon"]["passengers"])
            for car in grp["cars"]:
                prev_people.add(car["operator"])
                prev_people.update(car["passengers"])
        # keep only those who appeared in the previous leg
        person_ids = [p for p in person_ids if p in prev_people]

    weight = {
        p: int(people_by_id[p].get("weight", default_person_weight)) for p in person_ids
    }
    flights_so_far = {p: int(people_by_id[p].get("flights", 0)) for p in person_ids}
    nationality = {
        p: (people_by_id[p].get("nationality") or "unknown") for p in person_ids
    }
    nationalities = set(nationality.values())
    is_participant = {
        p: (people_by_id[p].get("role", "participant") == "participant")
        for p in person_ids
    }

    capacity = {v: int(vehicles_by_id[v]["capacity"]) for v in vehicle_ids}
    kind = {v: vehicles_by_id[v]["kind"] for v in vehicle_ids}
    allowed_op = {
        v: set(vehicles_by_id[v].get("allowed_operators", [])) for v in vehicle_ids
    }
    max_weight = {v: int(vehicles_by_id[v].get("max_weight", -1)) for v in vehicle_ids}

    langs = {
        p: set(str(l).lower() for l in people_by_id[p].get("languages", []) if l)
        for p in person_ids
    }
    # Precompute operator/passenger language compatibility (constant 0/1)
    common_lang = {
        (p, q): int(len(langs[p] & langs[q]) > 0)
        for p in person_ids
        for q in person_ids
    }

    # ------------------------------------------------------------------
    # 0.b  Historic “fresh vehicle” map
    # ------------------------------------------------------------------
    seen = defaultdict(set)
    if past_flights:
        for fl in past_flights:
            for grp in fl.get("groups", []):
                bid = grp["balloon"]["id"]
                seen[grp["balloon"]["operator"]].add(bid)
                for p in grp["balloon"]["passengers"]:
                    seen[p].add(bid)
                for car in grp["cars"]:
                    cid = car["id"]
                    seen[car["operator"]].add(cid)
                    for p in car["passengers"]:
                        seen[p].add(cid)

    # ------------------------------------------------------------------
    # 1. CP-SAT model
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
    # 2. Hard constraints
    # ------------------------------------------------------------------
    # 2.1 each person exactly one seat / one operator role
    for p in person_ids:
        model.Add(sum(pax[p, v] for v in vehicle_ids) == 1)  # seat exactly once
        model.Add(sum(op[p, v] for v in vehicle_ids) <= 1)  # ≤1 operator role

    # 2.2 operator ⇒ passenger + operator eligibility
    for p, v in product(person_ids, vehicle_ids):
        model.AddImplication(op[p, v], pax[p, v])
        if p not in allowed_op[v]:
            model.Add(op[p, v] == 0)

    # 2.3 capacity limit
    for v in vehicle_ids:
        model.Add(sum(pax[p, v] for p in person_ids) <= capacity[v])

    # 2.4 weight limit
    for v in vehicle_ids:
        if max_weight[v] > 0:
            model.Add(sum(weight[p] * pax[p, v] for p in person_ids) <= max_weight[v])

    # 2.5 occupancy flag & exactly‑one operator if occupied
    for v in vehicle_ids:
        occ = model.NewBoolVar(f"occ_{v}")
        seats = sum(pax[p, v] for p in person_ids)
        model.Add(seats >= 1).OnlyEnforceIf(occ)
        model.Add(seats == 0).OnlyEnforceIf(occ.Not())
        model.Add(sum(op[p, v] for p in person_ids) == 1).OnlyEnforceIf(occ)
        model.Add(sum(op[p, v] for p in person_ids) == 0).OnlyEnforceIf(occ.Not())

    # 2.6 frozen seats
    for lock in frozen:
        p, v = lock["person"], lock["vehicle"]
        # Skip frozen assignments for people not part of this leg (filtered above)
        if p not in person_ids:
            continue
        if lock["role"] == "operator":
            model.Add(op[p, v] == 1)
            model.Add(pax[p, v] == 1)
        elif lock["role"] == "passenger":
            model.Add(pax[p, v] == 1)
            model.Add(op[p, v] == 0)
        else:
            raise ValueError("unknown role in frozen assignment")

    # 2.7 stay-in-cluster after leg-1 (i.e., solving leg 2)
    if leg is not None and leg > 1:
        # take cluster from previous leg (last entry)
        prev = past_flights[-1]
        allowed = defaultdict(set)

        for grp in prev["groups"]:
            cluster_vids = {grp["balloon"]["id"]} | {car["id"] for car in grp["cars"]}
            # operator + passengers
            ids = (
                {grp["balloon"]["operator"]}
                | set(grp["balloon"]["passengers"])
                | {car["operator"] for car in grp["cars"]}
                | {p for car in grp["cars"] for p in car["passengers"]}
            )
            for pid in ids:
                allowed[pid].update(cluster_vids)

        for p in person_ids:
            if not allowed.get(p):
                # The person wasn't in the previous leg; they've been filtered out above.
                continue
            for v in vehicle_ids:
                if v not in allowed[p]:
                    model.Add(pax[p, v] == 0)

    # ------------------------------------------------------------------
    # 3. Objective
    # ------------------------------------------------------------------
    objective_terms = []
    max_flights = max(flights_so_far.values()) + 1 if flights_so_far else 1

    # 3.1 pilot fairness
    for p, v in product(person_ids, vehicle_ids):
        if p in allowed_op[v]:
            bonus = max_flights - flights_so_far[p]
            objective_terms.append(-w_pilot_fairness * bonus * op[p, v])

    # 3.2 low-flight pax in balloons (participants > counselors)
    for p, v in product(person_ids, vehicle_ids):
        if kind[v] == "balloon":
            bonus = max_flights - flights_so_far[p]
            if not is_participant[p]:
                bonus = max(bonus - counselor_flight_discount, 0)
            objective_terms.append(-w_passenger_fairness * bonus * pax[p, v])

    # 3.3 no participants alone in a car
    for v in vehicle_ids:
        if kind[v] != "car":
            continue
        part_sat = sum(int(is_participant[p]) * pax[p, v] for p in person_ids)
        solo_part = model.NewBoolVar(f"solo_part_{v}")
        model.Add(part_sat == 1).OnlyEnforceIf(solo_part)
        model.Add(part_sat != 1).OnlyEnforceIf(solo_part.Not())
        objective_terms.append(+w_no_solo_participant * solo_part)

    # 3.4 cluster passenger deviation (leg 0 or 1)
    if leg is None or leg == 1:
        n_people = len(person_ids)
        seats_in_air = sum(b["capacity"] for b in balloons)
        # integer target; fair rounding happens via deviation vars
        avg_ground = (n_people - seats_in_air) // max(len(cluster), 1)

        for bid, car_ids in cluster.items():
            crew_cars = sum(pax[p, v] for v in car_ids for p in person_ids)
            # absolute deviation |crew - avg_ground|
            dev_pos = model.NewIntVar(0, n_people, f"devP_{bid}")
            dev_neg = model.NewIntVar(0, n_people, f"devN_{bid}")
            model.Add(crew_cars - avg_ground == dev_pos - dev_neg)
            objective_terms.append(w_cluster_passenger_balance * (dev_pos + dev_neg))

    # 3.5 diversity
    if len(nationalities) > 1:
        for v in vehicle_ids:
            cnt_nat = {}
            for nat in nationalities:
                cnt = model.NewIntVar(0, capacity[v], f"cnt_{v}_{nat}")
                model.Add(
                    cnt == sum(pax[p, v] for p in person_ids if nationality[p] == nat)
                )
                cnt_nat[nat] = cnt

            maj = model.NewIntVar(0, capacity[v], f"maj_{v}")
            model.AddMaxEquality(maj, list(cnt_nat.values()))

            total = model.NewIntVar(0, capacity[v], f"tot_{v}")
            model.Add(total == sum(pax[p, v] for p in person_ids))

            minority = model.NewIntVar(0, capacity[v], f"minor_{v}")
            model.Add(minority == total - maj)

            objective_terms.append(-w_divers_nationalities * minority)

    # 3.6 fresh vehicle (passengers only)
    for p, v in product(person_ids, vehicle_ids):
        if v not in seen[p]:
            objective_terms.append(-w_vehicle_rotation * (pax[p, v] - op[p, v]))

    # 3.7 leg-2: prioritise low-flight pax in cars, and avoid overweight (low-flight mass)
    if leg is not None and leg == 2:
        future_seats = sum(b["capacity"] for b in balloons)
        sorted_f = sorted(flights_so_far.values())
        cutoff = (
            sorted_f[-1]
            if future_seats >= len(sorted_f)
            else sorted_f[future_seats - 1]
        )
        low = {p: int(flights_so_far[p] <= cutoff) for p in person_ids}

        # a) achieve at least balloon.capacity low-flight pax within each cluster's cars
        for b in balloons:
            bid = b["id"]
            target = int(b["capacity"])
            car_ids = cluster[bid]

            low_in_cars = sum(low[p] * pax[p, v] for v in car_ids for p in person_ids)

            short = model.NewIntVar(0, target, f"short_{bid}")
            model.Add(short >= target - low_in_cars)
            objective_terms.append(+w_low_flights_second_leg * short)

        # b) overweight penalty using *low-flight mass* in those cars
        for bid, car_ids in cluster.items():
            # If a balloon has max_weight, use it as a budget proxy for its road cluster
            max_w = max_weight.get(bid, -1)
            if max_w <= 0:
                continue

            low_weight_in_cars = sum(
                weight[p] * low[p] * pax[p, v] for v in car_ids for p in person_ids
            )

            over = model.NewIntVar(0, max_w, f"over_{bid}")
            model.Add(over >= low_weight_in_cars - max_w)
            objective_terms.append(w_overweight_second_leg * over)

    # 3.8 Language match: penalize when seated passenger and operator share no language
    if w_language_mismatch > 0:
        for v in vehicle_ids:
            if kind[v] != "balloon":
                continue  # <-- do NOT penalize cars
            for q in person_ids:  # potential operator
                for p in person_ids:  # potential passenger
                    if p == q:
                        continue
                    if common_lang[(p, q)] == 1:
                        continue  # no penalty if there is a shared language
                    # z = pax[p,v] AND op[q,v]
                    z = model.NewBoolVar(f"lang_mismatch_{p}_{q}_{v}")
                    model.Add(z <= pax[p, v])
                    model.Add(z <= op[q, v])
                    model.Add(z >= pax[p, v] + op[q, v] - 1)
                    objective_terms.append(w_language_mismatch * z)

    model.Minimize(sum(objective_terms))

    # ------------------------------------------------------------------
    # 4. Solve
    # ------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_s)
    solver.parameters.num_search_workers = int(max(1, num_search_workers))
    if random_seed is not None:
        solver.parameters.random_seed = int(random_seed)

    if solver.Solve(model) not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("No feasible assignment")

    # ------------------------------------------------------------------
    # 5. Manifest
    # ------------------------------------------------------------------
    manifest = {v: {"operator": None, "passengers": []} for v in vehicle_ids}
    for p, v in product(person_ids, vehicle_ids):
        if solver.BooleanValue(op[p, v]):
            manifest[v]["operator"] = p
        elif solver.BooleanValue(pax[p, v]):
            manifest[v]["passengers"].append(p)

    return manifest
