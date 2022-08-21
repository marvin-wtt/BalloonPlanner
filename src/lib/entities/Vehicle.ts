import { Person } from 'src/lib/entities/Person';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { VehicleInformation } from 'src/lib/entities/VehicleInformation';
import { Cloneable } from 'src/lib/utils/Cloneable';

export abstract class Vehicle extends Identifyable implements Cloneable {
  private _information: VehicleInformation;
  private _operator?: Person;
  private _passengers: Person[] = [];

  constructor(information: VehicleInformation) {
    super();
    this._information = information;
  }

  abstract clone(): Vehicle;

  get information(): VehicleInformation {
    return this._information;
  }

  get operator(): Person | undefined {
    return this._operator;
  }

  set operator(value: Person | undefined) {
    this._operator = value;
  }

  get passengers(): Array<Person> {
    return this._passengers;
  }

  protected set passengers(value: Person[]) {
    this._passengers = value;
  }

  passengerCount(): number {
    return this._passengers.length;
  }

  addPassenger(person: Person) {
    this._passengers.push(person);
  }

  removePassenger(person: Person) {
    person.decrementFlights();
    this._passengers = this._passengers.filter(
      (passenger) => passenger === person
    );
  }

  availableCapacity(): number {
    return this._information.capacity - this.passengers.length;
  }

  isFull(): boolean {
    return this._passengers.length >= this._information.capacity;
  }

  clear() {
    this._operator = undefined;
    this.clearPassengers();
  }

  clearPassengers() {
    this._passengers = [];
  }
}
