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
    vehicle_info: dict[str, dict[str, str]], clusters: dict[str, list[str]]
) -> list[list[str]]:
    """
    Given:
      - vehicle_info: a dict mapping vehicle_id -> {
            'operator': str,
            'passengers': List[str]
        }
      - groups: a list of groups, each with:
          {
            'balloon': {'id': str, ...},
            'cars':   [{'id': str, ...}, ...]
          }
    Returns a new list of groups where each balloon and car gets
    'operatorId' and 'passengerIds' populated from vehicle_info.
    """
    groups = []

    for b_id, vehicles in clusters.items():
        # Copy the group to avoid mutating the input
        new_group = {"balloon": {}, "cars": []}

        # Enrich balloon
        info = vehicle_info.get(b_id, {})
        new_group["balloon"] = {
            "id": b_id,
            "operatorId": info.get("operator", None),
            "passengerIds": info.get("passengers", []),
        }

        # Enrich cars
        for c_id in vehicles:
            c_info = vehicle_info.get(c_id, {})
            new_group["cars"].append(
                {
                    "id": c_id,
                    "operatorId": c_info.get("operator", None),
                    "passengerIds": c_info.get("passengers", []),
                }
            )

        groups.append(new_group)
    return groups


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
