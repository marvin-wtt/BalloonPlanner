import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';
import { SolverStage } from 'src/lib/solver/SolverStage';

export class SufficientCarCapacity extends Policy {
  apply(flight: Flight): boolean | number {
    for (const group of flight.vehicleGroups) {
      const availableCapacity = group.cars
        .map((value) => value.capacity)
        .reduce((accumulator, value) => {
          // One seat is reserved for the driver
          return accumulator + value - 1;
        }, 0);

      if (availableCapacity < group.balloon.capacity) {
        return false;
      }
    }

    return true;
  }

  name(): string {
    return 'sufficient car capacity';
  }

  stage(): SolverStage {
    return SolverStage.CARS_ASSIGNED;
  }
}
