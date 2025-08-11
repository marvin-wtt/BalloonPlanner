from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model


def build_clusters(
    balloons: List[Dict[str, Any]],
    cars: List[Dict[str, Any]],
    people: List[Dict[str, Any]],
    precluster: dict[str, list[str]] | None = None,
    *,
    time_limit_s: int = 5,
    num_search_workers: Optional[int] = None,
    random_seed: Optional[int] = None,
) -> Dict[str, List[str]]:
    """
    Partition cars into balloon clusters, ensuring:
      - each car belongs to at most one balloon
      - each cluster has at least one trailer-equipped car
      - passenger seats in a cluster cover that balloon's capacity (reserved for balloon pax)
      - total *car* seats cover everyone who is NOT in balloons

    Also reserves balloon seats out of their cluster cars (mutates `cars` capacity).
    """
    precluster = precluster or {}

    car_ids = [c["id"] for c in cars]
    balloon_ids = [b["id"] for b in balloons]

    cap = {c["id"]: int(c["capacity"]) for c in cars}
    pax_cap = {cid: max(cap[cid] - 1, 0) for cid in car_ids}  # seats for passengers
    trailer = {c["id"]: bool(c.get("trailer_clutch", False)) for c in cars}
    bal_need = {b["id"]: int(b["capacity"]) for b in balloons}

    # sanity checks ----------------------------------------------------
    if sum(1 for c in car_ids if trailer[c]) < len(balloons):
        raise ValueError("not enough trailer-equipped cars for balloons")
    if sum(cap.values()) < len(people):
        # This is a coarse check (ignores balloon seats on purpose); we’ll refine below.
        raise ValueError("fleet lacks passenger seats for all people")

    for bid, fixed_cars in precluster.items():
        if bid not in balloon_ids:
            raise ValueError(f"balloon {bid} not found")
        for cid in fixed_cars:
            if cid not in car_ids:
                raise ValueError(f"car {cid} not found")

    model = cp_model.CpModel()

    # decision vars ----------------------------------------------------
    x = {(c, b): model.NewBoolVar(f"x_{c}_{b}") for c in car_ids for b in balloon_ids}

    # === (0) freeze requested assignments ===============================
    for bid, fixed_cars in precluster.items():
        for cid in fixed_cars:
            model.Add(x[cid, bid] == 1)

    # (1) each car used ≤ 1 cluster
    for c in car_ids:
        model.Add(sum(x[c, b] for b in balloon_ids) <= 1)

    # (2) ≥ 1 trailer car in each cluster
    for b in balloon_ids:
        model.Add(sum((1 if trailer[c] else 0) * x[c, b] for c in car_ids) >= 1)

    # (3) passenger seats per balloon ≥ balloon.capacity  (reserve for balloon pax)
    for b in balloon_ids:
        model.Add(sum(pax_cap[c] * x[c, b] for c in car_ids) >= bal_need[b])

    # (4) across all clusters, *car* seats must cover everyone not seated in balloons
    car_seats_needed = max(len(people) - sum(bal_need.values()), 0)
    model.Add(sum(cap[c] * x[c, b] for c, b in x) >= car_seats_needed)

    # objective: minimise unused passenger seats across all clusters
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

    clusters: Dict[str, List[str]] = {b: [] for b in balloon_ids}
    for (c, b), var in x.items():
        if solver.BooleanValue(var):
            clusters[b].append(c)

    # ----------------------------------------------------------------
    # 2. Reserve seats for balloon passengers inside their own cars
    #    (mutates `cars`: capacity -= reserved seats)
    # ----------------------------------------------------------------
    car_by_id = {c["id"]: c for c in cars}  # live reference
    for bal in balloons:
        bid = bal["id"]
        need = int(bal["capacity"])  # seats to reserve for balloon pax

        existing = precluster.get(bid, [])
        cluster_cars = clusters.get(bid, [])

        # keep original car order from precluster first, then add new ones
        existing_in_cluster = [c for c in existing if c in cluster_cars]
        new_cars = [c for c in cluster_cars if c not in existing_in_cluster]

        for cid in existing_in_cluster + new_cars:
            if need <= 0:
                break
            car = car_by_id[cid]
            car_pax_cap = max(int(car["capacity"]) - 1, 0)  # seats excl. driver
            take = min(need, car_pax_cap)
            car["capacity"] = int(car["capacity"]) - take
            need -= take
        if need > 0:
            raise RuntimeError(
                f"cluster seat reservation failed for {bid}: short {need}"
            )

    return clusters
