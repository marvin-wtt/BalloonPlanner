"""run_balloon_solver.py
================================
CLI / stream wrapper for `balloon_camp_solver.solve`.

Usage patterns
--------------
1. **File mode** (original):
   python run_balloon_solver.py \
       --balloons balloons.json --cars cars.json --people people.json \
       --past-flights history.json --frozen locks.json \
       --w-fair 15 --time-limit 20

2. **STDIN mode** (recommended for Node/Electron):
   python run_balloon_solver.py --stdin \
       --w-fair 15 < payload.json

   where *payload.json* is a single object of the form
   {
     "balloons": [...], "cars": [...], "people": [...],
     "past_flights": [...], "frozen": [...]
   }

Output:  manifest JSON printed to **stdout**.  Errors to **stderr**.
Exit codes: 0 success · 1 infeasible/solver error · 2 input/CLI error.
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import List, Dict, Any

from vehicle_solver import solve
from transformer import transform_input_payload, transform_output
from vehicle_group_solver import build_clusters


# ---------------------------------------------------------------------------
# Helper functions ----------------------------------------------------------
# ---------------------------------------------------------------------------

def _load_json_file(path: str, *, label: str) -> List[Dict[str, Any]]:
  """Read a JSON array from *path*. Exit with code 2 on error."""
  try:
    with open(path, "r", encoding="utf-8") as fh:
      data = json.load(fh)
    if not isinstance(data, list):
      raise ValueError(f"{label} file must contain a JSON array, got {type(data)}")
    return data
  except Exception as exc:  # noqa: BLE001
    print(f"Error reading {label} file '{path}': {exc}", file=sys.stderr)
    sys.exit(2)


def _load_stdin_payload() -> dict[str, Any]:
  """Parse a single JSON object from STDIN. Exit 2 on failure."""
  try:
    payload = json.load(sys.stdin)
    if not isinstance(payload, dict):
      raise ValueError("STDIN payload must be a single JSON object")
    return payload
  except Exception as exc:  # noqa: BLE001
    print(f"Failed to parse STDIN JSON payload: {exc}", file=sys.stderr)
    sys.exit(2)


# ---------------------------------------------------------------------------
# Main entry ---------------------------------------------------------------
# ---------------------------------------------------------------------------

def main(argv: List[str] | None = None) -> None:
  parser = argparse.ArgumentParser(description="Solve balloon‑camp crew assignment")

  input_grp = parser.add_mutually_exclusive_group(required=True)
  input_grp.add_argument("--stdin", action="store_true",
                         help="Read all input data from STDIN as one JSON object")
  input_grp.add_argument("--files", action="store_true",
                         help="Read separate JSON files via --balloons/--cars/… flags")

  # file‑mode arguments --------------------------------------------------
  parser.add_argument("--balloons", help="JSON list of balloons (file mode)")
  parser.add_argument("--cars", help="JSON list of cars (file mode)")
  parser.add_argument("--people", help="JSON list of people (file mode)")
  parser.add_argument("--past-flights",
                      help="JSON list of past flights (file mode, optional)")
  parser.add_argument("--frozen", help="JSON list of frozen assignments (file mode, optional)")

  # soft‑rule weights ----------------------------------------------------
  parser.add_argument("--w-fair", type=int, default=10)
  parser.add_argument("--w-low-flights", type=int, default=1)
  parser.add_argument("--w-diversity", type=int, default=1)
  parser.add_argument("--w-new-vehicle", type=int, default=1)

  parser.add_argument("--time-limit", type=int, default=30,
                      help="Solver time limit in seconds")

  args = parser.parse_args(argv)

  # ------------------------------------------------------------------
  # Gather input -----------------------------------------------------
  # ------------------------------------------------------------------
  if args.stdin:
    payload = _load_stdin_payload()
    balloons = payload.get("balloons", [])
    cars = payload.get("cars", [])
    people = payload.get("people", [])
    history = payload.get("history", [])
    groups = payload.get("groups", [])

  else:  # --files mode
    if not (args.balloons and args.people):
      print("File mode requires --balloons and --people", file=sys.stderr)
      sys.exit(2)
    balloons = _load_json_file(args.balloons, label="balloons")
    cars = _load_json_file(args.cars, label="cars") if args.cars else []
    people = _load_json_file(args.people, label="people")
    history = _load_json_file(args.past_flights, label="history") if args.past_flights else None
    groups = _load_json_file(args.frozen, label="groups") if args.frozen else None

  # basic validation --------------------------------------------------
  if not balloons:
    print("Error: balloons list is empty", file=sys.stderr)
    sys.exit(2)
  if not people:
    print("Error: people list is empty", file=sys.stderr)
    sys.exit(2)

  balloons, cars, people, preclusers, frozen, history = transform_input_payload(
    balloons=balloons,
    cars=cars,
    people=people,
    groups=groups,
    history=history,
  )

  cluster = build_clusters(
    balloons=balloons,
    cars=cars,
    people=people,
    precluster=preclusers
  )

  # ------------------------------------------------------------------
  # Solve ------------------------------------------------------------
  # ------------------------------------------------------------------
  try:
    manifest = solve(
      balloons=balloons,
      cars=cars,
      people=people,
      frozen=frozen,
      past_flights=history,
      w_fair=args.w_fair,
      w_new_vehicle=50,
      w_low_flights=100,
    )
  except Exception as exc:  # noqa: BLE001
    print(f"Solve failed: {exc}", file=sys.stderr)
    sys.exit(1)

  output = transform_output(manifest, cluster)

  json.dump(output, sys.stdout)
  sys.stdout.write("\n")


if __name__ == "__main__":  # pragma: no cover
  main()
