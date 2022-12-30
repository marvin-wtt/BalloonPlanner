import { Vehicle } from 'src/lib/entities/Vehicle';
import { Person } from 'src/lib/entities/Person';

export class Balloon extends Vehicle {
  private _maxWeight?: number;

  // TODO Override constuctor

  get operator(): Person | undefined {
    return super.operator;
  }

  set operator(value: Person | undefined) {
    super.operator?.decrementFlights();
    value?.incrementFlights();
    super.operator = value;
  }

  get maxWeight(): number | undefined {
    return this._maxWeight;
  }

  set maxWeight(value: number | undefined) {
    this._maxWeight = value;
  }

  addPassenger(person: Person) {
    person.incrementFlights();
    super.addPassenger(person);
  }

  removePassenger(person: Person) {
    person.decrementFlights();
    super.removePassenger(person);
  }

  clearPassengers() {
    this.passengers.forEach((passenger) => passenger.decrementFlights());
    super.clearPassengers();
  }
}
