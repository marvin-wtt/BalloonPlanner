import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

export class ParticipantsFirstPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    // This policy states that all participants have to be flown before a supervisor can fly as a passenger
    const pendingParticipants = flight.people.filter(
      (value) => value.numberOfFlights == 0 && !value.supervisor,
    );

    const supervisors = flight.vehicleGroups
      .flatMap((value) => value.balloon.passengers)
      .filter((value) => value.supervisor);

    if (pendingParticipants.length > 0 && supervisors.length > 0) {
      return false;
    }

    // Check if a supervisor has more flights that a participant
    const participantsFlights = flight.people
      .filter((value) => !value.supervisor)
      .map((value) => value.numberOfFlights);

    const minFlights = Math.min(...participantsFlights);

    return (
      supervisors.filter((value) => value.numberOfFlights > minFlights)
        .length == 0
    );
  }

  name(): string {
    return 'participants before supervisors';
  }
}
