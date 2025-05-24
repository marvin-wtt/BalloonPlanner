#!/usr/bin/env python3
"""
run_balloon_solver.py
=====================
CLI / stream wrapper for `balloon_camp_solver.solve`.

Input  : one JSON object on **stdin** (see README).
Success: manifest JSON on **stdout** · exit-code 0
Failure: error JSON on **stderr** · exit-code 1 or 2
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
from vehicle_group_solver import build_clusters


def _emit_error(exc: Exception, exit_code: int) -> NoReturn:
    """Serialize *exc* as one-line JSON to **stderr** and quit."""
    err_payload = {
        "type": type(exc).__name__,
        "message": str(exc),
        "trace": traceback.format_exc(),
    }

    json.dump(err_payload, sys.stderr)
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

    # soft-rule weights -------------------------------------------------------
    parser.add_argument(
        "--flight-leg",
        type=int,
        default=None,
        help="Which flight leg to solve for. Accepted values are: [1, 2] ",
    )
    parser.add_argument(
        "--w-second-leg",
        type=int,
        default=10,
        help="Weight for balancing car passengers for the second leg",
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
        default=1,
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
        "--time-limit",
        type=int,
        default=20,
        help="Maximum solver runtime in seconds before timing out.",
    )

    args = parser.parse_args(argv)

    # ---------------------------------------------------------------------#
    # Gather input                                                          #
    # ---------------------------------------------------------------------#
    payload = _load_stdin_payload()
    balloons = payload.get("balloons", [])
    cars = payload.get("cars", [])
    people = payload.get("people", [])
    history = payload.get("history", [])
    groups = payload.get("groups", [])

    # Randomize input order
    random.shuffle(balloons)
    random.shuffle(cars)
    random.shuffle(people)

    try:
        balloons, cars, people, preclusers, frozen, history = transform_input_payload(
            balloons=balloons,
            cars=cars,
            people=people,
            groups=groups,
            history=history,
        )

        cluster = build_clusters(
            balloons=balloons, cars=cars, people=people, precluster=preclusers
        )

        manifest = solve(
            balloons=balloons,
            cars=cars,
            people=people,
            cluster=cluster,
            frozen=frozen,
            past_flights=history,
            leg=args.flight_leg,
            w_fair=args.w_pilot_fairness,
            w_low_flights=args.w_passenger_fairness,
            w_new_vehicle=args.w_vehicle_rotation,
            w_diversity=args.w_nationality_diversity,
            w_second_leg=args.w_second_leg,
            time_limit_s=args.time_limit,
        )

        output = transform_output(manifest, cluster)
        json.dump(output, sys.stdout)
        sys.stdout.write("\n")
        sys.exit(0)

    except Exception as exc:
        _emit_error(exc, exit_code=1)


if __name__ == "__main__":  # pragma: no cover
    main()
