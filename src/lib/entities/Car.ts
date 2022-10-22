import { Vehicle } from 'src/lib/entities/Vehicle';

export class Car extends Vehicle {
  private _reservedCapacity = 0;

  get reservedCapacity(): number {
    return this._reservedCapacity;
  }

  set reservedCapacity(value: number) {
    this._reservedCapacity = value;
  }

  isFull(): boolean {
    return this.passengerCount() + this._reservedCapacity >= this.capacity;
  }

  useableCapacity(): number {
    return this.capacity - this._reservedCapacity;
  }

  availableCapacity(): number {
    return this.useableCapacity() - this.passengers.length;
  }

}
