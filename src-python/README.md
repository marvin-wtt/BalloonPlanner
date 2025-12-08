# Balloon Organizer — Python Solver

This folder implements the optimization core for Balloon Organizer using Google OR-Tools (CP-SAT). It exposes a
streaming CLI that accepts a single JSON payload on stdin and returns a JSON result on stdout.

- Entry point: `src-python/solver_main.py`
- Modes:
  - `solve_groups` — build feasible vehicle groups (balloon -> cars)
  - `solve_leg` — produce the per-vehicle manifest (operator + passengers)

## Features

- Feasible by construction: encodes critical operational rules as hard constraints.
- Two-stage workflow:
  1) Group cars with balloons.
  2) Assign operators and passengers per leg within those groups.
- Deterministic and tunable: seedable shuffles and CP-SAT parameterization (`--seed`, `--workers`, time limits).
- Language-aware: operator compatibility and passenger–operator language checks on balloons; cross-vehicle operator
  compatibility inside a cluster.
- History-aware: optional group history and meet-history inform rotation and novelty rewards.
- Pre-assignments supported: freeze operators and/or passengers per vehicle; keep previous groups when desired.
- Lightweight I/O: one JSON in, one JSON out. Extra fields in the input are ignored.

## Hard constraints (feasibility)

The solver refuses solutions that violate the following rules. Some are enforced in the group-building stage, others in
the leg solver.

### A) Vehicle group builder (`solve_groups`)

- ≥ 1 trailer-equipped car in each balloon’s group.
- Passenger seats across all cars must be sufficient for ground crew not flying in balloons.
- Passenger-seat reserve for each balloon’s group ≥ balloon capacity.
- Operator candidates must exist for every balloon and every car.
- Frozen balloon–car pairs must be language-feasible (there exists a language-compatible balloon-op and car-op).
- Objective (for groups): minimize unused passenger seats across all groups.

### B) Flight-leg manifest (`solve_leg`)

- Each person occupies exactly one seat overall; at most one operator role.
- If someone operates a vehicle, they also occupy a seat in that vehicle.
- Operator eligibility: only allowed operator IDs may operate a given vehicle.
- Capacity respected on every vehicle (balloons and cars).
- Weight limits respected where specified (e.g., balloon maxWeight).
- Exactly one operator on each occupied vehicle; empty vehicles have zero operators.
- Support frozen pre-assignments of operators and passengers.
- Optional “fixed groups” constraint: keep people within their previous balloon group.
- Balloon language constraint (passenger–operator): every balloon passenger must share a language with the balloon’s
  operator (or either speaks all).
- Cross-vehicle operator language: the balloon’s operator must be language-compatible with each car operator in the same
  cluster.

## Objectives (what the solver optimizes)

Weights are controlled via `options` in the input payload (see `solver_main.py`). Higher positive weight increases the
importance of a term; negative signs below indicate “maximize” style benefits.

- Pilot fairness (w_pilot_fairness): prioritize lower-flight-count people for operator roles.
- Passenger fairness (w_passenger_fairness): prioritize lower-flight-count participants for balloon seats; discount
  counselors.
- No solo participant in a car (w_no_solo_participant): penalize cars that would carry exactly one participant.
- Group passenger balance (w_group_passenger_balance): keep ground-crew counts per cluster close to the average.
- Diverse nationalities (w_diverse_nationalities): encourage within-vehicle diversity by rewarding minority presence.
- Meeting new people (w_meetingNewPeople): discourage repeated meetings within the same cluster when groups are not
  fixed.
- Group rotation / novelty (w_group_rotation): reward passengers being placed in vehicles they have used less often.
- Low-flights lookahead (w_low_flights_lookahead) with planning horizon: prioritize language-eligible, low-flight
  passengers in cluster cars over multiple future legs.
- Tiebreak fairness (w_tiebreak_fairness): small stabilizer to improve determinism between equivalent solutions.

## Minimal usage

- Windows (PowerShell):
  Get-Content payload.json | python src-python\solver_main.py --mode <
  solve_groups|solve_leg> [--seed 42] [--workers 8] [--time-limit 20]
- macOS/Linux:
  cat payload.json | python3 src-python/solver_main.py --mode <
  solve_groups|solve_leg> [--seed 42] [--workers 8] [--time-limit 20]

For input shapes, see `src-python/solver_types.py` and the option names wired in `src-python/solver_main.py`.

## Notes

- Determinism: use `--seed` and fixed `--workers` for repeatable runs.
- Performance: increase workers and/or time limits for tougher instances.
- Validation: the solvers raise descriptive errors for common infeasibilities.
- License: see repository root if present.
