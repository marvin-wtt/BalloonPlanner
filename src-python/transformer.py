from typing import Dict, List, Any


def transform_input_payload(balloons, cars, people, groups, history):
    balloons = _transform_list(
        balloons,
        {
            "id": "id",
            "maxCapacity": "capacity",
            "maxWeight": "max_weight",
            "allowedOperatorIds": "allowed_operators",
        },
    )
    # ensure defaults
    for b in balloons:
        b.setdefault("allowed_operators", [])

    cars = _transform_list(
        cars,
        {
            "id": "id",
            "hasTrailerClutch": "trailer_clutch",
            "maxCapacity": "capacity",
            "allowedOperatorIds": "allowed_operators",
        },
    )
    for c in cars:
        c.setdefault("allowed_operators", [])

    people = _transform_list(
        people,
        {
            "id": "id",
            "name": "name",
            "nationality": "nationality",
            "role": "role",
            "weight": "weight",
            "flights": "flights",
        },
    )
    for p in people:
        # safe defaults
        nat = p.get("nationality")
        p["nationality"] = nat or "unknown"
        p["flights"] = int(p.get("flights") or 0)

    precluster, frozen = _transform_vehicle_groups(groups)
    history = _transform_flights(history)

    return (
        balloons,
        cars,
        people,
        precluster,
        frozen,
        history,
    )


def _transform_vehicle_groups(
    groups: list[dict],
) -> tuple[dict[str, list[str]], list[dict[str, str]]]:
    """
    Converts a list of balloon-car group dicts into:
      1) balloon_to_cars: dict mapping balloon_id -> list of car_ids
      2) vehicle_to_passengers: list of {'vehicle','role','person'} assignments
    NOTE: Expects passengerIds to be LISTS (not comma-separated strings).
    """
    balloon_to_cars: dict[str, list[str]] = {}
    assignments: list[dict[str, str]] = []

    def assign_vehicle(vehicle: dict[str, Any]):
        op_id = vehicle.get("operatorId")
        if op_id:
            assignments.append(
                {
                    "vehicle": vehicle["id"],
                    "role": "operator",
                    "person": op_id,
                }
            )

        for passenger in vehicle.get("passengerIds", []) or []:
            assignments.append(
                {"vehicle": vehicle["id"], "role": "passenger", "person": passenger}
            )

    for group in groups or []:
        # Extract balloon info
        balloon = group.get("balloon", {})
        b_id = balloon.get("id")
        if not b_id:
            # ignore malformed groups
            continue

        # Record balloon’s passengers
        assign_vehicle(balloon)

        # Process cars in this group
        car_ids: list[str] = []
        for car in group.get("cars", []) or []:
            c_id = car.get("id")
            if not c_id:
                continue
            car_ids.append(c_id)
            assign_vehicle(car)

        # Map balloon to its cars
        balloon_to_cars[b_id] = car_ids

    return balloon_to_cars, assignments


def _transform_flights(flights: list[dict]) -> list[dict]:
    """
    Converts each flight's vehicleGroups so that within each group:
      - balloon: id -> id, operatorId -> operator, passengerIds -> passengers
      - cars:  list of {id, operator, passengers}
    Other flight properties are ignored.
    """
    transformed_flights = []
    for flight in flights or []:
        new_groups = []
        for group in flight.get("vehicleGroups", []) or []:
            # Transform balloon
            b = group.get("balloon", {})
            if "operatorId" not in b:
                raise ValueError("Flight history must be complete, missing operator")
            new_balloon = {
                "id": b["id"],
                "operator": b["operatorId"],
                "passengers": b.get("passengerIds", []) or [],
            }
            # Transform cars
            new_cars = []
            for c in group.get("cars", []) or []:
                if "operatorId" not in c:
                    raise ValueError(
                        "Flight history must be complete, missing operator"
                    )
                new_cars.append(
                    {
                        "id": c["id"],
                        "operator": c["operatorId"],
                        "passengers": c.get("passengerIds", []) or [],
                    }
                )

            new_groups.append({"balloon": new_balloon, "cars": new_cars})
        transformed_flights.append({"groups": new_groups})

    return transformed_flights


def transform_output(
    vehicle_info: Dict[str, Dict[str, Any]],
    clusters: Dict[str, List[str]],
    original_groups: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    result_groups: List[Dict[str, Any]] = []
    seen_balloons = set()

    # Helper to merge “original order” vs “final assignment” for passengers
    def _ordered_passengers(
        vid: str,
        orig_list: List[str],
        final_list: List[str],
    ) -> List[str]:
        ordered = []
        seen = set()

        # 1) keep original order for overlapping passengers
        for p in orig_list:
            if p in final_list:
                ordered.append(p)
                seen.add(p)

        # 2) append any remaining from final_list
        for p in final_list:
            if p not in seen:
                ordered.append(p)

        return ordered

    # 1) Keep original group order where possible
    for group in original_groups or []:
        b_obj = group.get("balloon", {})
        b_id = b_obj.get("id")
        if not b_id or b_id not in clusters:
            continue

        seen_balloons.add(b_id)

        balloon_info = vehicle_info.get(b_id, {})
        new_balloon_block: Dict[str, Any] = {
            "id": b_id,
            "operatorId": balloon_info.get("operator", None),
            "passengerIds": _ordered_passengers(
                b_id,
                b_obj.get("passengerIds", []) or [],
                balloon_info.get("passengers", []) or [],
            ),
        }

        # maintain original car order; append new ones after
        orig_car_ids = [
            c.get("id") for c in group.get("cars", []) or [] if c.get("id") is not None
        ]
        assigned_car_ids = clusters[b_id]
        kept_cars = [c_id for c_id in orig_car_ids if c_id in assigned_car_ids]
        new_cars = [c_id for c_id in assigned_car_ids if c_id not in kept_cars]
        ordered_car_ids = kept_cars + new_cars

        new_car_blocks: List[Dict[str, Any]] = []
        orig_car_map = {
            c["id"]: (c.get("passengerIds", []) or [])
            for c in group.get("cars", []) or []
        }

        for c_id in ordered_car_ids:
            c_info = vehicle_info.get(c_id, {})
            orig_pax = orig_car_map.get(c_id, [])
            final_pax = c_info.get("passengers", []) or []
            new_car_blocks.append(
                {
                    "id": c_id,
                    "operatorId": c_info.get("operator", None),
                    "passengerIds": _ordered_passengers(c_id, orig_pax, final_pax),
                }
            )

        result_groups.append({"balloon": new_balloon_block, "cars": new_car_blocks})

    # 2) Append leftover balloons (not in original_groups)
    for b_id, assigned_car_ids in clusters.items():
        if b_id in seen_balloons:
            continue

        balloon_info = vehicle_info.get(b_id, {})
        new_balloon_block = {
            "id": b_id,
            "operatorId": balloon_info.get("operator", None),
            "passengerIds": balloon_info.get("passengers", []) or [],
        }

        new_car_blocks: List[Dict[str, Any]] = []
        for c_id in assigned_car_ids:
            c_info = vehicle_info.get(c_id, {})
            new_car_blocks.append(
                {
                    "id": c_id,
                    "operatorId": c_info.get("operator", None),
                    "passengerIds": c_info.get("passengers", []) or [],
                }
            )

        result_groups.append({"balloon": new_balloon_block, "cars": new_car_blocks})

    return result_groups


def _transform_list(items: list[dict], mapping: dict[str, str]) -> list[dict]:
    """
    Apply key-mapping to a list of dicts, keeping only keys present in the mapping.
    """
    transformed = []
    for item in items or []:
        new_item = {}
        for old_key, new_key in mapping.items():
            if old_key in item:
                new_item[new_key] = item[old_key]
        transformed.append(new_item)
    return transformed
