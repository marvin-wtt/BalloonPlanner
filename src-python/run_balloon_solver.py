#!/usr/bin/env python3
"""
run_balloon_solver.py
=====================
CLI / stream wrapper for the balloon camp solver.

Input  : one JSON object on stdin (see README).
Success: manifest JSON on stdout · exit-code 0
Failure: error JSON on stderr  · exit-code 1 or 2
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
import random
from typing import List, Any, NoReturn

from vehicle_solver import solve
from transformer import transform_input_payload, transform_output
from vehicle_group_solver import (
    build_clusters,
    extract_fixed_cluster_from_history,
    reserve_cluster_seats,
)


def _emit_error(exc: Exception, exit_code: int) -> NoReturn:
    """Serialize *exc* as one-line JSON to stderr and quit."""
    err_payload = {
        "ok": False,
        "type": type(exc).__name__,
        "message": str(exc),
        "trace": traceback.format_exc(),
    }
    json.dump(err_payload, sys.stderr)
    sys.stderr.write("\n")
    sys.exit(exit_code)


def _load_stdin_payload() -> dict[str, Any]:
    """Parse a single JSON object from STDIN. Exit 2 on failure."""
    try:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict):
            raise ValueError("STDIN payload must be a single JSON object")
        return payload
    except Exception as exc:  # noqa: BLE001
        _emit_error(exc, exit_code=2)  # never returns


def main(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Solve balloon-camp crew assignment")

    # general / reproducibility ------------------------------------------------
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic shuffles and solver (default: 42).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="CP-SAT worker threads for the main solver (default: 8).",
    )
    parser.add_argument(
        "--time-limit",
        type=int,
        default=20,
        help="Maximum solver runtime in seconds for the main solver (default: 20).",
    )

    # clustering pre-solver ----------------------------------------------------
    parser.add_argument(
        "--cluster-time-limit",
        type=int,
        default=5,
        help="Maximum solver runtime in seconds for clustering (default: 5).",
    )
    parser.add_argument(
        "--cluster-workers",
        type=int,
        default=None,
        help="CP-SAT worker threads for clustering (default: solver default).",
    )

    # soft-rule weights --------------------------------------------------------
    parser.add_argument(
        "--flight-leg",
        type=int,
        default=None,
        help="Which flight leg to solve for. Accepted values: 0, 1, or 2. "
        "Use 2 to keep people within their previous cluster.",
    )
    parser.add_argument(
        "--w-second-leg",
        type=int,
        default=20,
        help="(Deprecated name) Weight for low-flight balance in second leg.",
    )
    parser.add_argument(
        "--w-low-flights-second-leg",
        type=int,
        default=None,
        help="Weight for prioritising low-flight participants in cars for leg 2.",
    )
    parser.add_argument(
        "--w-pilot-fairness",
        type=int,
        default=1,
        help=(
            "Weight for balancing how many flights each pilot flies "
            "(higher → pilots fly a more equal number of times)."
        ),
    )
    parser.add_argument(
        "--w-passenger-fairness",
        type=int,
        default=20,
        help=(
            "Weight for balancing how many flights each passenger takes "
            "(higher → passengers fly a more equal number of times)."
        ),
    )
    parser.add_argument(
        "--w-nationality-diversity",
        type=int,
        default=3,
        help=(
            "Weight for distributing nationalities evenly across each vehicle "
            "(higher → vehicles are more nationally diverse)."
        ),
    )
    parser.add_argument(
        "--w-vehicle-rotation",
        type=int,
        default=5,
        help=(
            "Weight that penalizes assigning the same passenger to the same vehicle "
            "across multiple flights (higher → more rotation)."
        ),
    )
    parser.add_argument(
        "--w-no-solo-participant",
        type=int,
        default=30,
        help=(
            "Weight that penalizes a car with exactly one participant onboard "
            "(higher → discourage solo assignments)."
        ),
    )
    parser.add_argument(
        "--w-cluster-passenger-balance",
        type=int,
        default=7,
        help=(
            "Weight for balancing passenger count across vehicle clusters "
            "(higher → clusters receive similar passenger counts)."
        ),
    )
    parser.add_argument(
        "--w-second-leg-overweight",
        type=int,
        default=50,
        help=(
            "Weight that penalizes overweight (by estimated kg) for low-flight "
            "people in leg 2 cars."
        ),
    )
    parser.add_argument(
        "--counselor-flight-discount",
        type=int,
        default=1,
        help=(
            "Flights subtracted from counselors when prioritising low-flight "
            "passengers (prefer participants)."
        ),
    )
    parser.add_argument(
        "--default-person-weight",
        type=int,
        default=80,
        help="Fallback weight in kilograms for people whose weight is unknown.",
    )

    args = parser.parse_args(argv)

    # alias handling for second-leg weight
    w_low_second = (
        args.w_low_flights_second_leg
        if args.w_low_flights_second_leg is not None
        else args.w_second_leg
    )

    # ---------------------------------------------------------------------#
    # Gather input                                                          #
    # ---------------------------------------------------------------------#
    payload = _load_stdin_payload()
    balloons = payload.get("balloons", [])
    cars = payload.get("cars", [])
    people = payload.get("people", [])
    history = payload.get("history", [])
    groups = payload.get("groups", [])

    # Deterministic shuffles
    random.seed(args.seed)
    random.shuffle(balloons)
    random.shuffle(cars)
    random.shuffle(people)

    try:
        balloons, cars, people, precluster, frozen, history = transform_input_payload(
            balloons=balloons,
            cars=cars,
            people=people,
            groups=groups,
            history=history,
        )

        if args.flight_leg is None or args.flight_leg is 1:
            cluster = build_clusters(
                balloons=balloons,
                cars=cars,
                people=people,
                precluster=precluster,
                time_limit_s=args.cluster_time_limit,
                num_search_workers=args.cluster_workers,
                random_seed=args.seed,
            )
        else:
            cluster = extract_fixed_cluster_from_history(
                groups=groups,
                history=history,
            )

        reserve_cluster_seats(
            balloons=balloons,
            cars=cars,
            cluster=cluster,
        )

        manifest = solve(
            balloons=balloons,
            cars=cars,
            people=people,
            cluster=cluster,
            frozen=frozen,
            past_flights=history,
            leg=args.flight_leg,
            w_pilot_fairness=args.w_pilot_fairness,
            w_passenger_fairness=args.w_passenger_fairness,
            w_no_solo_participant=args.w_no_solo_participant,
            w_cluster_passenger_balance=args.w_cluster_passenger_balance,
            w_vehicle_rotation=args.w_vehicle_rotation,
            w_divers_nationalities=args.w_nationality_diversity,
            w_low_flights_second_leg=w_low_second,
            w_overweight_second_leg=args.w_second_leg_overweight,
            counselor_flight_discount=args.counselor_flight_discount,
            default_person_weight=args.default_person_weight,
            time_limit_s=args.time_limit,
            num_search_workers=args.workers,
            random_seed=args.seed,
        )

        output = transform_output(manifest, cluster, groups)
        json.dump(output, sys.stdout)
        sys.stdout.write("\n")
        sys.exit(0)

    except Exception as exc:
        _emit_error(exc, exit_code=1)


if __name__ == "__main__":  # pragma: no cover
    main()
