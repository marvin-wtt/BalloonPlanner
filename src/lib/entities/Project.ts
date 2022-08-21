import { Flight, Person, Vehicle, VehicleInformation } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

export class Project extends Identifyable {
  private _people: Person[];
  private _balloons: VehicleInformation[];
  private _cars: VehicleInformation[];
  private _flights: Flight[] = [];
  private _flightCounter = 0;

  constructor(
    people?: Person[],
    balloons?: VehicleInformation[],
    cars?: VehicleInformation[]
  ) {
    super();
    this._people = people ?? [];
    this._balloons = balloons ?? [];
    this._cars = cars ?? [];
  }

  createFlight(): Flight {
    const flight = new Flight(this._balloons, this._cars, this._people.slice());
    this._flights.push(flight);
    return flight;
  }

  get flights(): Flight[] {
    return this._flights;
  }

  getFlight(flightId: number) {
    return this._flights.filter((flight) => flight.id == flightId).at(0);
  }

  get balloons(): VehicleInformation[] {
    return this._balloons;
  }

  get cars(): VehicleInformation[] {
    return this._cars;
  }

  get people(): Person[] {
    return this._people;
  }

  removePerson(person: Person) {
    let found = false;
    for (const flight of this._flights) {
      for (const group of flight.vehicleGroups) {
        found = this.removePersonFromVehicle(group.balloon, person);
        if (found) return true;
        for (const car of group.cars) {
          found = this.removePersonFromVehicle(car, person);
          if (found) return true;
        }
      }
    }

    return false;
  }

  private removePersonFromVehicle(vehicle: Vehicle, person: Person): boolean {
    if (vehicle.operator === person) {
      vehicle.operator = undefined;
      return true;
    }

    if (vehicle.passengers.includes(person)) {
      vehicle.removePassenger(person);
      return true;
    }

    return false;
  }
}
