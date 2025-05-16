import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

export class MaximumPassengerPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    const passengerCount = flight.vehicleGroups
      .map((value) => value.balloon.passengers.length)
      .reduce((totalCount, value) => totalCount + value, 0);

    return this.scoreMultiplier * passengerCount;
  }

  name(): string {
    return 'maximum flight policy';
  }
}
