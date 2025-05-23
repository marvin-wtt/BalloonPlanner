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
        unused ==
        sum(pass_cap.values()) -
        sum(pass_cap[c] * x[c, b] for c, b in x)
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
        # sort cluster cars by passenger capacity descending
        cluster_cars = sorted(
            clusters[bid],
            key=lambda cid: car_by_id[cid]["capacity"] - 1,
            reverse=True
        )
        for cid in cluster_cars:
            if need == 0:
                break
            car = car_by_id[cid]
            pass_cap = car["capacity"] - 1  # seats excl. driver
            take = min(need, pass_cap)
            car["capacity"] -= take  # reserve seats
            need -= take
        if need > 0:
            raise RuntimeError(f"cluster seat reservation failed for {bid}: short {need}")

    return clusters


if __name__ == "__main__":
    balloons = [
        {
            "id": "32e4c52e-34ea-496e-9679-e74a3a7a8aca",
            "capacity": 4,
            "allowed_operators": ["6e631981-bff0-438f-83b6-00f11876485a", "3591a300-4166-4dfe-a8e6-ac3df00bbd61"]
        },
        {
            "id": "6afbc561-a7ca-475b-b52e-583e8a507580",
            "capacity": 4,
            "allowed_operators": ["6e631981-bff0-438f-83b6-00f11876485a", "3591a300-4166-4dfe-a8e6-ac3df00bbd61"]
        },
        {
            "id": "8c15d20a-b774-493e-8b59-a9588d05c881",
            "capacity": 4,
            "allowed_operators": ["d370b0f5-e5ac-4bba-a667-79d8c63434df"]
        }
    ]

    cars = [
        {
            "id": "404e1916-d3e7-40b1-b4fe-691b2a3bf71d",
            "trailer_clutch": True,
            "capacity": 9,
            "allowed_operators": ["d43cb81e-8ae6-40d3-9351-13d90289fc6a", "6e631981-bff0-438f-83b6-00f11876485a", "200e2bce-cbf2-4a0f-985c-714ddd1c94f1", "14874772-6ea8-4dc9-91af-5ed2399fd983", "3591a300-4166-4dfe-a8e6-ac3df00bbd61", "d370b0f5-e5ac-4bba-a667-79d8c63434df"]
        },
        {
            "id": "2f53301f-e25a-4925-8429-8621e74c8d0a",
            "trailer_clutch": True,
            "capacity": 9,
            "allowed_operators": ["d43cb81e-8ae6-40d3-9351-13d90289fc6a", "6e631981-bff0-438f-83b6-00f11876485a", "200e2bce-cbf2-4a0f-985c-714ddd1c94f1", "14874772-6ea8-4dc9-91af-5ed2399fd983", "3591a300-4166-4dfe-a8e6-ac3df00bbd61"]
        },
        {
            "id": "976446b5-9e66-4f80-a62d-f24655bd9cb1",
            "trailer_clutch": True,
            "capacity": 9,
            "allowed_operators": ["d370b0f5-e5ac-4bba-a667-79d8c63434df", "200e2bce-cbf2-4a0f-985c-714ddd1c94f1"]
        }
    ]

    people = [
        {"id": "81fa6283-4631-4ab9-b740-956e08c80ecf", "nationality": "fr", "flights": 0},
        {"id": "a5b4d709-14fd-4380-826a-3a6524e41f21", "nationality": "de", "flights": 0},
        {"id": "83b7328f-f8f5-4183-aa06-9cea52b28780", "nationality": "fr", "flights": 0},
        {"id": "5d4751b1-4996-4930-afb9-619a1ca0b003", "nationality": "fr", "flights": 0},
        {"id": "7d62a28b-4c6a-4ec2-ab10-7d12eea4644b", "nationality": "de", "flights": 0},
        {"id": "15782a34-4318-4903-84c8-ba5973bee428", "nationality": "de", "flights": 0},
        {"id": "55030e98-fd6b-4781-8935-7030c36eedf9", "nationality": "de", "flights": 0},
        {"id": "58c68b1a-5d16-4fbf-9157-62481868ebf8", "nationality": "fr", "flights": 0},
        {"id": "e35113ee-cd88-4e79-990f-e415b1bf7ebd", "nationality": "de", "flights": 0},
        {"id": "73c0f266-2e76-42f8-bcc0-7e808d1a659d", "nationality": "fr", "flights": 0},
        {"id": "f9a6a50f-06d1-4301-bf03-feb7de171eb9", "nationality": "de", "flights": 0},
        {"id": "af73a70c-48e2-4750-a0fb-4f7e3eae89fd", "nationality": "de", "flights": 0},
        {"id": "e80a1d89-a389-4def-ad92-64ce0cefa6e1", "nationality": "fr", "flights": 0},
        {"id": "82e8cfbc-49bf-431a-81fe-0f00c423dca2", "nationality": "de", "flights": 0},
        {"id": "5f14d93e-0709-4336-9e5f-62c225edd351", "nationality": "de", "flights": 0},
        {"id": "fbc57aee-3175-4234-a04c-2a3cba3e3ea8", "nationality": "de", "flights": 0},
        {"id": "ffa6526f-ce5c-4765-b8e6-45ac127b2a86", "nationality": "de", "flights": 0},
        {"id": "55fc6963-df31-44ec-9453-ae1a48260cad", "nationality": "de", "flights": 0},
        {"id": "fb608a6e-683a-4536-848d-bfe6cde34a09", "nationality": "de", "flights": 0},
        {"id": "d43cb81e-8ae6-40d3-9351-13d90289fc6a", "nationality": "de", "flights": 0},
        {"id": "6e631981-bff0-438f-83b6-00f11876485a", "nationality": "de", "flights": 0},
        {"id": "200e2bce-cbf2-4a0f-985c-714ddd1c94f1", "nationality": "fr", "flights": 0},
        {"id": "14874772-6ea8-4dc9-91af-5ed2399fd983", "nationality": "de", "flights": 0},
        {"id": "b4e5407c-1cd9-4b69-b20f-bf6f8a53cf61", "nationality": "de", "flights": 0},
        {"id": "3591a300-4166-4dfe-a8e6-ac3df00bbd61", "nationality": "de", "flights": 0},
        {"id": "d370b0f5-e5ac-4bba-a667-79d8c63434df", "nationality": "fr", "flights": 0}
    ]

    # ----- build clusters -----------------------------------------------
    clusters = build_clusters(balloons, cars, people)

    from pprint import pprint

    print("Auto-generated clusters:")
    pprint(clusters)
