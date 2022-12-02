import {
  Balloon,
  Car,
  Flight,
  Person,
  Project,
  VehicleGroup,
} from 'src/lib/entities';

export interface PersistenceService {
  loadUser(userId: string | null): Promise<void>;

  unloadUser(): void;

  loadProject(projectId: string | null): Promise<void>;

  updateProject(project: Project): Promise<void>;

  unloadProject(): void;

  createFlight(): Promise<Flight>;

  addFlight(flight: Flight): Promise<void>;

  loadFlight(flightId: string | null): Promise<void>;

  unloadFlight(): void;

  updateFLight(flight: Flight): Promise<void>;

  addBalloon(balloon: Balloon): Promise<void>;

  addCar(car: Car): Promise<void>;

  addPersom(person: Person): Promise<void>;

  updateBalloon(balloon: Balloon): Promise<void>;

  updateCar(car: Car): Promise<void>;

  updatePersom(person: Person): Promise<void>;

  deleteBalloon(balloon: Balloon): Promise<void>;

  deleteCar(car: Car): Promise<void>;

  deletePersom(person: Person): Promise<void>;

  addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void>;

  deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void>;

  addCarToVehicleGroup(car: Car, vehicleGroup: VehicleGroup): Promise<void>;

  setBalloonOperator(
    person: Person | undefined,
    balloon: Balloon
  ): Promise<void>;

  addBalloonPassenger(person: Person, balloon: Balloon): Promise<void>;

  removeBalloonPassenger(person: Person, balloon: Balloon): Promise<void>;

  removeCarFromVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void>;

  setCarOperator(person: Person | undefined, car: Car): Promise<void>;

  addCarPassenger(person: Person, car: Car): Promise<void>;

  removeCarPassenger(person: Person, car: Car): Promise<void>;
}
