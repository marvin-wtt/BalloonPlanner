# Balloon Camp Crew Optimiser

This repository provides a solver for planning **balloon camp crew assignments**
using [OR-Tools CP-SAT](https://developers.google.com/optimization).
It contains two main solvers:

1. **Vehicle Group Solver** – assigns cars to balloon clusters.
2. **Flight Leg Solver** – assigns participants and counselors to balloons and cars for a single flight leg.

---

## ✨ Features

- **Hard constraints**
  - Exactly one qualified operator per occupied vehicle.
  - Every passenger (including operator) occupies a seat.
  - Vehicle seat capacity and optional weight limits.
  - Each person appears in ≤ 1 vehicle and operates ≤ 1 vehicle.
  - Frozen assignments can be enforced.
  - Second-leg “stay in cluster” restrictions.
  - Language compatibility checks for balloons.

- **Soft objectives (tunable weights)**
  - Pilot airtime fairness.
  - Passenger airtime fairness.
  - Mixed nationalities within vehicles.
  - Vehicle rotation (discourage repeating the same vehicle).
  - Avoid exactly one participant alone in a car.
  - Passenger balance across ground clusters.
  - Look-ahead terms for multi-leg planning (low-flight passengers, overweight avoidance).
  - Random tie-break fairness.

---

## 📦 Installation

Requires **Python 3.10+**.

```bash
git clone <repo-url>
cd solver
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Dependencies (see [`requirements.txt`](requirements.txt)):

- `ortools==9.14.6206` – CP-SAT solver
- `pytest==8.3.5` – testing framework

---

## 🚀 Usage

The entry point is [`solver_main.py`](solver_main.py).
It reads a JSON object from **stdin** and writes the result to **stdout**.

### CLI

```bash
# Solve vehicle groups
cat input.json | python solver_main.py --mode solve_groups

# Solve a flight leg
cat input.json | python solver_main.py --mode solve_leg
```

- On **success**: writes a manifest JSON and exits with code `0`.
- On **error**: writes an error JSON to stderr and exits with code `1` or `2`.

### CLI Options

| Flag           | Description                                       | Default |
|----------------|---------------------------------------------------|---------|
| `--mode`       | `solve_groups` or `solve_leg`                     | –       |
| `--seed`       | Random seed for deterministic shuffles and solver | `42`    |
| `--workers`    | Number of CP-SAT threads                          | `8`     |
| `--time-limit` | Maximum solver runtime in seconds                 | `20`    |

---

## Input & Output

### Vehicle Group Solver

**Input:**

```json
{
  "balloons": [
    {
      "id": "b1",
      "maxCapacity": 3,
      "allowedOperatorIds": [
        "p1"
      ],
      "maxWeight": 500
    }
  ],
  "cars": [
    {
      "id": "c1",
      "maxCapacity": 4,
      "allowedOperatorIds": [
        "p2"
      ],
      "hasTrailerClutch": true
    }
  ],
  "peopleCount": 12,
  "vehicleGroups": {
    "b1": [
      "c1"
    ]
  }
}
```

**Output:**

```json
{
  "vehicleGroups": {
    "b1": [
      "c1"
    ]
  }
}
```

---

### Flight Leg Solver

**Input:**

```json
{
  "balloons": [
    {
      "id": "b1",
      "maxCapacity": 3,
      "allowedOperatorIds": [
        "p1"
      ],
      "maxWeight": 500
    }
  ],
  "cars": [
    {
      "id": "c1",
      "maxCapacity": 4,
      "allowedOperatorIds": [
        "p2"
      ]
    }
  ],
  "people": [
    {
      "id": "p1",
      "role": "counselor",
      "flightsSoFar": 1,
      "languages": [
        "de"
      ],
      "nationality": "de",
      "weight": 75
    },
    {
      "id": "p2",
      "role": "participant",
      "flightsSoFar": 0,
      "languages": [
        "fr"
      ],
      "nationality": "fr",
      "weight": 65
    }
  ],
  "vehicleGroups": {
    "b1": [
      "c1"
    ]
  },
  "groupHistory": {
    "p1": [
      "b1"
    ],
    "p2": [
      "b1"
    ]
  },
  "preAssignments": {},
  "fixedGroups": {},
  "options": {
    "planningHorizonDepth": 1,
    "defaultPersonWeight": 80,
    "passengerFairness": 20,
    "pilotFairness": 5,
    "tiebreakFairness": 1,
    "groupRotation": 5,
    "groupPassengerBalance": 7,
    "noSoloParticipant": 100,
    "diverseNationalities": 3,
    "lowFlightsLookahead": 20,
    "overweightLookahead": 50,
    "counselorFlightDiscount": 1
  }
}
```

**Output:**

```json
{
  "assignments": {
    "b1": {
      "operatorId": "p1",
      "passengerIds": [
        "p2"
      ]
    },
    "c1": {
      "operatorId": null,
      "passengerIds": []
    }
  }
}
```




