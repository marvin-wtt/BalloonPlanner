import { Policy } from 'src/lib/solver/policies/Policy';
import type { Flight } from 'src/lib/entities';

function containsDuplicates(arr: string[]): boolean {
  return arr.filter((item, index) => arr.indexOf(item) !== index).length > 0;
}

export class NoDuplicatesPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    // Balloons
    const balloonIds = flight.vehicleGroups
      .map((value) => value.balloon)
      .map((value) => value.id);

    if (containsDuplicates(balloonIds)) {
      return false;
    }

    const carIds = flight.vehicleGroups
      .flatMap((value) => value.cars)
      .map((value) => value.id);

    if (containsDuplicates(carIds)) {
      return false;
    }

    const balloonOperatorIds = flight.vehicleGroups
      .map((value) => value.balloon.operator?.id)
      .filter((value) => value !== undefined);
    const balloonPassengerIds = flight.vehicleGroups
      .flatMap((value) => value.balloon.passengers)
      .map((value) => value.id);
    const carOperatorIds = flight.vehicleGroups
      .flatMap((value) => value.cars)
      .map((value) => value.operator?.id)
      .filter((value) => value !== undefined);
    const carPassengerIds = flight.vehicleGroups
      .flatMap((value) => value.cars)
      .flatMap((value) => value.passengers)
      .map((value) => value.id);
    const peopleIds = [
      ...balloonOperatorIds,
      ...balloonPassengerIds,
      ...carOperatorIds,
      ...carPassengerIds,
    ];

    return !containsDuplicates(peopleIds);
  }

  name(): string {
    return 'no duplicates policy';
  }
}
