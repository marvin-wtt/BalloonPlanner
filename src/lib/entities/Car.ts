import { Vehicle } from 'src/lib/entities/Vehicle';
import { VehicleInformation } from 'src/lib/entities/VehicleInformation';

export class Car extends Vehicle {
  private _reseavedCapacity = 0;

  constructor(information: VehicleInformation) {
    super(information);
  }

  set reseavedCapacity(value: number) {
    this._reseavedCapacity = value;
  }

  isFull(): boolean {
    return (
      this.passengerCount() + this._reseavedCapacity >=
      this.information.capacity
    );
  }

  useableCapacity(): number {
    return this.information.capacity - this._reseavedCapacity;
  }

  clone(): Car {
    const car = new Car(this.information);
    car.passengers = this.passengers.slice();
    car.operator = this.operator;
    car._reseavedCapacity = this._reseavedCapacity;
    return car;
  }
}
