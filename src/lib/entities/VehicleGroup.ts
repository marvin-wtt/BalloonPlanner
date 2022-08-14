import { Balloon } from 'src/lib/entities/Balloon';
import { Car } from 'src/lib/entities/Car';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { Cloneable } from 'src/lib/utils/Cloneable';

export class VehicleGroup extends Identifyable implements Cloneable {
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

  removeCar(carId: number) {
    const c = this._cars.findIndex((value) => value.id === carId);
    this._cars.splice(c);
    const car = this.cars[c];
    car.clear();
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
    if (this._balloon === undefined) {
      return;
    }

    let remaingCapacity = this._balloon.information.capacity + 1;
    for (const car of this._cars) {
      if (car.information.capacity >= remaingCapacity) {
        car.reseavedCapacity = remaingCapacity;
        remaingCapacity = 0;
        // Do not exit here because all remaing cars remaining capacity should be set to zero
      } else {
        car.reseavedCapacity = car.information.capacity;
        remaingCapacity -= car.information.capacity;
      }
    }
  }

  clone(): VehicleGroup {
    const group = new VehicleGroup(this.balloon.clone());
    group._cars = this._cars.map((value) => value.clone());
    return group;
  }
}
