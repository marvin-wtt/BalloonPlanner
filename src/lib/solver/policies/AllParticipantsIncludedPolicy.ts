import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

export class AllParticipantsIncludedPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    const balloonPassengers = flight.vehicleGroups
      .flatMap((value) => value.balloon.passengers)
      .filter((value) => !value.supervisor);

    const carPassengers = flight.vehicleGroups
      .flatMap((value) => value.cars)
      .flatMap((value) => value.passengers)
      .filter((value) => !value.supervisor);

    const participants = flight.people.filter((value) => !value.supervisor);

    return (
      balloonPassengers.length + carPassengers.length == participants.length
    );
  }

  name(): string {
    return 'all participants included policy';
  }
}
