import { Vehicle } from 'src/lib/entities/Vehicle';
import { Person } from "src/lib/entities/Person";

export class Car extends Vehicle {
  private _reservedCapacity = 0;
  private _trailerHitch = false;

  constructor(name: string, capacity: number, allowedOperators: Person[], trailerHitch?: boolean) {
    super(name, capacity, allowedOperators);
    this._trailerHitch = trailerHitch ?? false;
  }

  get reservedCapacity(): number {
    return this._reservedCapacity;
  }

  set reservedCapacity(value: number) {
    this._reservedCapacity = value;
  }

  get trailerHitch(): boolean {
    return this._trailerHitch;
  }

  set trailerHitch(value: boolean) {
    this,this._trailerHitch = value;
  }

  isFull(): boolean {
    return this.passengerCount() + this._reservedCapacity + 1 >= this.capacity;
  }

  usableCapacity(): number {
    return this.capacity - this._reservedCapacity - 1;
  }

  availableCapacity(): number {
    return this.usableCapacity() - this.passengers.length;
  }
}
