import type { Flight } from 'src/lib/entities';

export function solveX(flight: Flight): Flight[] {
  let results: Flight[] = [];
  const groups = createVehicleGroups(flight).sort(
    (a, b) => b.vehicleGroups.length - a.vehicleGroups.length,
  );

  type Solver = (flight: Flight) => Flight[];
  const solver: Solver[] = [];
  solver.push(assignCars);
  solver.push(assignBalloonOperators);
  solver.push(assignCarOperators);
  // solver.push(assignBalloonPassengers);

  groups.some((value) => {
    results = [value];
    solver.every((s) => {
      results = results.flatMap((value) => s(value));
      return results.length > 0;
    });

    return results.length > 0;
  });

  return results;
}

function createVehicleGroups(flight: Flight): Flight[] {
  const balloons = flight.availableBalloons();

  return combinations(
    flight,
    (value, index) => {
      const balloon = value
        .availableBalloons()
        .find((value) => value.id == balloons[index].id);
      if (!balloon) return false;
      value.addVehicleGroup(balloon);
      return true;
    },
    balloons.length,
  );
}

/**
 * Adds an allowed operator to each car in each vehicle group.
 * Checks if the car has enough seats to carry the balloon pilot and passengers.
 *
 * @param flight The flight to update.
 */
function assignCars(flight: Flight): Flight[] {
  // TODO At least one car needs to have a trailer hitch
  let results: Flight[] = [flight];
  for (let g = 0; g < flight.vehicleGroups.length; g++) {
    results = results
      .flatMap((lastResult) => {
        const cars = lastResult.availableCars();
        return combinations(
          lastResult,
          (value, index) => {
            const car = value
              .availableCars()
              .find((value) => value.id == cars[index].id);
            if (!car) return false;
            value.vehicleGroups[g].addCar(car);
            return true;
          },
          cars.length,
          lastResult.cars.length - lastResult.vehicleGroups.length,
        );
      })
      .filter(
        (value) =>
          value.vehicleGroups[g].cars.reduce(
            (total, curr) => total + (curr.capacity - 1),
            0,
          ) >= value.vehicleGroups[g].balloon.capacity,
      );
  }

  return results;
}

function assignBalloonOperators(flight: Flight): Flight[] {
  let results: Flight[] = [flight];
  for (let g = 0; g < flight.vehicleGroups.length; g++) {
    results = results.flatMap((lastResult) => {
      const balloonOperators =
        lastResult.vehicleGroups[g].balloon.allowedOperators;
      return combinations(
        lastResult,
        (value, index) => {
          const operator = value
            .availablePeople()
            .find((value) => value.id === balloonOperators[index].id);
          if (!operator) return false;
          value.vehicleGroups[g].balloon.operator = operator;
          return true;
        },
        balloonOperators.length,
        0,
      );
    });
  }

  return results;
}

function assignCarOperators(flight: Flight): Flight[] {
  let results: Flight[] = [flight];
  for (let g = 0; g < flight.vehicleGroups.length; g++) {
    for (let c = 0; c < flight.vehicleGroups[g].cars.length; c++) {
      results = results.flatMap((lastResult) => {
        const carOperators =
          lastResult.vehicleGroups[g].cars[c].allowedOperators;
        return combinations(
          lastResult,
          (value, index) => {
            const operator = value
              .availablePeople()
              .find((value) => value.id === carOperators[index].id);
            if (!operator) return false;
            value.vehicleGroups[g].cars[c].operator = operator;
            return true;
          },
          carOperators.length,
          0,
        );
      });
    }
  }

  return results;
}

function assignBalloonPassengers(flight: Flight): Flight[] {
  let results: Flight[] = [flight];
  for (let g = 0; g < flight.vehicleGroups.length; g++) {
    results = results.flatMap((lastResult) => {
      const passengers = lastResult.availablePeople();
      return combinations(
        lastResult,
        (value, index) => {
          const passenger = value
            .availablePeople()
            .find((value) => value.id === passengers[index].id);
          if (!passenger) {
            return false;
          }
          value.vehicleGroups[g].balloon.addPassenger(passenger);
          return true;
        },
        passengers.length,
        lastResult.vehicleGroups[g].balloon.capacity - 1,
      );
    });
  }

  return results;
}

function combinations(
  value: Flight,
  cb: (value: Flight, index: number) => boolean,
  n: number,
  maxDepth = -1,
): Flight[] {
  const results: Flight[] = [];
  if (maxDepth < 0) {
    maxDepth = n;
  }

  function c(value: Flight, i = 0, depth = 0) {
    for (; i < n; i++) {
      value = value.clone();
      const success = cb(value, i);
      if (!success) continue;

      results.push(value);

      if (i + 1 < n && depth < maxDepth) {
        c(value, i + 1, depth + 1);
      }
    }
  }

  c(value);

  return results;
}
