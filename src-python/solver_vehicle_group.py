from typing import List, Dict, Optional
from ortools.sat.python import cp_model
from solver_types import Balloon, Car, Person


def solve_vehicle_groups(
    balloons: List[Balloon],
    cars: List[Car],
    people_count: int,
    precluster: dict[str, list[str]] | None = None,
    *,
    time_limit_s: int = 5,
    num_search_workers: Optional[int] = None,
    random_seed: Optional[int] = None,
):
    """
    Compute a mapping balloon_id -> [car_id, ...] for the current leg.

    NOTE: This function does NOT reserve seats. Call reserve_cluster_seats()
          afterwards to apply seat reservations based on the returned cluster.

    Ordering policy:
      - If a precluster is provided for a balloon, the cars listed there will
        appear first in the returned list, preserving the exact input order.
      - Any additional selected cars will follow, preserving the original
        `cars` input order.
    """
    precluster = precluster or {}

    car_ids = [c["id"] for c in cars]
    balloon_ids = [b["id"] for b in balloons]

    cap = {c["id"]: int(c["maxCapacity"]) for c in cars}
    pax_cap = {cid: max(cap[cid] - 1, 0) for cid in car_ids}  # seats for passengers
    trailer = {c["id"]: bool(c.get("hasTrailerClutch", False)) for c in cars}
    bal_need = {b["id"]: int(b["maxCapacity"]) for b in balloons}

    # sanity checks ----------------------------------------------------
    if sum(1 for c in car_ids if trailer[c]) < len(balloons):
        raise ValueError("not enough trailer-equipped cars for balloons")

    # across all clusters, *car* seats must cover everyone not seated in balloons
    car_seats_needed = max(people_count - sum(bal_need.values()), 0)
    if sum(cap.values()) < car_seats_needed:
        raise ValueError("fleet lacks passenger seats for ground crew")

    for bid, fixed_cars in precluster.items():
        if bid not in balloon_ids:
            raise ValueError(f"balloon {bid} not found")
        for cid in fixed_cars:
            if cid not in car_ids:
                raise ValueError(f"car {cid} not found")

    # model ------------------------------------------------------------
    model = cp_model.CpModel()
    x = {(c, b): model.NewBoolVar(f"x_{c}_{b}") for c in car_ids for b in balloon_ids}

    # freeze requested assignments
    for bid, fixed_cars in precluster.items():
        for cid in fixed_cars:
            model.Add(x[cid, bid] == 1)

    # each car used ≤ 1 cluster
    for c in car_ids:
        model.Add(sum(x[c, b] for b in balloon_ids) <= 1)

    # ≥ 1 trailer car in each cluster
    for b in balloon_ids:
        model.Add(sum((1 if trailer[c] else 0) * x[c, b] for c in car_ids) >= 1)

    # passenger seats per balloon ≥ balloon.capacity (reserve for balloon pax)
    for b in balloon_ids:
        model.Add(sum(pax_cap[c] * x[c, b] for c in car_ids) >= bal_need[b])

    # across all clusters, *car* seats must cover everyone not seated in balloons
    model.Add(sum(cap[c] * x[c, b] for c, b in x) >= car_seats_needed)

    # objective: minimise unused passenger seats
    unused = model.NewIntVar(0, sum(pax_cap.values()), "unused")
    model.Add(unused == sum(pax_cap.values()) - sum(pax_cap[c] * x[c, b] for c, b in x))
    model.Minimize(unused)

    # solve ------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_s)
    if num_search_workers is not None:
        solver.parameters.num_search_workers = int(num_search_workers)
    if random_seed is not None:
        solver.parameters.random_seed = int(random_seed)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("no feasible clustering")

    # Build ordered clusters:
    # - precluster cars first, preserving the input order
    # - then any additional selected cars, preserving `car_ids` input order
    clusters: Dict[str, List[str]] = {b: [] for b in balloon_ids}
    for b in balloon_ids:
        # all cars selected for this balloon (iterate in car_ids order for stability)
        selected = [c for c in car_ids if solver.BooleanValue(x[c, b])]
        pc = precluster.get(b, []) or []

        # keep only those precluster cars that were actually selected
        pc_kept = [c for c in pc if c in selected]

        # then append any selected cars not already in precluster, in `car_ids` order
        rest = [c for c in selected if c not in pc_kept]

        clusters[b] = pc_kept + rest

    return {
      "vehicleGroups": clusters
    }
