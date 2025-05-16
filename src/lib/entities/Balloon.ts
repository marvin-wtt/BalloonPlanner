import { Vehicle } from 'src/lib/entities/Vehicle';
import type { Person } from 'src/lib/entities/Person';

export class Balloon extends Vehicle {
  private _maxWeight?: number;

  // TODO Override constuctor

  get operator(): Person | undefined {
    return super.operator;
  }

  set operator(value: Person | undefined) {
    super.operator = value;
  }

  get maxWeight(): number | undefined {
    return this._maxWeight;
  }

  set maxWeight(value: number | undefined) {
    this._maxWeight = value;
  }

  addPassenger(person: Person) {
    super.addPassenger(person);
  }

  removePassenger(person: Person) {
    super.removePassenger(person);
  }

  clearPassengers() {
    this.passengers.forEach((passenger) => passenger.decrementFlights());
    super.clearPassengers();
  }
}
