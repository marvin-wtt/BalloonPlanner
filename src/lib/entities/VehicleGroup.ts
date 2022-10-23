import { Balloon } from 'src/lib/entities/Balloon';
import { Car } from 'src/lib/entities/Car';
import { Identifyable } from 'src/lib/utils/Identifyable';

export class VehicleGroup extends Identifyable {
  private _balloon: Balloon;
  private _cars: Car[] = [];

  constructor(balloon: Balloon) {
    super();
    this._balloon = balloon;
  }

  get balloon(): Balloon {
    return this._balloon;
  }

  set balloon(value: Balloon) {
    this._balloon?.clear();
    this._balloon = value;
    this.reserveCapacity();
  }

  get cars(): Car[] {
    return this._cars;
  }

  set cars(value: Car[]) {
    this._cars = value;
  }

  removeCar(car: Car) {
    car.clear();
    const i = this._cars.findIndex((value) => value.id === car.id);
    if (i === -1) {
      console.error(
        'Failed to remove person from vehicle. Cannot find group with id ' +
          car.id
      );
    }
    this._cars.splice(i, 1);
    this.reserveCapacity();
  }

  addCar(car: Car) {
    this._cars.push(car);
    this.reserveCapacity();
  }

  clear() {
    this._balloon.clear();
    this._cars.forEach((car) => car.clear());
  }

  private reserveCapacity() {
    let remaingCapacity = this._balloon.capacity + 1;
    for (const car of this._cars) {
      const reserved = car.capacity >= remaingCapacity ? remaingCapacity : car.capacity;
      remaingCapacity -= reserved;
      car.reservedCapacity = reserved;
    }
  }
}
