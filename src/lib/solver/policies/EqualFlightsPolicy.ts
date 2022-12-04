import { Policy } from 'src/lib/solver/policies/Policy';
import { Flight } from 'src/lib/entities';

export class EqualFlightsPolicy extends Policy {
  apply(flight: Flight): boolean | number {
    // The max diff between flights should be one
    const flights = flight.vehicleGroups
      .flatMap((value) => value.balloon.passengers)
      .filter((value) => !value.supervisor)
      .map((value) => value.numberOfFlights);

    const min = Math.min(...flights);
    const max = Math.max(...flights);

    if (max - min == 1) {
      return true;
    }

    if (this.scoreMultiplier >= 1) {
      throw 'score multiplier is exponential and should be greater than one';
    }

    return -1 * flights
      .filter((value) => value > min + 1)
      .map((value) => Math.pow(this.scoreMultiplier, value - (min + 1)))
      .reduce((totalScore, value) => totalScore + value, 0);
  }

  name(): string {
    return 'equal flights policy';
  }
}
