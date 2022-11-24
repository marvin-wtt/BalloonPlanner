import {
  Balloon,
  Car,
  Flight,
  Person,
  Project,
  VehicleGroup,
} from 'src/lib/entities';

export abstract class PersistenceService {
  private _flight?: Flight;
  private _project?: Project;

  get flight(): Flight | undefined {
    return this._flight;
  }

  set flight(value: Flight | undefined) {
    this._flight = value;
  }

  get project(): Project | undefined {
    return this._project;
  }

  set project(value: Project | undefined) {
    this._project = value;
  }

  abstract createFlight(): Promise<Flight>;

  abstract addFlight(flight: Flight): Promise<void>;

  abstract loadProject(
    projectId: string | null,
    cb: (project: Project) => void
  ): void;

  unloadProject() {
    this.project = undefined;
  }

  abstract updateProject(project: Project): Promise<void>;

  abstract loadFlight(
    flightId: string | null,
    cb: (flight: Flight | null) => void
  ): void;

  unloadFlight() {
    this.flight = undefined;
  }

  abstract updateFLight(flight: Flight): Promise<void>;

  abstract addBalloon(balloon: Balloon): Promise<void>;

  abstract addCar(car: Car): Promise<void>;

  abstract addPersom(person: Person): Promise<void>;

  abstract updateBalloon(balloon: Balloon): Promise<void>;

  abstract updateCar(car: Car): Promise<void>;

  abstract updatePersom(person: Person): Promise<void>;

  abstract deleteBalloon(balloon: Balloon): Promise<void>;

  abstract deleteCar(car: Car): Promise<void>;

  abstract deletePersom(person: Person): Promise<void>;

  abstract addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void>;

  abstract deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void>;

  abstract addCarToVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void>;

  abstract setBalloonOperator(
    person: Person | undefined,
    balloon: Balloon
  ): Promise<void>;

  abstract addBalloonPassenger(person: Person, balloon: Balloon): Promise<void>;

  abstract removeBalloonPassenger(
    person: Person,
    balloon: Balloon
  ): Promise<void>;

  abstract removeCarFromVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void>;

  abstract setCarOperator(person: Person | undefined, car: Car): Promise<void>;

  abstract addCarPassenger(person: Person, car: Car): Promise<void>;

  abstract removeCarPassenger(person: Person, car: Car): Promise<void>;
}
