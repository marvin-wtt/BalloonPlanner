import { Flight } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

export class Project extends Identifyable {
  private _flights: Flight[] = [];
  private _flightCounter = 0;

  get flights(): Flight[] {
    return this._flights;
  }

  getFlight(flightId: string) {
    return this._flights.filter((flight) => flight.id == flightId).at(0);
  }
}
