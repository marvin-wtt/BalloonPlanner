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

  clone(): Car {
    const car = new Car(
      this.name,
      this.capacity,
      this.allowedOperators.slice()
    );
    car.id = this.id;
    car.passengers = this.passengers.slice();
    car.operator = this.operator;
    car._reservedCapacity = this._reservedCapacity;
    return car;
  }
}
