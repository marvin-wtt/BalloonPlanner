import { Car, Flight, Person } from 'src/lib/entities';
import { shuffle } from 'src/lib/utils/ArrayUtils';

export interface SolvingOptions {
  someOption?: boolean;
}

//  1. Create vehicle groups for each balloon
//  2. Store each solution where every balloon has a valid pilot. Invalid solutions are ignored
//  3. For each solution, fill the balloon with participants who have never flown yet.
//  4. Afterwards, if there is still space left, try to fit in one teamer with zero flights.
//     If a solution with 1 teamer was found, increment the amount of teamer and repeat 5) until no solution is found for this iteration,
//  5. Fill all groups with cars so that the available spaces are best.
//  6. Than fill all cars with operators.
//     If a required car remains without a driver, the solution is invalid.
//  7. Calculate a score for each solution.
//     Punish unfair pilot flight distribution
//     Select the solution with the best score,
//  8. Fill in all balloons and cars with the remaining participants.

export async function solve(
  f: Flight,
  options?: SolvingOptions
): Promise<Flight> {
  let flight = f.clone();
  let solutions: Flight[] = [];

  // 1
  createVehicleGroups(flight);

  // 2
  solutions = findPilotSolutions(flight);
  if (solutions.length == 0) {
    throw new Error('not_enough_pilots');
  }

  // 3
  solutions.map((value) => findFirstFlightSolutions(value));

  // 4
  for (const solution of solutions.slice()) {
    solutions.push(...findSupervisorSolution(solution));
  }

  // 5
  solutions.filter((value) => findCarsSolution(value));

  // 6
  const s = solutions.slice();
  solutions = [];
  for (const solution of s) {
    solutions.push(...findDriverSolution(solution));
  }
  if (solutions.length == 0) {
    throw new Error('not_enough_driver');
  }

  // 7
  flight = findBestSolution(solutions);

  // 8
  fillVehicles(flight);

  return flight;
}

function createVehicleGroups(flight: Flight): Flight {
  for (const balloon of flight.availableBalloons()) {
    flight.addVehicleGroup(balloon);
  }

  return flight;
}

function findPilotSolutions(baseFlight: Flight, groupIndex = 0): Flight[] {
  const solutions: Flight[] = [];

  if (groupIndex === baseFlight.vehicleGroups.length) {
    return [baseFlight];
  }

  const baseBalloon = baseFlight.vehicleGroups[groupIndex].balloon;
  if (baseBalloon.operator != null) {
    return findPilotSolutions(baseFlight, groupIndex + 1);
  }

  // Check for all pilots
  // The flight reference and all its children must be updated every interation as the flight is cloned an therefore
  //  the reference changes
  for (const basePilot of baseBalloon.allowedOperators) {
    // Always use a fresh clone of the base-flight
    // All objects, which are not effectifly immuteable need to be rereferenced
    const solutionFlight = baseFlight.clone();


    const availablePeople = solutionFlight.availablePeople();
    const pilot = availablePeople.find((value) => value.id === basePilot.id);
    if (pilot == null) {
      continue;
    }

    // Set the current operator and fill the next group
    solutionFlight.vehicleGroups[groupIndex].balloon.operator = pilot;
    const childSolutions = findPilotSolutions(solutionFlight, groupIndex + 1);
    solutions.push(...childSolutions);
  }

  return solutions;
}

function findFirstFlightSolutions(flight: Flight): Flight {
  const participants = flight
    .availablePeople()
    .filter((value) => !value.supervisor && value.numberOfFlights === 0);

  shuffle<Person>(participants);

  for (const group of flight.vehicleGroups) {
    const balloon = group.balloon;
    while (balloon.availableCapacity() > 0 && participants.length > 0) {
      const person = participants.pop();
      if (person != null) {
        balloon.addPassenger(person);
      }
    }
  }

  return flight;
}

function findCarsSolution(flight: Flight): boolean {
  for (const group of flight.vehicleGroups) {
    const balloon = group.balloon;

    const existingCapacity = group.cars.reduce(
      (prev, curr) => prev + curr.capacity - 1,
      0
    );
    if (existingCapacity >= balloon.capacity) {
      continue;
    }

    const cars = flight.availableCars();
    // There needs to be at least one car in each group
    if (cars.length == 0) {
      return false;
    }

    const c = findSmallestCarFit(cars, balloon.capacity - existingCapacity);
    if (c.length == 0) {
      return false;
    }

    c.forEach((value) => {
      group.addCar(value);
    });
  }

  return true;
}

function findSmallestCarFit(cars: Car[], capacity: number): Car[] {
  cars.sort((a, b) => a.capacity - b.capacity);
  const car = cars.find((value) => value.capacity >= capacity);
  if (car != null) {
    return [car];
  }

  // In no car fits, try to fit two cars.
  for (let i = 0; i < cars.length; i++) {
    const firstCar = cars[i];
    const secondCar = cars.find(
      (value, index) =>
        index != i && value.capacity >= capacity - firstCar.capacity
    );
    if (secondCar != null) {
      return [firstCar, secondCar];
    }
  }

  // If no solution was found with two cars, the flight is invalid
  return [];
}

function findSupervisorSolution(flight: Flight, amount = 1): Flight[] {
  const solutions: Flight[] = [];
  const supervisors = flight
    .availablePeople()
    .filter((value) => value.supervisor && value.numberOfFlights == 0);

  for (const supervisor of supervisors) {
    for (let g = 0; g < flight.vehicleGroups.length; g++) {
      if (flight.vehicleGroups[g].balloon.availableCapacity() <= 0) {
        continue;
      }

      // The flight must be cloned before the person is added to ensure that the new flight remains the same
      flight = flight.clone();
      // The passenger is added to the balloon which references the previously pushed flight
      flight.vehicleGroups[g].balloon.addPassenger(supervisor);

      solutions.push(flight);
    }
  }

  if (solutions.length > 0) {
    for (const solution of solutions) {
      solutions.push(...findSupervisorSolution(solution, amount + 1));
    }
  }

  return solutions;
}

function findDriverSolution(
  baseFlight: Flight,
  groupIndex = 0,
  carIndex = 0
): Flight[] {
  const solutions: Flight[] = [];

  // If the end is reached the solution is accepted and can be returned
  if (groupIndex === baseFlight.vehicleGroups.length) {
    return [baseFlight];
  }
  // Goto next group if all cars are filled
  if (carIndex === baseFlight.vehicleGroups[groupIndex].cars.length) {
    return findDriverSolution(baseFlight, groupIndex + 1, 0);
  }

  const baseCar = baseFlight.vehicleGroups[groupIndex].cars[carIndex];
  if (baseCar.operator != null) {
    return findDriverSolution(baseFlight, groupIndex, carIndex + 1);
  }

  for (const baseDriver of baseCar.allowedOperators) {
    const solutionFlight = baseFlight.clone();

    const availablePeople = solutionFlight.availablePeople();
    const solutionDriver = availablePeople.find(value => value.id === baseDriver.id);
    if (!solutionDriver) {
      continue;
    }
    solutionFlight.vehicleGroups[groupIndex].cars[carIndex].operator = solutionDriver;

    const childSolutions = findDriverSolution(solutionFlight, groupIndex, carIndex + 1);
    solutions.push(...childSolutions);
  }

  return solutions;
}

function findBestSolution(flights: Flight[]): Flight {
  let best = flights[0];
  let supervisorFlightCount = 0;
  let averageFlightDiff = 0;

  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];
    const supervisorCount = best.vehicleGroups.reduce(
      (prevGroup, currGroup) => {
        return (
          prevGroup +
          currGroup.cars.reduce(
            (prevCar, currCar) =>
              prevCar +
              currCar.passengers.filter((value) => value.supervisor).length,
            0
          )
        );
      },
      0
    );

    const flightDiff = evaulatePilotFlightDifference(flight);

    if (
      supervisorCount > supervisorFlightCount ||
      flightDiff > averageFlightDiff
    ) {
      best = flight;
      supervisorFlightCount = supervisorCount;
      averageFlightDiff = flightDiff;
    }
  }

  return best;
}

function evaulatePilotFlightDifference(flight: Flight): number {
  const pilots = flight.pilots();
  const differences: number[] = [];
  for (let i = 0; i < pilots.length; i++) {
    for (let j = i; j < pilots.length; j++) {
      differences.push(
        Math.abs(pilots[i].numberOfFlights - pilots[j].numberOfFlights)
      );
    }
  }
  // Average difference
  return differences.reduce((p, c, i) => p + (c - p) / (i + 1), 0);
}

function fillVehicles(flight: Flight) {
  let people = flight.availablePeople();
  shuffle(people);
  people = people.filter((value) => !value.supervisor);
  people.sort((a, b) => a.numberOfFlights - b.numberOfFlights);
  if (people.length == 0) {
    return;
  }

  fillBalloons(flight, people);
  if (people.length == 0) {
    return;
  }

  fillCars(flight, people);
}

function fillBalloons(flight: Flight, people: Person[]) {
  for (const group of flight.vehicleGroups) {
    const balloon = group.balloon;
    while (balloon.availableCapacity() > 0 && people.length > 0) {
      const person = people.pop();
      if (person != null) {
        balloon.addPassenger(person);
      }
    }
  }
}

function fillCars(flight: Flight, people: Person[]) {
  // Fill cars so that each crew is the same size
  // i represents the amount of people of the crew
  for (let crewSize = 1; people.length > 0; crewSize++) {
    // Remember if the last iteration added a passenger to avoid infinity loops if the capacity of all cars are not
    //  sufficient.
    let filled = false;
    for (const group of flight.vehicleGroups) {
      const balloonPassengerCount = group.balloon.passengers.length;
      if (balloonPassengerCount >= crewSize) {
        filled = true;
        continue;
      }
      // Amount of passengers for current crew size
      const passengerCount = crewSize - balloonPassengerCount;
      for (const car of group.cars) {
        if (
          car.passengers.length >= passengerCount ||
          car.availableCapacity() === 0
        ) {
          continue;
        }
        const person = people.pop();
        if (person == null) {
          return;
        }
        car.addPassenger(person);
        filled = true;
      }
    }
    if (!filled) {
      throw new Error('not_enough_capacity');
    }
  }
}
