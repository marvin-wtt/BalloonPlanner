import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  deleteField,
  arrayUnion,
  arrayRemove,
  increment,
  updateDoc,
  FieldValue,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useAuthStore } from 'stores/auth';
import {
  Balloon,
  Car,
  Flight,
  Person,
  Project,
  User,
  Vehicle,
  VehicleGroup,
} from 'src/lib/entities';
import {
  balloonToObject,
  carToObject,
  flightFromObject,
  flightToObject,
  personToObject,
  vehcileGroupToObject,
  FlightObject,
  projectToObject,
  projectFromObject,
  ProjectObject,
  userToObject,
  userFromObject,
  UserObject,
} from 'src/lib/utils/converter';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { useProjectStore } from 'stores/project';

type UpdateObject = {
  [key: string]: null | boolean | number | string | string[] | FieldValue;
};

export class FirestoreDataService implements PersistenceService {
  private _unsubscribeFlight?: () => void;
  private _unsubscribeProject?: () => void;
  private _unsubscribeUser?: () => void;

  private _flight?: Flight;
  private _project?: Project;
  private _user?: User;

  loadUser(userId: string | null, cb: (user: User) => void) {
    if (this._unsubscribeUser != null) {
      this._unsubscribeUser();
    }

    if (userId == null) {
      return;
    }

    const ref = this.getUserConverterReference(userId);

    this._unsubscribeProject = onSnapshot(ref, (doc) => {
      if (doc.exists()) {
        this._user = doc.data();
        cb(this._user);
      }
    });
  }

  unloadUser() {
    this._user = undefined;

    if (this._unsubscribeUser != null) {
      this._unsubscribeUser();
      this._unsubscribeUser = undefined;
    }
  }

  unloadProject() {
    this._project = undefined;

    if (this._unsubscribeProject != null) {
      this._unsubscribeProject();
      this._unsubscribeProject = undefined;
    }
  }

  unloadFlight() {
    this._flight = undefined;

    if (this._unsubscribeFlight != null) {
      this._unsubscribeFlight();
      this._unsubscribeFlight = undefined;
    }
  }

  loadProject(projectId: string | null): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._unsubscribeProject != null) {
        this._unsubscribeProject();
      }

      if (projectId == null) {
        reject('invalid_project_id');
        return;
      }

      let callPromise = true;
      const ref = this.getProjectConverterReference(projectId);
      this._unsubscribeProject = onSnapshot(ref, (doc) => {
        const project = doc.data();
        const projectStore = useProjectStore();
        projectStore.project = project;

        if (callPromise) {
          callPromise = false;
          resolve();
        }
      });
    });
  }

  async createProject(project: Project): Promise<void> {
    this._project = project;

    if (project.local) {
      throw new Error('Cannot write local project to database');
    }

    const authStore = useAuthStore();

    if (!authStore.authenticated() || authStore.user == null) {
      throw new Error('not_authenticated');
      return;
    }

    if (
      project.collaborators.find((value) => value.id === authStore.user?.id) ==
      null
    ) {
      project.collaborators.push(authStore.user as User);
    }

    return this.updateProject(project);
  }

  async createFlight(): Promise<Flight> {
    if (!this._project) {
      throw new Error('No project loaded.');
    }

    const lastIndex = this._project.flights.length - 1;
    // TODO Write as transaction
    // Create a new, clean flight if the project holds no flights or if the flight id is invalid for some reason.
    let flight = new Flight([], [], []);
    if (lastIndex >= 0) {
      // Flight needs to be loaded first as all flights only hold the id of the flight
      const lastFlight = this._project.flights[lastIndex];

      const flightRef = this.getFlightConverterReference(lastFlight?.id);
      const flightSnap = await getDoc(flightRef);
      if (flightSnap.exists()) {
        const baseFlight = flightSnap.data();
        flight = new Flight(
          baseFlight.balloons.map(
            (value) =>
              new Balloon(value.name, value.capacity, value.allowedOperators)
          ),
          baseFlight.cars.map(
            (value) =>
              new Car(value.name, value.capacity, value.allowedOperators)
          ),
          baseFlight.people
        );
      }
    }

    this.addFlight(flight);

    return flight;
  }

  async addFlight(flight: Flight): Promise<void> {
    if (this._project == null) {
      throw new Error('no_project');
    }

    await this.updateFLight(flight);
    // FIXME This should be done by firebase cloud functions - SECURITY RISK
    return this.updateProjectDocument({
      ['flights']: arrayUnion(flight.id),
    });
  }

  async updateProject(project: Project): Promise<void> {
    // TODO
    return Promise.resolve(undefined);
  }

  loadFlight(flightId: string | null): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._unsubscribeFlight != null) {
        this._unsubscribeFlight();
      }

      if (flightId == null) {
        reject('invalid_flight');
        return;
      }

      let callPromise = true;
      const ref = this.getFlightConverterReference(flightId);
      this._unsubscribeFlight = onSnapshot(ref, (doc) => {
        this._flight = doc.data();
        const projectStore = useProjectStore();
        projectStore.flight = this._flight;

        if (callPromise) {
          resolve();
          callPromise = false;
        }
      });
    });
  }

  async updateProjectDocument(obj: object): Promise<void> {
    if (this._project == null) {
      throw new Error('Cannot update project. No project set.');
    }

    return updateDoc(doc(db, 'projects', this._project.id), obj);
  }

  async updateFlightDocument(obj: object): Promise<void> {
    const store = useAuthStore();

    if (store.user == null) {
      throw 'Cannot update flight. Not authenticated.';
    }

    if (this._flight == null) {
      throw 'Cannot update flight. No flight is set.';
    }

    return updateDoc(doc(db, 'flights', this._flight.id), obj);
  }

  async addBalloon(balloon: Balloon): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}`]: balloonToObject(balloon),
    });
  }

  async addBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}.passengers`]: arrayUnion(person.id),
      [`people.${person.id}.flights`]: increment(1),
    });
  }

  async addCar(car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}`]: carToObject(car),
    });
  }

  async addCarPassenger(person: Person, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.passengers`]: arrayUnion(person.id),
    });
  }

  private updateReservedCapacities(
    vehicleGroup: VehicleGroup,
    mode?: 'excöude' | 'include' | 'with',
    extra?: Car | Balloon
  ): object {
    const obj: UpdateObject = {};
    const withBalloon =
      mode === 'with' && extra != null && extra instanceof Balloon;
    let remaingCapacity = withBalloon
      ? extra?.capacity + 1
      : vehicleGroup.balloon.capacity + 1;
    for (let car of vehicleGroup.cars) {
      if (mode === 'excöude' && car.id === extra?.id) {
        // obj[`cars.${car.id}.reservedCapacity`] = 0;
        continue;
      }
      if (mode === 'with' && extra instanceof Car && extra?.id === car.id) {
        car = extra;
      }

      const reserved =
        car.capacity >= remaingCapacity ? remaingCapacity : car.capacity;
      remaingCapacity -= reserved;
      obj[`cars.${car.id}.reservedCapacity`] = reserved;
    }

    if (mode === 'include' && extra != null) {
      const reserved =
        extra.capacity >= remaingCapacity ? remaingCapacity : extra.capacity;
      obj[`cars.${extra.id}.reservedCapacity`] = reserved;
    }

    return obj;
  }

  async addCarToVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayUnion(car.id),
      ...this.updateReservedCapacities(vehicleGroup, 'include', car),
    });
  }

  async addPersom(person: Person): Promise<void> {
    return this.updateFlightDocument({
      [`people.${person.id}`]: personToObject(person),
    });
  }

  async addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}`]: vehcileGroupToObject(vehicleGroup),
    });
  }

  async deleteBalloon(balloon: Balloon): Promise<void> {
    if (this._flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    const obj = {
      [`balloons.${balloon.id}`]: deleteField(),
    };

    const group = this._flight.vehicleGroups.find(
      (value) => value.balloon.id === balloon.id
    );
    if (group != null) {
      obj[`vehicleGroups.${group.id}`] = deleteField();
      const people = group.balloon.passengers;
      if (group.balloon.operator != null) {
        people.push(group.balloon.operator);
      }
      for (const person of people) {
        obj[`people.${person.id}.flights`] = increment(-1);
      }
    }

    return this.updateFlightDocument(obj);
  }

  async deleteCar(car: Car): Promise<void> {
    if (this._flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj: UpdateObject = {};
    for (const vehicleGroup of this._flight.vehicleGroups) {
      const c = vehicleGroup.cars.find((value) => value.id === car.id);
      if (c == null) {
        continue;
      }
      obj = {
        [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayRemove(car.id),
        ...this.updateReservedCapacities(vehicleGroup, 'excöude', car),
      };
      break;
    }

    return this.updateFlightDocument({
      [`cars.${car.id}`]: deleteField(),
      ...obj,
    });
  }

  async deletePersom(person: Person): Promise<void> {
    if (this._flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {
      [`people.${person.id}`]: deleteField(),
    };

    for (const group of this._flight.vehicleGroups) {
      const result = this.removePersonFromVehicle(
        person,
        group.balloon,
        'balloons'
      );
      if (result !== null) {
        obj = { ...obj, ...result };
        break;
      }

      let found = false;
      for (const car of group.cars) {
        const result = this.removePersonFromVehicle(person, car, 'cars');
        if (result !== null) {
          obj = { ...obj, ...result };
          found = true;
          break;
        }
      }
      if (found) {
        break;
      }
    }

    return this.updateFlightDocument(obj);
  }

  private removePersonFromVehicle(
    person: Person,
    vehicle: Vehicle,
    list: 'balloons' | 'cars'
  ): object | null {
    if (vehicle.operator?.id === person.id) {
      return {
        [`${list}.${vehicle.id}.operator`]: null,
      };
    }

    for (const passenger of vehicle.passengers) {
      if (passenger.id !== person.id) {
        continue;
      }

      return {
        [`${list}.${vehicle.id}.passengers`]: arrayRemove(passenger.id),
      };
    }

    return null;
  }

  async deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    const obj: UpdateObject = {
      [`vehicleGroups.${vehicleGroup.id}`]: deleteField(),
    };

    // Decrement flights for person
    const people = vehicleGroup.balloon.passengers;
    if (vehicleGroup.balloon.operator != null) {
      people.push(vehicleGroup.balloon.operator);
    }
    for (const person of people) {
      obj[`people.${person.id}.flights`] = increment(-1);
    }

    // Clear all passengers and operators
    obj[`balloons.${vehicleGroup.balloon.id}.passengers`] = [];
    obj[`balloons.${vehicleGroup.balloon.id}.operator`] = null;
    for (const car of vehicleGroup.cars) {
      obj[`cars.${car.id}.passengers`] = [];
      obj[`cars.${car.id}.operator`] = null;
      obj[`cars.${car.id}.reservedCapacity`] = 0;
    }

    return this.updateFlightDocument(obj);
  }

  async removeBalloonPassenger(
    person: Person,
    balloon: Balloon
  ): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}.passengers`]: arrayRemove(person.id),
    });
  }

  async removeCarFromVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup
  ): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayRemove(car.id),
      [`cars.${car.id}.passengers`]: [],
      [`cars.${car.id}.operator`]: null,
      ...this.updateReservedCapacities(vehicleGroup, 'excöude', car),
    });
  }

  async removeCarPassenger(person: Person, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.passengers`]: arrayRemove(person.id),
    });
  }

  async setBalloonOperator(
    person: Person | undefined,
    balloon: Balloon
  ): Promise<void> {
    const obj: UpdateObject = {
      [`balloons.${balloon.id}.operator`]: person?.id ?? null,
    };

    if (balloon.operator) {
      obj[`people.${balloon.operator.id}.flights`] = increment(-1);
    }

    if (person) {
      obj[`people.${person.id}.flights`] = increment(1);
    }

    return this.updateFlightDocument(obj);
  }

  async setCarOperator(person: Person | undefined, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.operator`]: person?.id ?? null,
    });
  }

  async updateBalloon(balloon: Balloon): Promise<void> {
    if (this._flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of this._flight.vehicleGroups) {
      if (group.balloon.id === balloon.id) {
        obj = this.updateReservedCapacities(group, 'with', balloon);
        break;
      }
    }

    return this.updateFlightDocument({
      [`balloons.${balloon.id}`]: balloonToObject(balloon),
      ...obj,
    });
  }

  async updateCar(car: Car): Promise<void> {
    if (this._flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of this._flight.vehicleGroups) {
      const c = group.cars.find((value) => value.id === car.id);
      if (c != null) {
        obj = this.updateReservedCapacities(group, 'with', car);
        break;
      }
    }

    return this.updateFlightDocument({
      [`cars.${car.id}`]: carToObject(car),
      ...obj,
    });
  }

  async updateFLight(flight: Flight): Promise<void> {
    this._flight = flight;
    const ref = this.getFlightConverterReference(flight.id);
    return setDoc(ref, flight);
  }

  async updatePersom(person: Person): Promise<void> {
    return this.updateFlightDocument({
      [`people.${person.id}`]: personToObject(person),
    });
  }

  getFlightConverterReference(flightId: string) {
    const document = this.getFlightReference(flightId);
    return document.withConverter<Flight>({
      toFirestore: (flight: Flight) => {
        return flightToObject(flight, this._project?.id ?? '');
      },
      fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options) as FlightObject;
        // Sort vehicle group by ID
        // TODO is there a better solution?
        data.vehicleGroups = Object.keys(data.vehicleGroups)
          .sort()
          .reduce((obj: any, key) => {
            obj[key] = data.vehicleGroups[key];
            return obj;
          }, {});
        return flightFromObject(data, flightId);
      },
    });
  }

  getFlightReference(flightId: string) {
    return doc(db, 'flights', flightId);
  }

  getProjectConverterReference(projectId: string) {
    const document = this.getProjectReference(projectId);
    return document.withConverter<Project>({
      toFirestore: (project: Project) => {
        return projectToObject(project);
      },
      fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return projectFromObject(data as ProjectObject, projectId);
      },
    });
  }

  getProjectReference(projectId: string) {
    return doc(db, 'projects', projectId);
  }

  getUserConverterReference(userId: string) {
    const document = this.getUserReference(userId);
    return document.withConverter<User>({
      toFirestore: (user: User) => {
        return userToObject(user);
      },
      fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return userFromObject(data as UserObject, userId);
      },
    });
  }

  getUserReference(userId: string) {
    return doc(db, 'users', userId);
  }
}
