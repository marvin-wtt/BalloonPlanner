import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { Balloon, Car, Flight, Person, VehicleGroup } from 'src/lib/entities';

export class LocalStorageService extends PersistenceService {
  private write(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject();
    });
  }

  addBalloon(balloon: Balloon): Promise<void> {
    this.flight?.balloons.push(balloon);
    return this.write();
  }

  addBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    balloon.addPassenger(person);
    return this.write();
  }

  addCar(car: Car): Promise<void> {
    this.flight?.cars.push(car);
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

  addPersom(person: Person): Promise<void> {
    this.flight?.people.push(person);
    return this.write();
  }

  addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    this.flight?.vehicleGroups.push(vehicleGroup);
    return this.write();
  }

  deleteBalloon(balloon: Balloon): Promise<void> {
    this.flight?.removeBalloon(balloon);
    return this.write();
  }

  deleteCar(car: Car): Promise<void> {
    this.flight?.removeCar(car);
    return this.write();
  }

  deletePersom(person: Person): Promise<void> {
    this.flight?.removePerson(person);
    return this.write();
  }

  deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    this.flight?.removeVehicleGroup(vehicleGroup);
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
    const oldBalloon = this.flight?.balloons.find(
      (value) => value.id === balloon.id
    );
    if (oldBalloon == null) {
      this.flight?.balloons.push(balloon);
      return this.write();
    }

    oldBalloon.name = balloon.name;
    oldBalloon.capacity = balloon.capacity;
    oldBalloon.allowedOperators = balloon.allowedOperators;
    return this.write();
  }

  updateCar(car: Car): Promise<void> {
    const oldCar = this.flight?.balloons.find((value) => value.id === car.id);
    if (oldCar == null) {
      this.flight?.cars.push(car);
      return this.write();
    }

    oldCar.name = car.name;
    oldCar.capacity = car.capacity;
    oldCar.allowedOperators = car.allowedOperators;
    return this.write();
  }

  updateFLight(flight: Flight): Promise<void> {
    this.flight = flight;
    return this.write();
    // TODO How to trigger reload?
  }

  updatePersom(person: Person): Promise<void> {
    const oldPerson = this.flight?.people.find(
      (value) => value.id === person.id
    );
    if (oldPerson == null) {
      this.flight?.people.push(person);
      return this.write();
    }

    oldPerson.name = person.name;
    oldPerson.nation = person.nation;
    oldPerson.numberOfFlights = person.numberOfFlights;
    oldPerson.supervisor = person.supervisor;
    return this.write();
  }
}
