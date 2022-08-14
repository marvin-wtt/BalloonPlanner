import { Person } from 'src/lib/entities/Person';

export class VehicleInformation {
  private _name: string;
  private _capacity: number;
  private _allowedOperators: Person[];

  constructor(name: string, capacity: number, allowedOperators: Person[]) {
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

  get allowedOperators(): Array<Person> {
    return this._allowedOperators;
  }

  set allowedOperators(value: Array<Person>) {
    this._allowedOperators = value;
  }
}
