import { GerneralSolver } from 'src/lib/solver/GerneralSolver';
import { Flight } from 'src/lib/entities/Flight';
import { Person } from 'src/lib/entities/Person';
import { VehicleInformation } from 'src/lib/entities/VehicleInformation';
import { Car } from 'src/lib/entities/Car';

export class ParticipantsFirstSolver extends GerneralSolver {
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

  solve(flight: Flight): Flight | null {
    let solutions: Flight[] = [];

    // 1
    this.createVehicleGroups(flight);

    // 2
    solutions = this.findPilotSolutions(flight);
    if (solutions.length == 0) {
      return null;
    }

    // 3
    solutions.map((value) => this.findFirstFlightSolutions(value));
    if (solutions.length == 0) {
      return null;
    }

    // 4
    for (const solution of solutions.slice()) {
      solutions.push(...this.findSupervisorSolution(solution));
    }
    if (solutions.length == 0) {
      return null;
    }

    // 5
    solutions.filter((value) => this.findCarsSolution(value));

    // 6
    const s = solutions.slice();
    solutions = [];
    for (const solution of s) {
      solutions.push(...this.findDriverSolution(solution));
    }
    if (solutions.length == 0) {
      return null;
    }

    // 7
    flight = this.findBestSolution(solutions);

    // 8
    this.fillVehicles(flight);

    return flight;
  }

  private createVehicleGroups(flight: Flight): Flight {
    for (const balloon of flight.availableBalloons()) {
      flight.addVehicleGroup(balloon);
    }

    return flight;
  }

  private findPilotSolutions(flight: Flight, start = 0): Flight[] {
    const solutions: Flight[] = [];
    for (let g = start; g < flight.vehicleGroups.length; g++) {
      const balloon = flight.vehicleGroups[g].balloon;
      if (balloon.operator !== undefined) {
        continue;
      }

      const operators = balloon.information.allowedOperators.filter((value) =>
        flight.availablePeople().includes(value)
      );
      if (operators.length == 0) {
        return [];
      }

      for (const pilot of operators) {
        balloon.operator = pilot;
        const newFlight = flight.clone();
        const childSolutions = this.findPilotSolutions(newFlight);
        solutions.push(...childSolutions);
      }
    }

    return solutions;
  }

  private findFirstFlightSolutions(flight: Flight): Flight {
    const participants = flight
      .availablePeople()
      .filter((value) => !value.supervisor && value.numberOfFlights == 0);

    shuffle<Person>(participants);

    for (const group of flight.vehicleGroups) {
      const balloon = group.balloon;
      while (balloon.availableCapacity() > 0 && participants.length > 0) {
        const person = participants.pop();
        if (person !== undefined) {
          balloon.addPassenger(person);
        }
      }
    }

    return flight;
  }

  private findCarsSolution(flight: Flight): boolean {
    for (const group of flight.vehicleGroups) {
      const balloon = group.balloon;

      const existingCapacity = group.cars.reduce(
        (prev, curr) => prev + curr.information.capacity,
        0
      );
      if (existingCapacity >= balloon.information.capacity + 1) {
        continue;
      }

      const cars = flight.availableCars();
      // There needs to be at least one car in each group
      if (cars.length == 0) {
        return false;
      }

      const c = this.findSmallestCarFit(
        cars,
        balloon.information.capacity + 1 - existingCapacity
      );
      if (c.length == 0) {
        return false;
      }

      c.forEach((value) => {
        group.addCar(new Car(value));
      });
    }

    return true;
  }

  private findSmallestCarFit(
    cars: VehicleInformation[],
    capacity: number
  ): VehicleInformation[] {
    cars.sort((a, b) => a.capacity - b.capacity);
    const car = cars.find((value) => value.capacity >= capacity);
    if (car !== undefined) {
      return [car];
    }

    // In no car fits, try to fit two cars.
    for (let i = 0; i < cars.length; i++) {
      const firstCar = cars[i];
      const secondCar = cars.find(
        (value, index) =>
          index != i && value.capacity >= capacity - firstCar.capacity
      );
      if (secondCar !== undefined) {
        return [firstCar, secondCar];
      }
    }

    // If no solution was found with two cars, the flight is invalid
    return [];
  }

  private findSupervisorSolution(flight: Flight, amount = 1): Flight[] {
    const solutions: Flight[] = [];
    const supervisors = flight
      .availablePeople()
      .filter((value) => value.supervisor && value.numberOfFlights == 0);

    for (const supervisor of supervisors) {
      for (const group of flight.vehicleGroups) {
        const balloon = group.balloon;
        if (balloon.availableCapacity() <= 0) {
          continue;
        }

        solutions.push(flight);
        // The flight must be cloned before the person is added to ensure that the new flight remains the same
        flight = flight.clone();
        // The passenger is added to the balloon which references the previously pushed flight
        balloon.addPassenger(supervisor);
      }
    }

    if (solutions.length > 0) {
      solutions.push(...this.findSupervisorSolution(flight, amount++));
    }

    return solutions;
  }

  private findDriverSolution(flight: Flight): Flight[] {
    const cars = flight.vehicleGroups.flatMap((value) => value.cars);
    return this.findDriverCarSolution(flight, cars);
  }

  private findDriverCarSolution(
    flight: Flight,
    cars: readonly Car[],
    start = 0
  ): Flight[] {
    const solutions: Flight[] = [];
    // If the end is reached the solution is accepted and can be returned
    if (start == cars.length) {
      return [flight];
    }

    for (let c = start; c < cars.length; c++) {
      const car = cars[c];
      if (car.operator !== undefined) {
        continue;
      }

      const operators = car.information.allowedOperators.filter((value) =>
        flight.availablePeople().includes(value)
      );
      // One vehicle was found without a solution. Quit here
      if (operators.length == 0) {
        return [];
      }

      for (const driver of operators) {
        car.operator = driver;
        const newFlight = flight.clone();
        const childSolutions = this.findDriverCarSolution(
          newFlight,
          cars,
          start + 1
        );
        solutions.push(...childSolutions);
      }
    }

    return solutions;
  }

  private findBestSolution(flights: Flight[]): Flight {
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

      const flightDiff = this.evaulatePilotFlightDifference(flight);

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

  private evaulatePilotFlightDifference(flight: Flight): number {
    const pilots = flight.people.filter((value) => value.pilot);
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

  private fillVehicles(flight: Flight) {
    let people = flight.availablePeople();
    shuffle(people);
    people = people.filter((value) => !value.supervisor);
    people.sort((a, b) => a.numberOfFlights - b.numberOfFlights);
    if (people.length == 0) {
      return;
    }

    this.fillBalloons(flight, people);
    if (people.length == 0) {
      return;
    }

    this.fillCars(flight, people);
  }

  private fillBalloons(flight: Flight, people: Person[]) {
    for (const group of flight.vehicleGroups) {
      const balloon = group.balloon;
      while (balloon.availableCapacity() > 0 && people.length > 0) {
        const person = people.pop();
        if (person !== undefined) {
          balloon.addPassenger(person);
        }
      }
    }
  }

  private fillCars(flight: Flight, people: Person[]) {
    for (const group of flight.vehicleGroups) {
      for (const car of group.cars) {
        while (car.availableCapacity() > 0 && people.length > 0) {
          const person = people.pop();
          if (person !== undefined) {
            car.addPassenger(person);
          }
        }
      }
    }
  }
}
