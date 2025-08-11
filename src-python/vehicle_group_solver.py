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
    Compute a mapping balloon_id -> [car_id, ...] for the current leg.
    NOTE: This function NO LONGER reserves seats. Call reserve_cluster_seats()
          afterwards to apply seat reservations based on the returned cluster.
    """
    precluster = precluster or {}

    car_ids = [c["id"] for c in cars]
    balloon_ids = [b["id"] for b in balloons]

    cap = {c["id"]: int(c["capacity"]) for c in cars}
    pax_cap = {cid: max(cap[cid] - 1, 0) for cid in car_ids}  # seats for passengers
    trailer = {c["id"]: bool(c.get("trailer_clutch", False)) for c in cars}
    bal_need = {b["id"]: int(b["capacity"]) for b in balloons}

    # sanity checks
    if sum(1 for c in car_ids if trailer[c]) < len(balloons):
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
    car_seats_needed = max(len(people) - sum(bal_need.values()), 0)
    model.Add(sum(cap[c] * x[c, b] for c, b in x) >= car_seats_needed)

    # objective: minimise unused passenger seats
    unused = model.NewIntVar(0, sum(pax_cap.values()), "unused")
    model.Add(unused == sum(pax_cap.values()) - sum(pax_cap[c] * x[c, b] for c, b in x))
    model.Minimize(unused)

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

    return clusters


def extract_fixed_cluster_from_history(
    groups: list[dict],
    history: list[dict],
) -> dict[str, list[str]]:
    """
    Copy the last flight's cluster (balloon -> list[carId]) and VALIDATE ONLY:
    - If the current input already assigns cars under a balloon, they must be a subset
      of the previous cluster for that balloon; otherwise raise a ValueError.
    - No mutation of the current groups happens here.
    Returns the copied cluster mapping from history.
    """
    if not history:
        raise ValueError("No flight history available to fix second-leg clusters.")

    # 1) Build cluster from *last* flight in history
    last = history[-1]
    fixed_clusters: dict[str, list[str]] = {}
    for grp in last.get("groups", []) or []:
        b_id = grp["balloon"]["id"]
        car_ids = [c["id"] for c in grp.get("cars", []) or []]
        fixed_clusters[b_id] = car_ids

    # 2) Validate: current groups (if any) must be a subset of fixed_clusters
    current_map: dict[str, list[str]] = {}
    for grp in groups or []:
        b = grp.get("balloon", {})
        b_id = b.get("id")
        if not b_id:
            continue
        current_map.setdefault(b_id, [])
        for c in grp.get("cars", []) or []:
            cid = c.get("id")
            if cid:
                current_map[b_id].append(cid)

    for b_id, cur_cars in current_map.items():
        if b_id not in fixed_clusters:
            raise ValueError(
                f"Balloon {b_id} not present in previous leg; refusing to overwrite cluster."
            )
        fixed_set = set(fixed_clusters[b_id])
        extra = [c for c in cur_cars if c not in fixed_set]
        if extra:
            raise ValueError(
                f"Second-leg cluster protection: balloon {b_id} has cars {extra} "
                f"that were not in the previous cluster {sorted(fixed_set)}."
            )

    return fixed_clusters


def reserve_cluster_seats(
    balloons: list[dict],
    cars: list[dict],
    cluster: dict[str, list[str]],
) -> None:
    """
    Reserve seats for each balloon's passengers inside *its own cluster cars*.
    Mutates `cars[*]['capacity']` only (does NOT touch groups or the cluster).
    Safe to call for any leg.
    """
    car_by_id = {c["id"]: c for c in cars}
    for bal in balloons:
        bid = bal["id"]
        need = int(bal.get("capacity", 0))
        for cid in cluster.get(bid, []):
            if need <= 0:
                break
            if cid not in car_by_id:
                raise ValueError(f"Car {cid} from cluster not found in current input.")
            car = car_by_id[cid]
            pax_cap_excl_driver = max(int(car.get("capacity", 0)) - 1, 0)
            take = min(need, pax_cap_excl_driver)
            car["capacity"] = int(car.get("capacity", 0)) - take
            need -= take
        if need > 0:
            raise RuntimeError(
                f"Seat reservation failed for {bid}: short {need} passenger seats "
                f"in cluster cars {cluster.get(bid, [])}."
            )
