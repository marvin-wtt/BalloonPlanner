import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { Balloon, Car, Flight, Person, Project, User, VehicleGroup } from 'src/lib/entities';

export class LocalStorageService implements PersistenceService {
  private _flight?: Flight;
  private _project?: Project;


  addFlight(flight: Flight): Promise<void> {
    throw 'not_implemented';
  }

  createFlight(): Promise<Flight> {
    throw 'not_implemented';
  }

  loadFlight(flightId: string | null): Promise<void> {
    throw 'not_implemented';
  }

  loadProject(projectId: string | null): Promise<void> {
    throw 'not_implemented';
  }

  loadUserData(user: User): Promise<void> {
    throw 'not_implemented';
  }

  unloadFlight(): void {
    this._flight = undefined;
  }

  unloadProject(): void {
    this._project = undefined;
  }

  unloadUserData(): void {
    throw 'not_implemented';
  }

  updateProject(project: Project): Promise<void> {
    throw 'not_implemented';
  }

  private write(): Promise<void> {
    throw 'not_implemented';
  }

  addBalloon(balloon: Balloon): Promise<void> {
    this._flight?.balloons.push(balloon);
    return this.write();
  }

  addBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    balloon.addPassenger(person);
    return this.write();
  }

  addCar(car: Car): Promise<void> {
    this._flight?.cars.push(car);
    return this.write();
  }

  addCarPassenger(person: Person, car: Car): Promise<void> {
    car.addPassenger(person);
    return this.write();
  }

  addCarToVehicleGroup(car: Car, vehicleGroup: VehicleGroup): Promise<void> {
    vehicleGroup.addCar(car);
    return this.write();
  }

  addPerson(person: Person): Promise<void> {
    this._flight?.people.push(person);
    return this.write();
  }

  addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    this._flight?.vehicleGroups.push(vehicleGroup);
    return this.write();
  }

  deleteBalloon(balloon: Balloon): Promise<void> {
    this._flight?.removeBalloon(balloon);
    return this.write();
  }

  deleteCar(car: Car): Promise<void> {
    this._flight?.removeCar(car);
    return this.write();
  }

  deletePerson(person: Person): Promise<void> {
    this._flight?.removePerson(person);
    return this.write();
  }

  deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    this._flight?.removeVehicleGroup(vehicleGroup);
    return this.write();
  }

  removeBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    balloon.removePassenger(person);
    return this.write();
  }

  removeCarFromVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void> {
    vehicleGroup.removeCar(car);
    return this.write();
  }

  removeCarPassenger(person: Person, car: Car): Promise<void> {
    car.removePassenger(person);
    return this.write();
  }

  setBalloonOperator(
    person: Person | undefined,
    balloon: Balloon
  ): Promise<void> {
    balloon.operator = person;
    return this.write();
  }

  setCarOperator(person: Person | undefined, car: Car): Promise<void> {
    car.operator = person;
    return this.write();
  }

  updateBalloon(balloon: Balloon): Promise<void> {
    const oldBalloon = this._flight?.balloons.find(
      (value) => value.id === balloon.id
    );
    if (oldBalloon == null) {
      this._flight?.balloons.push(balloon);
      return this.write();
    }

    oldBalloon.name = balloon.name;
    oldBalloon.capacity = balloon.capacity;
    oldBalloon.allowedOperators = balloon.allowedOperators;
    return this.write();
  }

  updateCar(car: Car): Promise<void> {
    const oldCar = this._flight?.balloons.find((value) => value.id === car.id);
    if (oldCar == null) {
      this._flight?.cars.push(car);
      return this.write();
    }

    oldCar.name = car.name;
    oldCar.capacity = car.capacity;
    oldCar.allowedOperators = car.allowedOperators;
    return this.write();
  }

  updateFLight(flight: Flight): Promise<void> {
    this._flight = flight;
    return this.write();
    // TODO How to trigger reload?
  }

  updatePerson(person: Person): Promise<void> {
    const oldPerson = this._flight?.people.find(
      (value) => value.id === person.id
    );
    if (oldPerson == null) {
      this._flight?.people.push(person);
      return this.write();
    }

    oldPerson.name = person.name;
    oldPerson.nation = person.nation;
    oldPerson.numberOfFlights = person.numberOfFlights;
    oldPerson.supervisor = person.supervisor;
    return this.write();
  }
}
