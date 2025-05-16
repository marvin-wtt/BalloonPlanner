import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight, Vehicle } from 'src/lib/entities';
import { SolverStage } from 'src/lib/solver/SolverStage';

function checkVehicleOperator(vehicle: Vehicle): boolean {
  if (!vehicle.operator) {
    return false;
  }

  return (
    vehicle.allowedOperators.find(
      (value) => value.id === vehicle.operator?.id,
    ) !== undefined
  );
}

export class AllowedOperatorPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    for (const group of flight.vehicleGroups) {
      const pilotAllowed = checkVehicleOperator(group.balloon);
      if (!pilotAllowed) {
        return false;
      }

      for (const car of group.cars) {
        const driverAllowed = checkVehicleOperator(car);
        if (!driverAllowed) {
          return false;
        }
      }
    }

    return true;
  }

  name(): string {
    return 'allowed operator policy';
  }

  stage(): SolverStage {
    return SolverStage.OPERATORS_ASSIGNED;
  }
}
