from typing import List, Dict, Any
from ortools.sat.python import cp_model


def build_clusters(
    balloons: List[Dict[str, Any]],
    cars: List[Dict[str, Any]],
    people: List[Dict[str, Any]],
    precluster: dict[str, list[str]] | None = None,
) -> Dict[str, List[str]]:
    precluster = precluster or {}

    car_ids = [c["id"] for c in cars]
    balloon_ids = [b["id"] for b in balloons]

    cap = {c["id"]: c["capacity"] for c in cars}
    pass_cap = {cid: cap[cid] - 1 for cid in car_ids}  # seats for pax
    trailer = {c["id"]: c.get("trailer_clutch", False) for c in cars}
    bal_need = {b["id"]: b["capacity"] for b in balloons}

    # sanity checks ----------------------------------------------------
    if sum(trailer[c] for c in car_ids) < len(balloons):
        raise ValueError("not enough trailer-equipped cars for balloons")
    if sum(cap.values()) < len(people):
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
        model.Add(sum(trailer[c] * x[c, b] for c in car_ids) >= 1)

    # (3) passenger seats per balloon ≥ balloon.capacity
    for b in balloon_ids:
        model.Add(sum(pass_cap[c] * x[c, b] for c in car_ids) >= bal_need[b])

    # (4) passenger seats across all clusters ≥ |people|
    model.Add(sum(cap[c] * x[c, b] for c, b in x) >= len(people))

    # objective: minimise unused passenger seats
    unused = model.NewIntVar(0, sum(pass_cap.values()), "unused")
    model.Add(
        unused == sum(pass_cap.values()) - sum(pass_cap[c] * x[c, b] for c, b in x)
    )
    model.Minimize(unused)

    # solve ------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("no feasible clustering")

    clusters: Dict[str, List[str]] = {b: [] for b in balloon_ids}
    for (c, b), var in x.items():
        if solver.BooleanValue(var):
            clusters[b].append(c)

    # ----------------------------------------------------------------
    # 2.  Reserve seats for balloon passengers inside their own cars
    # ----------------------------------------------------------------
    car_by_id = {c["id"]: c for c in cars}  # live reference
    for bal in balloons:
        bid = bal["id"]
        need = bal["capacity"]  # seats to reserve
        for cid in clusters[bid]:
            if need == 0:
                break
            car = car_by_id[cid]
            pass_cap = car["capacity"] - 1  # seats excl. driver
            take = min(need, pass_cap)
            car["capacity"] -= take  # reserve seats
            need -= take
        if need > 0:
            raise RuntimeError(
                f"cluster seat reservation failed for {bid}: short {need}"
            )

    return clusters
