"""Balloon-camp crew optimiser
================================
A single-slot (one flight) solver with:

• Hard rules
  – exactly one qualified operator per occupied vehicle
  – every passenger (incl. operator) occupies a seat
  – seat-capacity and optional max-weight per vehicle
  – each person appears in ≤ 1 vehicle and operates ≤ 1 vehicle
  – optional *frozen* assignments (operator / passenger)
  – leg-2 “stay in cluster” restriction based on previous flight
  – language compatibility for balloons:
      * None, missing, or [] in `languages` → speaks all languages
      * non-empty list → speaks only those languages (lowercased in transformer)
      * Every passenger in a balloon must share ≥ 1 language with the operator,
        or be the operator themselves.

• Soft rules (linear objective)
  – give airtime to low-flight pilots (w_pilot_fairness)
  – prefer low-flight passengers in balloons (w_passenger_fairness)
  – reward mixed nationalities in each vehicle (w_divers_nationalities)
  – discourage “same vehicle again” (w_vehicle_rotation)
  – discourage exactly one participant alone in a car (w_no_solo_participant)
  – cluster passenger balance terms for leg 1 and leg 2

All weights are user-tunable kwargs.
"""

import random
from itertools import product
from collections import defaultdict
from typing import List, Dict, Optional, TypedDict, Literal

from ortools.sat.python import cp_model
from solver_types import Balloon, Car, Vehicle, Person, VehicleAssignment


class Manifest(TypedDict):
    assignments: Dict[str, VehicleAssignment]


# ---------------------------------------------------------------------------
# Main one-leg solver (sequential-leg workflow)
# ---------------------------------------------------------------------------
def solve_flight_leg(
    balloons: List[Balloon],
    cars: List[Car],
    people: List[Person],
    vehicle_groups: Dict[str, List[str]],
    *,
    group_history: Optional[Dict[str, Dict[str, int]]],
    frozen: Optional[Dict[str, VehicleAssignment]],
    fixed_groups: Optional[Dict[str, str]],
    planning_horizon_legs: int,
    # soft weights
    w_pilot_fairness: int,
    w_passenger_fairness: int,
    w_tiebreak_fairness: int,
    w_no_solo_participant: int,
    w_divers_nationalities: int,
    w_group_passenger_balance: int,
    w_group_rotation: int,
    w_low_flights_lookahead: int,
    counselor_flight_discount: int,
    # misc
    default_person_weight: int,
    time_limit_s: int,
    num_search_workers: int = 8,
    random_seed: Optional[int] = None,
) -> Manifest:
    """Solve a *single* leg; call once per flight."""

    # ------------------------------------------------------------------
    # 0. Input validation
    # ------------------------------------------------------------------
    if default_person_weight < 0:
        raise ValueError("default_person_weight must be non-negative")
    if time_limit_s <= 0:
        raise ValueError("time_limit_s must be positive")
    if planning_horizon_legs < 0:
        raise ValueError("planning_horizon_legs must be non-negative")

    # ------------------------------------------------------------------
    # 0.a Input preparation
    # ------------------------------------------------------------------
    # Avoid side effects when shuffling
    balloons = balloons[:]
    cars = cars[:]
    people = people[:]
    # Deterministic shuffles
    random.seed(random_seed)
    random.shuffle(balloons)
    random.shuffle(cars)
    random.shuffle(people)

    reserve_cluster_seats(balloons, cars, vehicle_groups)

    # ------------------------------------------------------------------
    # 0.b Fast look-ups
    # ------------------------------------------------------------------
    vehicles: List[Vehicle] = [dict(**b, kind="balloon") for b in balloons] + [
        dict(**c, kind="car") for c in cars
    ]

    people_by_id: Dict[str, Person] = {p["id"]: p for p in people}
    vehicles_by_id: Dict[str, Vehicle] = {v["id"]: v for v in vehicles}

    person_ids = list(people_by_id)
    vehicle_ids = list(vehicles_by_id)
    balloon_ids = [b["id"] for b in balloons]

    weight = {
        p: int(people_by_id[p].get("weight", default_person_weight)) for p in person_ids
    }
    flights_so_far = {
        p: int(people_by_id[p].get("flightsSoFar", 0)) for p in person_ids
    }
    first_time = {p: bool(people_by_id[p].get("firstTime", False)) for p in person_ids}
    nationality = {
        p: (people_by_id[p].get("nationality") or "unknown") for p in person_ids
    }
    nationalities = set(nationality.values())
    is_participant = {
        p: (people_by_id[p].get("role", "participant") == "participant")
        for p in person_ids
    }

    capacity = {v: int(vehicles_by_id[v]["maxCapacity"]) for v in vehicle_ids}
    kind: Dict[str, Literal["balloon", "car"]] = {
        v: vehicles_by_id[v]["kind"] for v in vehicle_ids
    }
    allowed_op = {
        v: set(vehicles_by_id[v].get("allowedOperatorIds", [])) for v in vehicle_ids
    }
    max_weight = {v: int(vehicles_by_id[v].get("maxWeight", -1)) for v in vehicle_ids}

    langs = {p: people_by_id[p].get("languages") for p in person_ids}

    priorities = {
        p: i
        for i, p in enumerate(
            sorted(person_ids, key=lambda p: flights_so_far[p] - int(first_time[p]))
        )
    }

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
    if frozen is not None:
        for vid, assignment in frozen.items():
            if assignment["operatorId"] is not None:
                pid = assignment["operatorId"]
                model.Add(op[pid, vid] == 1)
                model.Add(pax[pid, vid] == 1)

            for pid in assignment["passengerIds"]:
                model.Add(pax[pid, vid] == 1)
                model.Add(op[pid, vid] == 0)

    # 2.7 stay-in-cluster when this is NOT the first leg
    if fixed_groups is not None:
        # take cluster from previous leg (last entry)
        allowed = defaultdict(set)

        for pid, bid in fixed_groups.items():
            allowed[pid].add(bid)
            allowed[pid].update(vehicle_groups.get(bid, []))

        for p in allowed:
            for v in vehicle_ids:
                if v not in allowed[p]:
                    model.Add(pax[p, v] == 0)

    # 2.8 language compatibility (balloons only):
    for v in vehicle_ids:
        if kind[v] != "balloon":
            continue

        for p in person_ids:
            lp = langs[p]
            # Passenger speaks all languages -> always compatible
            if lp is None or len(lp) == 0:
                continue

            lp_set = set(lp)
            compatible_ops = [
                q
                for q in person_ids
                if q != p
                and (
                    langs[q] is None
                    or len(langs[q]) == 0  # operator speaks all
                    or lp_set.intersection(langs[q])  # or shares a language
                )
            ]

            # Allow "self" to satisfy the language requirement when p is the operator.
            # This makes the constraint:  (some compatible op) OR (p is the operator)
            if compatible_ops:
                model.Add(sum(op[q, v] for q in compatible_ops) + op[p, v] >= pax[p, v])
            else:
                # No other compatible operator exists → only valid if p is the operator
                model.Add(op[p, v] >= pax[p, v])

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
            if flights_so_far[p] == 0 and first_time[p]:
                bonus += 1
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

    # 3.4 cluster passenger deviation
    if fixed_groups is None:
        n_people = len(person_ids)
        seats_in_air = sum(capacity[bid] for bid in balloon_ids)
        # integer target; fair rounding happens via deviation vars
        avg_ground = (n_people - seats_in_air) // max(len(vehicle_groups), 1)

        for bid, car_ids in vehicle_groups.items():
            crew_cars = sum(pax[p, v] for v in car_ids for p in person_ids)
            # absolute deviation |crew - avg_ground|
            dev_pos = model.NewIntVar(0, n_people, f"devP_{bid}")
            dev_neg = model.NewIntVar(0, n_people, f"devN_{bid}")
            model.Add(crew_cars - avg_ground == dev_pos - dev_neg)
            objective_terms.append(w_group_passenger_balance * (dev_pos + dev_neg))

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
    if fixed_groups is None and group_history:
        for p, v in product(person_ids, vehicle_ids):
            # 1 / (1 + repeats): 1.0 if never seen, 0.5 after 1 repeat, 0.33 after 2, ...
            # Keeps a diminishing (never-negative) incentive for less-used vehicles.
            nf = 1.0 / (1.0 + float(group_history[p].get(v, 0)))
            # scale the novelty reward for passengers; subtract op to avoid rewarding operators
            objective_terms.append(-w_group_rotation * nf * (pax[p, v] - op[p, v]))

    # 3.7 language-aware lookahead: prioritise low-flight pax in cluster cars (no overweight lookahead)
    if planning_horizon_legs >= 1 and person_ids:
        # Seats available across the next H legs
        seats_per_leg = sum(capacity[bid] for bid in balloon_ids)
        future_seats = planning_horizon_legs * seats_per_leg

        # Global cutoff: who counts as "low-flight"
        sorted_f = sorted(flights_so_far[p] for p in person_ids)
        if future_seats <= 0:
            cutoff = -(10**9)  # nobody qualifies
        elif future_seats >= len(sorted_f):
            cutoff = sorted_f[-1]
        else:
            cutoff = sorted_f[future_seats - 1]

        low = {p: int(flights_so_far[p] <= cutoff) for p in person_ids}

        # Language eligibility for a cluster (balloon id = bid):
        # A passenger is eligible if they share ≥1 language with at least one *potential*
        # operator of that balloon (allowed_op[bid]), or if either side "speaks all"
        # (None/[] means "all" per 2.8).
        def lang_eligible(p: str, bid: str) -> int:
            lp = langs.get(p)
            speaks_all_p = (lp is None) or (len(lp) == 0)
            if speaks_all_p:
                return 1
            lp_set = set(lp)

            # check any potential operator for this balloon
            for q in allowed_op.get(bid, set()):
                lq = langs.get(q)
                if lq is None or len(lq) == 0:
                    return 1  # operator speaks all
                if lp_set.intersection(lq):
                    return 1
            return 0

        # Target: in each cluster's cars, achieve at least H * capacity(low-flight, lang-eligible) over horizon
        for bid in balloon_ids:
            target = int(planning_horizon_legs * capacity[bid])
            if target <= 0:
                continue

            car_ids = vehicle_groups.get(bid, [])
            low_lang_in_cars = sum(
                low[p] * lang_eligible(p, bid) * pax[p, v]
                for v in car_ids
                for p in person_ids
            )

            short = model.NewIntVar(0, target, f"short_{bid}")
            model.Add(short >= target - low_lang_in_cars)
            objective_terms.append(w_low_flights_lookahead * short)

    # 3.8 random fairness tiebreaker
    for p in person_ids:
        pr = priorities[p]  # 0 is best
        for v in vehicle_ids:
            if kind[v] == "balloon":
                # positive term because we minimize: lower pr is better
                objective_terms.append(w_tiebreak_fairness * pr * pax[p, v])

    model.Minimize(sum(objective_terms))

    # ------------------------------------------------------------------
    # 4. Solve
    # ------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_s)
    solver.parameters.num_search_workers = int(max(1, num_search_workers))
    if random_seed is not None:
        solver.parameters.random_seed = int(random_seed)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        if status == cp_model.INFEASIBLE:
            raise RuntimeError("No feasible assignment")
        else:
            raise RuntimeError("Solver failed")

    # ------------------------------------------------------------------
    # 5. Manifest
    # ------------------------------------------------------------------
    manifest: Dict[str, VehicleAssignment] = {
        v: {"operatorId": None, "passengerIds": []} for v in vehicle_ids
    }
    for p, v in product(person_ids, vehicle_ids):
        if solver.BooleanValue(op[p, v]):
            manifest[v]["operatorId"] = p
        elif solver.BooleanValue(pax[p, v]):
            manifest[v]["passengerIds"].append(p)

    return {"assignments": manifest}


def reserve_cluster_seats(
    balloons: List[Balloon],
    cars: List[Car],
    groups: Dict[str, list[str]],
):
    """
    Reserve seats for each balloon's passengers inside *its own cluster cars*.
    Mutates `cars[*]['capacity']` only (does NOT touch groups or the cluster).
    Safe to call for any leg. Uses the order given by `cluster[balloon_id]`.
    """
    car_by_id = {c["id"]: c for c in cars}
    for bal in balloons:
        bid = bal["id"]
        need = int(bal["maxCapacity"])
        for cid in groups.get(bid, []):
            if need <= 0:
                break
            car = car_by_id.get(cid)
            if car is None:
                raise ValueError(f"Car {cid} from cluster not found in current input.")
            pax_cap_excl_driver = max(int(car["maxCapacity"]) - 1, 0)
            take = min(need, pax_cap_excl_driver)
            car["maxCapacity"] = int(car["maxCapacity"]) - take
            need -= take
        if need > 0:
            raise RuntimeError(
                f"Seat reservation failed for {bid}: short {need} passenger seats "
                f"in cars {groups.get(bid, [])}."
            )
