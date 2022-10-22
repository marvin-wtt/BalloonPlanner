import { Person } from 'src/lib/entities/Person';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { Cloneable } from 'src/lib/utils/Cloneable';
import { removeFromArray } from 'src/lib/utils/ArrayUtils';

export abstract class Vehicle extends Identifyable {
  private _name: string;
  private _capacity: number;
  private _allowedOperators: Person[];
  private _operator?: Person;
  private _passengers: Person[] = [];

  constructor(name: string, capacity: number, allowedOperators: Person[]) {
    super();
    this._name = name;
    this._capacity = capacity;
    this._allowedOperators = allowedOperators;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get capacity(): number {
    return this._capacity;
  }

  set capacity(value: number) {
    this._capacity = value;
  }

  get allowedOperators(): Person[] {
    return this._allowedOperators;
  }

  set allowedOperators(value: Person[]) {
    this._allowedOperators = value;
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

  set passengers(value: Person[]) {
    this._passengers = value;
  }

  passengerCount(): number {
    return this._passengers.length;
  }

  addPassenger(person: Person) {
    this._passengers.push(person);
  }

  removePassenger(person: Person) {
    removeFromArray(this._passengers, person);
  }

  availableCapacity(): number {
    return this._capacity - this.passengers.length;
  }

  isFull(): boolean {
    return this._passengers.length >= this._capacity;
  }

  clear() {
    this._operator = undefined;
    this.clearPassengers();
  }

  clearPassengers() {
    this._passengers = [];
  }
}
