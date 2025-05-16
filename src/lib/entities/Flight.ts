import type { Balloon } from 'src/lib/entities/Balloon';
import { VehicleGroup } from 'src/lib/entities/VehicleGroup';
import type { Person } from 'src/lib/entities/Person';
import { Identifiable } from 'src/lib/utils/Identifiable';
import type { Car } from 'src/lib/entities/Car';
import { removeFromArray } from 'src/lib/utils/ArrayUtils';
import { flightFromObject, flightToObject } from 'src/lib/utils/converter';

export class Flight extends Identifiable {
  private _timestamp: number;
  private _balloons: Balloon[];
  private _cars: Car[];
  private _people: Person[];
  public vehicleGroups: VehicleGroup[];

  constructor(
    balloons: Balloon[],
    cars: Car[],
    people: Person[],
    groups?: VehicleGroup[],
  ) {
    super();
    this._balloons = balloons;
    this._cars = cars;
    this._people = people;
    this.vehicleGroups = groups ?? [];
    this._timestamp = Date.now();
  }

  get timestamp(): number {
    return this._timestamp;
  }

  set timestamp(value: number) {
    this._timestamp = value;
  }

  get balloons(): Balloon[] {
    return this._balloons;
  }

  get cars(): Car[] {
    return this._cars;
  }

  get people(): Person[] {
    return this._people;
  }

  pilots(): Person[] {
    const pilots: Person[] = [];

    for (const group of this.vehicleGroups) {
      pilots.push(...group.balloon.allowedOperators);
    }

    return Array.from(new Set(pilots));
  }

  addVehicleGroup(balloon: Balloon) {
    this.vehicleGroups.push(new VehicleGroup(balloon));
  }

  removeVehicleGroup(group: VehicleGroup) {
    group.clear();
    removeFromArray(this.vehicleGroups, group);
  }

  removePerson(person: Person) {
    // TODO remove person from vehicle

    removeFromArray(this._people, person);
  }

  removeBalloon(balloon: Balloon) {
    // TODO Remove vehicle group

    removeFromArray(this._balloons, balloon);
  }

  removeCar(car: Car) {
    // TODO Remove car from group

    removeFromArray(this._cars, car);
  }

  availablePeople(): Person[] {
    let people: Person[] = this._people;
    for (const group of this.vehicleGroups) {
      people = people.filter(
        (value) =>
          value !== group.balloon.operator &&
          !group.balloon.passengers.includes(value),
      );
      for (const car of group.cars) {
        people = people.filter(
          (value) => value !== car.operator && !car.passengers.includes(value),
        );
      }
    }
    return people;
  }

  availableBalloons(): Balloon[] {
    let balloons: Balloon[] = this._balloons;
    for (const group of this.vehicleGroups) {
      balloons = balloons.filter((value) => value.id !== group.balloon.id);
    }
    return balloons;
  }

  availableCars(): Car[] {
    let cars: Car[] = this._cars;
    for (const group of this.vehicleGroups) {
      for (const car of group.cars) {
        cars = cars.filter((value) => value.id !== car.id);
      }
    }
    return cars;
  }

  clear() {
    for (const group of this.vehicleGroups) {
      group.balloon.clear();
      for (const car of group.cars) {
        car.clear();
      }
    }
  }

  clone(): Flight {
    const obj = flightToObject(this);
    const flight = flightFromObject(obj);
    flight.id = this.id;
    return flight;
  }
}
