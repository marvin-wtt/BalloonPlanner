import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

export class NewParticipantsFirstPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    // It is mandatory that all new participant, who never flew before, are preferred over other participants.
    const passengers = flight.vehicleGroups.flatMap(
      (value) => value.balloon.passengers,
    );
    const firstTImerPassengers = passengers.filter((value) => value.firstTime);
    const firstTImer = flight.people.filter((value) => value.firstTime);

    if (
      passengers.length == firstTImerPassengers.length ||
      firstTImerPassengers.length == firstTImer.length
    ) {
      return true;
    }

    const remaining = firstTImer.length - firstTImerPassengers.length;
    const otherPassengers = passengers.length - firstTImerPassengers.length;

    return -1 * this.scoreMultiplier * Math.min(otherPassengers, remaining);
  }

  name(): string {
    return 'prefer first time participants';
  }
}
