import { Balloon, Car, Person, VehicleGroup, Flight } from 'src/lib/entities';

function error(): Error {
  return new Error('Flight not loaded.');
}

export class LazyFlight extends Flight {
  private _loaded = false;

  constructor(id: string) {
    super([], [], [], []);
    this.id = id;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }

  get timestamp(): number {
    if (!this._loaded) {
      throw error();
    }
    return super.timestamp;
  }

  set timestamp(value: number) {
    if (!this._loaded) {
      throw error();
    }
    super.timestamp = value;
  }

  get vehicleGroups(): VehicleGroup[] {
    if (!this._loaded) {
      throw error();
    }
    return super.vehicleGroups;
  }

  get balloons(): Balloon[] {
    if (!this._loaded) {
      throw error();
    }
    return super.balloons;
  }

  get cars(): Car[] {
    if (!this._loaded) {
      throw error();
    }
    return super.cars;
  }

  get people(): Person[] {
    if (!this._loaded) {
      throw error();
    }
    return super.people;
  }

  pilots(): Person[] {
    if (!this._loaded) {
      throw error();
    }
    return super.pilots();
  }

  addVehicleGroup(balloon: Balloon) {
    if (!this._loaded) {
      throw error();
    }
    super.addVehicleGroup(balloon);
  }

  removeVehicleGroup(group: VehicleGroup) {
    if (!this._loaded) {
      throw error();
    }
    super.removeVehicleGroup(group);
  }

  removePerson(person: Person) {
    if (!this._loaded) {
      throw error();
    }
    super.removePerson(person);
  }

  removeBalloon(balloon: Balloon) {
    if (!this._loaded) {
      throw error();
    }
    super.removeBalloon(balloon);
  }

  removeCar(car: Car) {
    if (!this._loaded) {
      throw error();
    }
    super.removeCar(car);
  }

  availablePeople(): Person[] {
    if (!this._loaded) {
      throw error();
    }
    return super.availablePeople();
  }

  availableBalloons(): Balloon[] {
    if (!this._loaded) {
      throw error();
    }
    return super.availableBalloons();
  }

  availableCars(): Car[] {
    if (!this._loaded) {
      throw error();
    }
    return super.availableCars();
  }

  clear() {
    if (!this._loaded) {
      throw new Error('Flight not loaded.');
    }
    super.clear();
  }

  clone(): Flight {
    if (!this._loaded) {
      throw new Error('Flight not loaded.');
    }
    return super.clone();
  }
}