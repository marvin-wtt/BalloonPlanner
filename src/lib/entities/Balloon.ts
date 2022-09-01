import { Vehicle } from 'src/lib/entities/Vehicle';
import { Person } from 'src/lib/entities/Person';

export class Balloon extends Vehicle {
  get operator(): Person | undefined {
    return super.operator;
  }

  set operator(value: Person | undefined) {
    super.operator?.decrementFlights();
    value?.incrementFlights();
    super.operator = value;
  }

  addPassenger(person: Person) {
    person.incrementFlights();
    super.addPassenger(person);
  }

  clearPassengers() {
    this.passengers.forEach((passenger) => passenger.decrementFlights());
    super.clearPassengers();
  }

  clone(): Balloon {
    const balloon = new Balloon(this.information);
    balloon.passengers = this.passengers.slice();
    balloon.operator = this.operator;
    return balloon;
  }
}
