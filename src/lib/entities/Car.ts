import { Vehicle } from 'src/lib/entities/Vehicle';

export class Car extends Vehicle {
  private _reseavedCapacity = 0;

  get reseavedCapacity(): number {
    return this._reseavedCapacity;
  }

  set reseavedCapacity(value: number) {
    this._reseavedCapacity = value;
  }

  isFull(): boolean {
    return this.passengerCount() + this._reseavedCapacity >= this.capacity;
  }

  useableCapacity(): number {
    return this.capacity - this._reseavedCapacity;
  }

  availableCapacity(): number {
    return this.useableCapacity() - this.passengers.length;
  }

  clone(): Car {
    const car = new Car(
      this.name,
      this.capacity,
      this.allowedOperators.slice()
    );
    car.id = this.id;
    car.passengers = this.passengers.slice();
    car.operator = this.operator;
    car._reseavedCapacity = this._reseavedCapacity;
    return car;
  }
}
