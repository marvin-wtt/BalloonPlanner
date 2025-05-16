import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

export class SupervisorFlightPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    const supervisorFlights = flight.vehicleGroups
      .flatMap((value) => value.balloon.passengers)
      .filter((value) => value.supervisor && value.numberOfFlights == 0);

    return this.scoreMultiplier * supervisorFlights.length;
  }

  name(): string {
    return 'supervisor flight policy';
  }
}
