"""
Test suite for solve_flight_leg and solve_vehicle_groups.

Run with:  pytest test_solver.py -v

Car capacity sizing rule: reserve_group_car_seats deducts balloon.maxCapacity
seats from the car before the solver runs, so each car needs:
  car.maxCapacity = balloon.maxCapacity + ground_crew_count
"""
import copy
import pytest
from solver_flight_leg import solve_flight_leg
from solver_vehicle_group import solve_vehicle_groups


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def balloon(id, capacity, operators, *, max_weight=None):
    b = {"id": id, "name": id, "maxCapacity": capacity, "allowedOperatorIds": operators}
    if max_weight is not None:
        b["maxWeight"] = max_weight
    return b


def car(id, capacity, operators, *, trailer=True):
    return {
        "id": id,
        "name": id,
        "maxCapacity": capacity,
        "allowedOperatorIds": operators,
        "hasTrailerClutch": trailer,
    }


def person(id, *, role="participant", flights=0, languages=None, nationality="de",
           weight=80, first_time=False):
    p = {
        "id": id,
        "role": role,
        "flightsSoFar": flights,
        "nationality": nationality,
        "weight": weight,
    }
    if languages is not None:
        p["languages"] = languages
    if first_time:
        p["firstTime"] = True
    return p


def solve(
    balloons,
    cars,
    people,
    vehicle_groups,
    *,
    frozen=None,
    fixed_groups=None,
    group_history=None,
    balloon_history=None,
    people_meet_history=None,
    planning_horizon_legs=0,
    w_pilot_fairness=0,
    w_passenger_fairness=0,
    w_tiebreak_fairness=0,
    w_no_solo_participant=0,
    w_divers_nationalities=0,
    w_new_meetings=0,
    w_group_passenger_balance=0,
    w_group_rotation=0,
    w_balloon_rotation=0,
    w_low_flights_lookahead=0,
    counselor_flight_discount=0.9,
    default_person_weight=80,
    c_common_language_passengers=False,
    c_common_language_operators=False,
    time_limit_s=30,
    random_seed=42,
):
    # Deep-copy to prevent reserve_group_car_seats from mutating shared fixtures.
    return solve_flight_leg(
        balloons=copy.deepcopy(balloons),
        cars=copy.deepcopy(cars),
        people=copy.deepcopy(people),
        vehicle_groups=vehicle_groups,
        group_history=group_history,
        balloon_history=balloon_history,
        people_meet_history=people_meet_history,
        frozen=frozen or {},
        fixed_groups=fixed_groups,
        planning_horizon_legs=planning_horizon_legs,
        c_common_language_passengers=c_common_language_passengers,
        c_common_language_operators=c_common_language_operators,
        w_pilot_fairness=w_pilot_fairness,
        w_passenger_fairness=w_passenger_fairness,
        w_tiebreak_fairness=w_tiebreak_fairness,
        w_no_solo_participant=w_no_solo_participant,
        w_divers_nationalities=w_divers_nationalities,
        w_new_meetings=w_new_meetings,
        w_group_passenger_balance=w_group_passenger_balance,
        w_group_rotation=w_group_rotation,
        w_balloon_rotation=w_balloon_rotation,
        w_low_flights_lookahead=w_low_flights_lookahead,
        counselor_flight_discount=counselor_flight_discount,
        default_person_weight=default_person_weight,
        time_limit_s=time_limit_s,
        random_seed=random_seed,
    )


def assignments(result):
    return result["assignments"]


def occupants(result, vehicle_id):
    a = result["assignments"][vehicle_id]
    people = []
    if a["operatorId"]:
        people.append(a["operatorId"])
    people.extend(a["passengerIds"])
    return set(people)


def operator(result, vehicle_id):
    return result["assignments"][vehicle_id]["operatorId"]


def passengers(result, vehicle_id):
    return set(result["assignments"][vehicle_id]["passengerIds"])


def weight_in_vehicle(result, vehicle_id, people):
    by_id = {p["id"]: p for p in people}
    return sum(by_id[pid].get("weight", 80) for pid in occupants(result, vehicle_id))


# ---------------------------------------------------------------------------
# Shared minimal scenario
# balloon cap 3 + 2 ground crew → car needs cap 5 (5 - 3 = 2 usable seats)
# ---------------------------------------------------------------------------

BALLOONS = [balloon("b1", 3, ["p1"])]
CARS = [car("c1", 5, ["p2"])]
GROUPS = {"b1": ["c1"]}
PEOPLE = [
    person("p1", role="counselor"),
    person("p2", role="counselor"),
    person("p3"),
    person("p4"),
    person("p5"),
]


# ===========================================================================
# Hard constraints
# ===========================================================================

class TestEveryPersonAssigned:
    def test_all_people_get_exactly_one_seat(self):
        result = solve(BALLOONS, CARS, PEOPLE, GROUPS)
        a = assignments(result)
        seated = set()
        for asgn in a.values():
            if asgn["operatorId"]:
                seated.add(asgn["operatorId"])
            seated.update(asgn["passengerIds"])
        assert seated == {p["id"] for p in PEOPLE}

    def test_no_person_in_two_vehicles(self):
        result = solve(BALLOONS, CARS, PEOPLE, GROUPS)
        a = assignments(result)
        seen = []
        for asgn in a.values():
            if asgn["operatorId"]:
                seen.append(asgn["operatorId"])
            seen.extend(asgn["passengerIds"])
        assert len(seen) == len(set(seen))


class TestOperatorEligibility:
    def test_ineligible_person_cannot_operate(self):
        # Only "pilot" can operate b1; "driver" is the only car operator
        people = [person("pilot", role="counselor"), person("driver", role="counselor"), person("p3")]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 3, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]})
        assert operator(result, "b1") == "pilot"
        assert operator(result, "c1") == "driver"

    def test_no_eligible_operator_raises(self):
        people = [person("p1"), person("p2")]
        b = [balloon("b1", 1, [])]
        c = [car("c1", 2, ["p1"])]
        with pytest.raises(RuntimeError):
            solve(b, c, people, {"b1": ["c1"]})


class TestCapacity:
    def test_balloon_capacity_not_exceeded(self):
        # balloon cap 2, 5 people → car needs cap 5 (5 - 2 = 3 usable)
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 5, ["driver"])]
        people = [
            person("pilot", role="counselor"), person("driver", role="counselor"),
            person("p3"), person("p4"), person("p5"),
        ]
        result = solve(b, c, people, {"b1": ["c1"]})
        total = (1 if operator(result, "b1") else 0) + len(passengers(result, "b1"))
        assert total <= 2

    def test_car_capacity_not_exceeded(self):
        # balloon cap 1, car cap 3 → after reservation car has 2 usable seats
        b = [balloon("b1", 1, ["p1"])]
        c = [car("c1", 3, ["p2"])]
        people = [person("p1", role="counselor"), person("p2", role="counselor"), person("p3")]
        result = solve(b, c, people, {"b1": ["c1"]})
        total = (1 if operator(result, "c1") else 0) + len(passengers(result, "c1"))
        assert total <= 2  # post-reservation capacity


class TestWeightLimit:
    def test_max_weight_respected(self):
        # balloon cap 3, max weight 200
        # pilot(70) + light(60) + heavy(120) = 250 > 200 → heavy must go to car
        b = [balloon("b1", 3, ["pilot"], max_weight=200)]
        c = [car("c1", 7, ["driver"])]
        people = [
            person("pilot", role="counselor", weight=70),
            person("driver", role="counselor", weight=70),
            person("light", weight=60),
            person("heavy", weight=120),
        ]
        result = solve(b, c, people, {"b1": ["c1"]})
        assert weight_in_vehicle(result, "b1", people) <= 200


class TestFrozenAssignments:
    def test_frozen_operator_is_respected(self):
        result = solve(
            BALLOONS, CARS, PEOPLE, GROUPS,
            frozen={"b1": {"operatorId": "p1", "passengerIds": []}},
        )
        assert operator(result, "b1") == "p1"

    def test_frozen_passenger_is_respected(self):
        result = solve(
            BALLOONS, CARS, PEOPLE, GROUPS,
            frozen={"b1": {"operatorId": "p1", "passengerIds": ["p3"]}},
        )
        assert "p3" in passengers(result, "b1")

    def test_frozen_car_passenger_is_respected(self):
        result = solve(
            BALLOONS, CARS, PEOPLE, GROUPS,
            frozen={"c1": {"operatorId": None, "passengerIds": ["p4"]}},
        )
        assert "p4" in occupants(result, "c1")


class TestFixedGroups:
    def test_person_stays_in_fixed_group(self):
        fixed = {"p3": "b1", "p4": "b1"}
        result = solve(BALLOONS, CARS, PEOPLE, GROUPS, fixed_groups=fixed)
        allowed = occupants(result, "b1") | occupants(result, "c1")
        assert "p3" in allowed
        assert "p4" in allowed

    def test_person_not_placed_in_wrong_group(self):
        # Two groups: b1/c1 and b2/c2. p5 is fixed to group b1.
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("p5"), person("p6"),
        ]
        result = solve(b, c, people, groups, fixed_groups={"p5": "b1"})
        assert "p5" in occupants(result, "b1") | occupants(result, "c1")
        assert "p5" not in occupants(result, "b2") | occupants(result, "c2")


class TestLanguageConstraints:
    def test_passenger_excluded_when_language_incompatible(self):
        # pilot speaks only "en"; "de_speaker" cannot sit in the balloon
        people = [
            person("pilot",     role="counselor", languages=["en"]),
            person("driver",    role="counselor", languages=["de"]),
            person("en_speaker", languages=["en"]),
            person("de_speaker", languages=["de"]),
        ]
        b = [balloon("b1", 3, ["pilot"])]
        c = [car("c1", 5, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       c_common_language_passengers=True)
        assert "de_speaker" not in passengers(result, "b1")

    def test_universal_speaker_seated_in_any_language_balloon(self):
        people = [
            person("pilot",     role="counselor", languages=["en"]),
            person("driver",    role="counselor", languages=["de"]),
            person("universal"),  # no languages → speaks all
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 3, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       c_common_language_passengers=True)
        seated = set()
        for asgn in assignments(result).values():
            if asgn["operatorId"]:
                seated.add(asgn["operatorId"])
            seated.update(asgn["passengerIds"])
        assert "universal" in seated

    def test_incompatible_operator_languages_infeasible(self):
        # pilot speaks "en", driver speaks "de" → no valid group operator pair
        people = [
            person("pilot",  role="counselor", languages=["en"]),
            person("driver", role="counselor", languages=["de"]),
            person("p3",     languages=["en"]),
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 3, ["driver"])]
        with pytest.raises(RuntimeError):
            solve(b, c, people, {"b1": ["c1"]},
                  c_common_language_operators=True,
                  c_common_language_passengers=True)

    def test_compatible_operator_languages_feasible(self):
        people = [
            person("pilot",  role="counselor", languages=["en"]),
            person("driver", role="counselor", languages=["en"]),
            person("p3",     languages=["en"]),
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 3, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       c_common_language_operators=True)
        assert operator(result, "b1") == "pilot"
        assert operator(result, "c1") == "driver"


class TestInfeasible:
    def test_not_enough_total_seats_raises(self):
        # 2 seats total, 4 people
        b = [balloon("b1", 1, ["p1"])]
        c = [car("c1", 1, ["p2"])]
        people = [person("p1"), person("p2"), person("p3"), person("p4")]
        with pytest.raises(RuntimeError):
            solve(b, c, people, {"b1": ["c1"]})


# ===========================================================================
# Soft weights
# ===========================================================================

class TestPilotFairness:
    def test_prefers_pilot_with_fewer_flights(self):
        # Only "rookie" and "veteran" can fly b1; only "driver" can drive c1.
        # With pilot fairness, rookie (0 flights) beats veteran (10 flights).
        people = [
            person("veteran", role="counselor", flights=10),
            person("rookie",  role="counselor", flights=0),
            person("driver",  role="counselor", flights=5),
        ]
        b = [balloon("b1", 2, ["veteran", "rookie"])]
        c = [car("c1", 3, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]}, w_pilot_fairness=50)
        assert operator(result, "b1") == "rookie"


class TestPassengerFairness:
    def test_prefers_low_flight_passenger_in_balloon(self):
        # balloon cap 2 → only 1 passenger slot; "low" (0 flights) should
        # win it over "high" (10 flights)
        people = [
            person("pilot",  role="counselor", flights=0),
            person("driver", role="counselor", flights=0),
            person("low",    flights=0),
            person("high",   flights=10),
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 4, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]}, w_passenger_fairness=50)
        assert "low" in passengers(result, "b1")
        assert "high" not in passengers(result, "b1")


class TestNoSoloParticipant:
    def test_avoids_single_participant_in_car(self):
        # balloon cap 3 holds pilot + 2 pax; car gets driver + 1 remaining pax
        # the weight should prevent exactly 1 participant being alone in the car
        people = [
            person("pilot",  role="counselor"),
            person("driver", role="counselor"),
            person("p3"),
            person("p4"),
        ]
        b = [balloon("b1", 3, ["pilot"])]
        c = [car("c1", 5, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]}, w_no_solo_participant=200)
        car_participants = [
            pid for pid in assignments(result)["c1"]["passengerIds"]
            if next(p for p in people if p["id"] == pid)["role"] == "participant"
        ]
        assert len(car_participants) != 1


class TestDiverseNationalities:
    def test_mixes_nationalities_in_balloon(self):
        people = [
            person("pilot",  role="counselor", nationality="de"),
            person("driver", role="counselor", nationality="fr"),
            person("de1",    nationality="de"),
            person("de2",    nationality="de"),
            person("fr1",    nationality="fr"),
            person("fr2",    nationality="fr"),
        ]
        b = [balloon("b1", 4, ["pilot"])]
        c = [car("c1", 8, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]}, w_divers_nationalities=50)
        nats = {
            next(p["nationality"] for p in people if p["id"] == pid)
            for pid in occupants(result, "b1")
        }
        assert len(nats) > 1


class TestGroupRotation:
    def test_avoids_balloon_person_has_been_in_before(self):
        # group_history tracks balloon IDs; "px" has 5 visits to b2.
        # With high rotation weight, px should not be placed in b2.
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("px"),
        ]
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        result = solve(b, c, people, groups,
                       group_history={"px": {"b2": 5}},
                       w_group_rotation=50)
        assert "px" not in occupants(result, "b2")

    def test_avoids_car_of_group_person_has_been_in_before(self):
        # group_history is keyed by group id (= balloon id); it must also steer
        # people away from the *cars* of that group. Balloons hold only the
        # pilot here, so px/py must ride in cars.
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("px"), person("py"),
        ]
        b = [balloon("b1", 1, ["p1"]), balloon("b2", 1, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        result = solve(b, c, people, groups,
                       group_history={"px": {"b2": 5}, "py": {"b1": 5}},
                       w_group_rotation=50)
        assert "px" in occupants(result, "c1")
        assert "py" in occupants(result, "c2")


class TestBalloonRotation:
    def test_prefers_passenger_who_has_not_flown_this_balloon(self):
        # balloon cap 2 → only 1 passenger slot.
        # "been_in_b1" has 5 prior flights in b1; "new_to_b1" has none
        # → "new_to_b1" should win the single passenger seat.
        people = [
            person("pilot",      role="counselor"),
            person("driver",     role="counselor"),
            person("been_in_b1", flights=1),
            person("new_to_b1",  flights=1),
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 4, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       balloon_history={"been_in_b1": {"b1": 5}},
                       w_balloon_rotation=100)
        assert "new_to_b1" in passengers(result, "b1")
        assert "been_in_b1" not in passengers(result, "b1")

    def test_everyone_still_assigned_with_balloon_rotation(self):
        people = [
            person("pilot",  role="counselor"),
            person("driver", role="counselor"),
            person("p3"),
        ]
        b = [balloon("b1", 2, ["pilot"])]
        c = [car("c1", 3, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       balloon_history={"p3": {"b1": 0}},
                       w_balloon_rotation=100)
        seated = set()
        for asgn in assignments(result).values():
            if asgn["operatorId"]:
                seated.add(asgn["operatorId"])
            seated.update(asgn["passengerIds"])
        assert seated == {"pilot", "driver", "p3"}


class TestBalloonRotationLookahead:
    def test_places_novel_person_in_car_of_their_target_group(self):
        # Two groups, both balloons full (cap 2).
        # "px" has been in b2 (history=3) but not b1 → should land in c1 (b1's car).
        # "py" has been in b1 (history=3) but not b2 → should land in c2 (b2's car).
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("px"), person("py"),
        ]
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        result = solve(
            b, c, people, groups,
            balloon_history={"px": {"b2": 3}, "py": {"b1": 3}},
            fixed_groups=None,
            planning_horizon_legs=1,
            w_balloon_rotation=100,
        )
        assert "px" in occupants(result, "b1") | occupants(result, "c1")
        assert "py" in occupants(result, "b2") | occupants(result, "c2")

    def test_lookahead_active_with_empty_fixed_groups(self):
        # The app sends fixedGroups={} (not None) on the first leg; an empty
        # dict must enable the first-leg lookahead exactly like None does.
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("px"), person("py"),
        ]
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        result = solve(
            b, c, people, groups,
            balloon_history={"px": {"b2": 3}, "py": {"b1": 3}},
            fixed_groups={},
            planning_horizon_legs=1,
            w_balloon_rotation=100,
        )
        assert "px" in occupants(result, "b1") | occupants(result, "c1")
        assert "py" in occupants(result, "b2") | occupants(result, "c2")


class TestNewMeetings:
    def test_separates_people_who_have_met_before(self):
        # Two groups; "old_friends_a" and "old_friends_b" met 5 times → different groups
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3", role="counselor"), person("p4", role="counselor"),
            person("old_friends_a"), person("old_friends_b"),
            person("strangers_a"),   person("strangers_b"),
        ]
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 4, ["p3"]), car("c2", 4, ["p4"])]
        groups = {"b1": ["c1"], "b2": ["c2"]}
        meet_history = {
            "old_friends_a": {"old_friends_b": 5},
            "old_friends_b": {"old_friends_a": 5},
        }
        result = solve(b, c, people, groups,
                       people_meet_history=meet_history,
                       w_new_meetings=100)
        g1 = occupants(result, "b1") | occupants(result, "c1")
        g2 = occupants(result, "b2") | occupants(result, "c2")
        assert not ({"old_friends_a", "old_friends_b"} <= g1)
        assert not ({"old_friends_a", "old_friends_b"} <= g2)


class TestLowFlightsLookahead:
    def test_keeps_low_flight_people_in_cars_for_next_leg(self):
        # Balloon seats 3 people; with horizon=1, low-flight people should stay
        # in the car so they can fly in leg 2.
        people = [
            person("pilot",  role="counselor", flights=5),
            person("driver", role="counselor", flights=5),
            person("low1",   flights=0),
            person("low2",   flights=0),
            person("high1",  flights=10),
            person("high2",  flights=10),
        ]
        b = [balloon("b1", 3, ["pilot"])]
        c = [car("c1", 7, ["driver"])]
        result = solve(b, c, people, {"b1": ["c1"]},
                       planning_horizon_legs=1,
                       w_low_flights_lookahead=100)
        c1_occ = occupants(result, "c1")
        assert "low1" in c1_occ
        assert "low2" in c1_occ


# ===========================================================================
# solve_vehicle_groups
# ===========================================================================

class TestSolveVehicleGroups:
    def _people(self):
        return [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3"), person("p4"),
        ]

    def test_basic_group_formed(self):
        b = [balloon("b1", 2, ["p1"])]
        c = [car("c1", 3, ["p2"])]
        result = solve_vehicle_groups(b, c, self._people())
        assert "b1" in result["vehicleGroups"]
        assert "c1" in result["vehicleGroups"]["b1"]

    def test_each_car_in_at_most_one_group(self):
        b = [balloon("b1", 2, ["p1"]), balloon("b2", 2, ["p2"])]
        c = [car("c1", 3, ["p1"]), car("c2", 3, ["p2"])]
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3"), person("p4"), person("p5"), person("p6"),
        ]
        result = solve_vehicle_groups(b, c, people)
        all_assigned = [cid for cars in result["vehicleGroups"].values() for cid in cars]
        assert len(all_assigned) == len(set(all_assigned))

    def test_requires_trailer_car_for_real_balloon(self):
        b = [balloon("b1", 2, ["p1"])]
        c = [car("c1", 3, ["p2"], trailer=False)]
        with pytest.raises(ValueError, match="trailer"):
            solve_vehicle_groups(b, c, self._people())

    def test_frozen_assignment_respected(self):
        b = [balloon("b1", 2, ["p1"])]
        c = [car("c1", 3, ["p1"]), car("c2", 3, ["p2"])]
        people = [
            person("p1", role="counselor"), person("p2", role="counselor"),
            person("p3"), person("p4"),
        ]
        result = solve_vehicle_groups(b, c, people, frozen={"b1": ["c2"]})
        assert "c2" in result["vehicleGroups"]["b1"]

    def test_no_operator_candidates_raises(self):
        b = [balloon("b1", 2, [])]
        c = [car("c1", 3, ["p1"])]
        with pytest.raises(ValueError):
            solve_vehicle_groups(b, c, self._people())

    def test_insufficient_car_seats_raises(self):
        # balloon cap 2 needs 2 pax seats; car cap 2 only has 1 pax seat (cap-1)
        b = [balloon("b1", 2, ["p1"])]
        c = [car("c1", 2, ["p2"])]
        with pytest.raises((ValueError, RuntimeError)):
            solve_vehicle_groups(b, c, self._people())

    def test_language_incompatible_group_raises(self):
        people = [
            person("b_pilot", role="counselor", languages=["en"]),
            person("c_driver", role="counselor", languages=["de"]),
            person("p3"), person("p4"),
        ]
        b = [balloon("b1", 2, ["b_pilot"])]
        c = [car("c1", 3, ["c_driver"])]
        with pytest.raises(RuntimeError):
            solve_vehicle_groups(b, c, people)
