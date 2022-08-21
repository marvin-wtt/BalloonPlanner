import { Balloon } from 'src/lib/entities/Balloon';
import { VehicleGroup } from 'src/lib/entities/VehicleGroup';
import { Person } from 'src/lib/entities/Person';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { Cloneable } from 'src/lib/utils/Cloneable';
import { VehicleInformation } from 'src/lib/entities/VehicleInformation';
import { GerneralSolver } from 'src/lib/solver/GerneralSolver';
import { ParticipantsFirstSolver } from 'src/lib/solver/ParticipantsFirstSolver';

export class Flight extends Identifyable implements Cloneable {
  private _balloons: VehicleInformation[];
  private _cars: VehicleInformation[];
  private _people: Person[];
  private _vehicleGroups: VehicleGroup[];
  private _solver: GerneralSolver;

  constructor(
    balloons: VehicleInformation[],
    cars: VehicleInformation[],
    people: Person[],
    groups?: VehicleGroup[]
  ) {
    super();
    this._balloons = balloons;
    this._cars = cars;
    this._people = people;
    this._vehicleGroups = groups ?? [];
    this._solver = new ParticipantsFirstSolver();
  }

  get vehicleGroups(): VehicleGroup[] {
    return this._vehicleGroups;
  }

  private set vehicleGroups(value: VehicleGroup[]) {
    this._vehicleGroups = value;
  }

  get balloons(): VehicleInformation[] {
    return this._balloons;
  }

  get cars(): VehicleInformation[] {
    return this._cars;
  }

  get people(): Person[] {
    return this._people;
  }

  pilots(): Person[] {
    const pilots: Person[] = [];

    for (const group of this._vehicleGroups) {
      pilots.push(...group.balloon.information.allowedOperators);
    }

    return Array.from(new Set(pilots));
  }

  addVehicleGroup(balloon: VehicleInformation) {
    this._vehicleGroups.push(new VehicleGroup(new Balloon(balloon)));
  }

  removeVehicleGroup(id: number) {
    const g = this._vehicleGroups.findIndex((value) => value.id == id);
    const group = this._vehicleGroups[g];
    group.clear();
    this._vehicleGroups.splice(g);
  }

  availablePeople(): Person[] {
    let people: Person[] = this._people;
    for (const group of this._vehicleGroups) {
      people = people.filter(
        (value) =>
          value !== group.balloon.operator &&
          !group.balloon.passengers.includes(value)
      );
      for (const car of group.cars) {
        people = people.filter(
          (value) => value !== car.operator && !car.passengers.includes(value)
        );
      }
    }
    return people;
  }

  availableBalloons(): VehicleInformation[] {
    let balloons: VehicleInformation[] = this._balloons;
    for (const group of this._vehicleGroups) {
      balloons = balloons.filter(
        (value) => value !== group.balloon.information
      );
    }
    return balloons;
  }

  availableCars(): VehicleInformation[] {
    let cars: VehicleInformation[] = this._cars;
    for (const group of this._vehicleGroups) {
      for (const car of group.cars) {
        cars = cars.filter((value) => value !== car.information);
      }
    }
    return cars;
  }

  clear() {
    for (const group of this._vehicleGroups) {
      group.balloon.clear();
      for (const car of group.cars) {
        car.clear();
      }
    }
  }

  clone(): Flight {
    const flight = new Flight(this._balloons, this._cars, this._people);
    flight._vehicleGroups = this._vehicleGroups.map((value) => value.clone());
    return flight;
  }

  findSolution() {
    Identifyable.stopIdGeneration();
    const f: Flight | null = this._solver.solve(this);

    if (f !== null) {
      this._vehicleGroups = f.vehicleGroups;
    }

    Identifyable.startIdGeneration();
  }
}
