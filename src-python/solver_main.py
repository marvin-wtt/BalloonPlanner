#!/usr/bin/env python3
"""
CLI / stream wrapper for the balloon camp solver.

Input  : one JSON object on stdin (see README).
Success: manifest JSON on stdout · exit-code 0
Failure: error JSON on stderr · exit-code 1 or 2
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import List, Any, Dict

from solver_flight_leg import solve_flight_leg
from solver_vehicle_group import solve_vehicle_groups


def _emit_error(msg: str, *, exit_code: int = 1) -> None:
    try:
        json.dump({"message": msg}, sys.stdout)
        sys.stdout.write("\n")
    finally:
        sys.exit(exit_code)


def _read_json_stdin() -> Dict[str, Any]:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            _emit_error("Empty stdin; expected a JSON object.", exit_code=2)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        _emit_error(f"Invalid JSON: {e}", exit_code=2)
        raise  # unreachable


def _parse_args(argv: List[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Solve balloon-camp crew assignment")

    #
    parser.add_argument(
        "--mode",
        type=str,
        choices=["build_groups", "solve_leg"],
        default=None,
        help="Operation mode for the solver",
    )

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

    return parser.parse_args(argv)


def _handle_build_groups(
    payload: Dict[str, Any], args: argparse.Namespace
) -> Dict[str, Any]:
    options = payload.get("options", {})

    # TODO Add weights

    return solve_vehicle_groups(
        balloons=payload.get("balloons", []),
        cars=payload.get("cars", []),
        people_count=payload.get("peopleCount", 0),
    )


def _handle_solve_leg(payload: Dict[str, Any], args: argparse.Namespace):
    options = payload.get("options", {})

    # TODO Add weights

    return solve_flight_leg(
        balloons=payload.get("balloons", []),
        cars=payload.get("cars", []),
        people=payload.get("people", []),
        vehicle_groups=payload.get("vehicleGroups", {}),
        group_history=payload.get("groupHistory", {}),
        frozen=payload.get("preAssignments", {}),
        fixed_groups=payload.get("fixedGroups", {}),
        planning_horizon_legs=0,
        # solver params
        time_limit_s=args["time_limit"],
        num_search_workers=args["workers"],
        random_seed=args["seed"],
    )


def main(argv: List[str] | None = None) -> None:
    args = _parse_args(argv)
    payload = _read_json_stdin()

    if args.mode == "solve_groups":
        out = _handle_build_groups(payload, args)
    elif args.mode == "solve_leg":
        out = _handle_solve_leg(payload, args)
    else:
        raise ValueError("Invalid mode", args.mode)

    json.dump(out, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(0)


if __name__ == "__main__":  # pragma: no cover
    main()
