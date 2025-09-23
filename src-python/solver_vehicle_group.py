from typing import List, Dict, Optional
from ortools.sat.python import cp_model
from solver_types import Balloon, Car, Person


def solve_vehicle_groups(
    balloons: List[Balloon],
    cars: List[Car],
    people: List[Person],
    frozen: dict[str, list[str]] | None = None,
    *,
    time_limit_s: int = 5,
    num_search_workers: Optional[int] = None,
    random_seed: Optional[int] = None,
):
    """
    Compute a mapping balloon_id -> [car_id, ...] for the current leg.

    Adds a necessary feasibility filter: a car can only join a balloon's group
    if there exists at least one language-compatible pair
    (balloon operator candidate, car operator candidate).
    """
    frozen = frozen or {}

    people_count = len(people)

    car_ids = [c["id"] for c in cars]
    balloon_ids = [b["id"] for b in balloons]

    car_names = {c["id"]: c["name"] for c in cars}
    balloon_names = {b["id"]: b["name"] for b in balloons}

    cap = {c["id"]: int(c["maxCapacity"]) for c in cars}
    pax_cap = {cid: max(cap[cid] - 1, 0) for cid in car_ids}  # seats for passengers
    trailer = {c["id"]: bool(c.get("hasTrailerClutch", False)) for c in cars}
    bal_need = {b["id"]: int(b["maxCapacity"]) for b in balloons}

    # ---- operator candidate lookup ----
    allowed_op_balloon = {
        b["id"]: set(b.get("allowedOperatorIds", [])) for b in balloons
    }
    allowed_op_car = {c["id"]: set(c.get("allowedOperatorIds", [])) for c in cars}

    # person -> languages (None or [] means "speaks all")
    langs = {p["id"]: p.get("languages") for p in people}

    # Precompute language compatibility for every (balloon op cand, car op cand)
    # and lift it to a car-vs-balloon compatibility matrix:
    compat_cb: Dict[tuple[str, str], bool] = {}
    for bid in balloon_ids:
        b_ops = allowed_op_balloon.get(bid, set())
        for cid in car_ids:
            c_ops = allowed_op_car.get(cid, set())
            ok = False
            if b_ops and c_ops:
                for p in b_ops:
                    lp = langs.get(p)
                    p_all = (lp is None) or (len(lp) == 0)
                    p_set = set(lp or [])
                    # early exit if p speaks all
                    if p_all:
                        ok = True
                        break
                    for q in c_ops:
                        lq = langs.get(q)
                        q_all = (lq is None) or (len(lq) == 0)
                        if q_all or p_set.intersection(lq or []):
                            ok = True
                            break
                    if ok:
                        break
            # If either side has no candidates, leave ok False (cannot ensure a match)
            compat_cb[(cid, bid)] = ok

    # ---- sanity checks ------------------------------------------------
    if sum(1 for c in car_ids if trailer[c]) < len(balloons):
        raise ValueError("not enough trailer-equipped cars for balloons")

    # across all groups, *car* seats must cover everyone not seated in balloons
    car_seats_needed = max(people_count - sum(bal_need.values()), 0)
    if sum(cap.values()) < car_seats_needed:
        raise ValueError("fleet lacks passenger seats for ground crew")

    for bid, fixed_cars in frozen.items():
        if bid not in balloon_ids:
            raise ValueError(f"balloon {balloon_names[bid]} not found")
        for cid in fixed_cars:
            if cid not in car_ids:
                raise ValueError(f"car {car_names[cid]} not found")

    # Helpful pre-errors: no operator candidates
    for bid in balloon_ids:
        if len(allowed_op_balloon.get(bid)) == 0:
            raise ValueError(f"Balloon {balloon_names[bid]} has no eligible operators")
    for cid in car_ids:
        if len(allowed_op_car.get(cid)) == 0:
            raise ValueError(f"Car {car_names[cid]} has no eligible operators")

    # Helpful pre-errors: frozen pair contradicts language feasibility
    for bid, fixed_cars in frozen.items():
        for cid in fixed_cars:
            if not compat_cb[(cid, bid)]:
                raise ValueError(
                    f"Vehicle group {balloon_names[bid]} <- {car_names[cid]} is impossible: "
                    f"No language-compatible operator pair exists"
                )

    # ---- model --------------------------------------------------------
    model = cp_model.CpModel()
    x = {(c, b): model.NewBoolVar(f"x_{c}_{b}") for c in car_ids for b in balloon_ids}

    # freeze requested assignments
    for bid, fixed_cars in frozen.items():
        for cid in fixed_cars:
            model.Add(x[cid, bid] == 1)

    # each car used ≤ 1 group
    for c in car_ids:
        model.Add(sum(x[c, b] for b in balloon_ids) <= 1)

    # ≥ 1 trailer car in each group
    for b in balloon_ids:
        model.Add(sum((1 if trailer[c] else 0) * x[c, b] for c in car_ids) >= 1)

    # passenger seats per balloon ≥ balloon.capacity (reserve for balloon pax)
    for b in balloon_ids:
        model.Add(sum(pax_cap[c] * x[c, b] for c in car_ids) >= bal_need[b])

    # across all groups, *car* seats must cover everyone not seated in balloons
    model.Add(sum(cap[c] * x[c, b] for c, b in x) >= car_seats_needed)

    # forbid balloon-car pairings that cannot possibly satisfy operator language rule
    for (cid, bid), ok in compat_cb.items():
        if not ok:
            model.Add(x[cid, bid] == 0)

    # objective: minimise unused passenger seats
    unused = model.NewIntVar(0, sum(pax_cap.values()), "unused")
    model.Add(unused == sum(pax_cap.values()) - sum(pax_cap[c] * x[c, b] for c, b in x))
    model.Minimize(unused)

    # ---- solve --------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_s)
    if num_search_workers is not None:
        solver.parameters.num_search_workers = int(num_search_workers)
    if random_seed is not None:
        solver.parameters.random_seed = int(random_seed)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("No feasible vehicle groups arrangement found")

    # Build vehicle groups
    vehicle_groups: Dict[str, List[str]] = {}
    for b in balloon_ids:
        vehicle_groups[b] = [c for c in car_ids if solver.Value(x[c, b]) == 1]

    return {"vehicleGroups": vehicle_groups}
