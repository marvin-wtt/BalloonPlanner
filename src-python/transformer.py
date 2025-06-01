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

    cars = _transform_list(
        cars,
        {
            "id": "id",
            "hasTrailerClutch": "trailer_clutch",
            "maxCapacity": "capacity",
            "allowedOperatorIds": "allowed_operators",
        },
    )

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
      2) vehicle_to_passengers: dict mapping every vehicle_id (balloon or car) -> list of passengerIds
    Assumes passengerIds fields are comma-separated strings.
    """
    balloon_to_cars: dict[str, list[str]] = {}
    assignments: list[dict[str, str]] = []

    def assign_vehicle(vehicle: dict[str, str]):
        if vehicle["operatorId"]:
            assignments.append(
                {
                    "vehicle": vehicle["id"],
                    "role": "operator",
                    "person": vehicle["operatorId"],
                }
            )

        for passenger in vehicle["passengerIds"]:
            assignments.append(
                {"vehicle": vehicle["id"], "role": "passenger", "person": passenger}
            )

    for group in groups:
        # Extract balloon info
        balloon = group["balloon"]
        b_id = balloon["id"]
        # Record balloon’s passengers
        assign_vehicle(balloon)

        # Process cars in this group
        car_ids: list[str] = []
        for car in group["cars"]:
            c_id = car["id"]
            car_ids.append(c_id)
            # Record each car’s passengers
            assign_vehicle(car)

        # Map balloon to its cars
        balloon_to_cars[b_id] = car_ids

    return balloon_to_cars, assignments


def _transform_flights(flights: list[dict]) -> list[dict]:
    """
    Converts each flight's vehicleGroups so that within each group:
      - balloon: id -> id, operatorId -> operator, passengerIds -> passengers
      - cars:  list of {id, operator, passengers}
    Other flight properties are passed through unchanged.
    """
    transformed_flights = []
    for flight in flights:
        new_groups = []
        for group in flight["vehicleGroups"]:
            # Transform balloon
            b = group.get("balloon", {})
            if "operatorId" not in b:
                raise ValueError("Flight history must be complete, missing operator")
            new_balloon = {
                "id": b["id"],
                "operator": b["operatorId"],
                "passengers": b["passengerIds"],
            }
            # Transform cars
            new_cars = []
            for c in group["cars"]:
                if "operatorId" not in c:
                    raise ValueError(
                        "Flight history must be complete, missing operator"
                    )
                new_cars.append(
                    {
                        "id": c["id"],
                        "operator": c["operatorId"],
                        "passengers": c["passengerIds"],
                    }
                )

            new_groups.append({"balloon": new_balloon, "cars": new_cars})
        # Copy flight and replace vehicleGroups
        transformed_flights.append(
            {
                "groups": new_groups,
            }
        )

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
        vid: str,  # vehicle ID (balloon or car)
        orig_list: List[
            str
        ],  # original payload’s passengerIds for this vid (might be [])
        final_list: List[str],  # vehicle_info[vid]["passengers"]
    ) -> List[str]:
        ordered = []
        seen = set()

        # 1) take everyone from orig_list that still appears in final_list, in that order
        for p in orig_list:
            if p in final_list:
                ordered.append(p)
                seen.add(p)

        # 2) append any remaining from final_list that weren’t in orig_list
        for p in final_list:
            if p not in seen:
                ordered.append(p)

        return ordered

    # --- 1) First pass: process every group in original_groups, in the given order ---
    for group in original_groups:
        # a) what balloon ID did this original group have?
        b_obj = group.get("balloon", {})
        b_id = b_obj.get("id")
        if b_id is None:
            continue

        # b) if that balloon isn’t actually in clusters, skip it
        if b_id not in clusters:
            continue

        # c) Build a new group entry for b_id
        seen_balloons.add(b_id)

        #   (i) balloon’s operatorId from vehicle_info
        balloon_info = vehicle_info.get(b_id, {})
        new_balloon_block: Dict[str, Any] = {
            "id": b_id,
            "operatorId": balloon_info.get("operator", None),
            # preserve passenger‐order: compare orig vs final
            "passengerIds": _ordered_passengers(
                b_id,
                b_obj.get("passengerIds", []),
                balloon_info.get("passengers", []),
            ),
        }

        #   (ii) figure out which cars from original “group['cars']” still ended up in clusters[b_id],
        #        in the exact same order, then append any brand‐new cars afterward
        orig_car_ids = [
            c.get("id") for c in group.get("cars", []) if c.get("id") is not None
        ]
        assigned_car_ids = clusters[b_id]

        #   (ii.a) those original cars that the solver still assigned under this balloon
        kept_cars = [c_id for c_id in orig_car_ids if c_id in assigned_car_ids]

        #   (ii.b) any cars in assigned_car_ids that weren’t already in kept_cars
        #          (in the order they appear in assigned_car_ids)
        new_cars = [c_id for c_id in assigned_car_ids if c_id not in kept_cars]

        ordered_car_ids = kept_cars + new_cars

        #   (iii) build each car’s block, preserving its passenger‐order vs final assignment
        new_car_blocks: List[Dict[str, Any]] = []
        #     to look up the original “passengerIds” for a given car-id:
        orig_car_map = {
            c["id"]: c.get("passengerIds", []) for c in group.get("cars", [])
        }

        for c_id in ordered_car_ids:
            c_info = vehicle_info.get(c_id, {})
            orig_pax = orig_car_map.get(c_id, [])
            final_pax = c_info.get("passengers", [])
            new_car_blocks.append(
                {
                    "id": c_id,
                    "operatorId": c_info.get("operator", None),
                    "passengerIds": _ordered_passengers(c_id, orig_pax, final_pax),
                }
            )

        #   (iv) append this new group to the result
        result_groups.append(
            {
                "balloon": new_balloon_block,
                "cars": new_car_blocks,
            }
        )

    # --- 2) Second pass: append any leftover balloons that never appeared in original_groups ---
    for b_id, assigned_car_ids in clusters.items():
        if b_id in seen_balloons:
            continue

        #   (i) balloon block, with final passengers
        balloon_info = vehicle_info.get(b_id, {})
        new_balloon_block = {
            "id": b_id,
            "operatorId": balloon_info.get("operator", None),
            "passengerIds": balloon_info.get("passengers", []),
        }

        #   (ii) cars, in the order clusters[b_id] provides
        new_car_blocks: List[Dict[str, Any]] = []
        for c_id in assigned_car_ids:
            c_info = vehicle_info.get(c_id, {})
            new_car_blocks.append(
                {
                    "id": c_id,
                    "operatorId": c_info.get("operator", None),
                    "passengerIds": c_info.get("passengers", []),
                }
            )

        result_groups.append(
            {
                "balloon": new_balloon_block,
                "cars": new_car_blocks,
            }
        )

    return result_groups


def _transform_list(items: list[dict], mapping: dict[str, str]) -> list[dict]:
    """
    Apply key-mapping to a list of dicts, keeping only keys present in the mapping.
    """
    transformed = []
    for item in items:
        new_item = {}
        for old_key, new_key in mapping.items():
            if old_key in item:
                new_item[new_key] = item[old_key]
        transformed.append(new_item)
    return transformed
