import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  type FieldValue,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
  where,
  query,
  collection,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useAuthStore } from 'stores/auth';
import type {
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
  type IFlight,
  flightToObject,
  personToObject,
  projectFromObject,
  type IProject,
  projectToObject,
  type IVehicleGroup,
  vehicleGroupToObject,
} from 'src/lib/utils/converter';
import type { PersistenceService } from 'src/services/persistence/PersistenceService';
import { useProjectStore } from 'stores/project';
import { useFlightStore } from 'stores/flight';

type UpdateObject = {
  [key: string]: null | boolean | number | string | string[] | FieldValue;
};

export class FirestoreDataService implements PersistenceService {
  private _unsubscribeFlight?: () => void;
  private _unsubscribeProject?: () => void;
  private _unsubscribeUser?: () => void;

  async loadUserData(user: User): Promise<void> {
    if (user.id == null) {
      throw new Error('invalid_user_id');
    }

    const ref = this.getProjectsCollectionReference();
    const q = query(ref, where('collaborators', 'array-contains', user.id));

    let callPromise = true;
    return new Promise<void>((resolve, reject) => {
      this._unsubscribeProject = onSnapshot(q, (querySnapshot) => {
        const authStore = useAuthStore();

        if (!authStore.user) {
          if (callPromise) {
            reject(new Error('authstore_not_ready'));
            callPromise = false;
          }
          return;
        }

        const projects: Project[] = [];
        querySnapshot.forEach((doc) => {
          if (!doc.exists()) {
            return;
          }

          const data = doc.data() as Project;
          data.id = doc.id;
          // TODO Data validation => maybe use converter
          projects.push(data);
        });
        authStore.user.projects = projects;

        if (callPromise) {
          resolve();
          callPromise = false;
        }
      });
    });
  }

  unloadUserData() {
    // TODO This should be removed, no?
    const authStore = useAuthStore();
    authStore.user = undefined;
  }

  unloadProject() {
    const projectStore = useProjectStore();
    projectStore.project = undefined;

    if (this._unsubscribeProject != null) {
      this._unsubscribeProject();
      this._unsubscribeProject = undefined;
    }
  }

  unloadFlight() {
    const flightStore = useFlightStore();
    flightStore.flight = undefined;

    if (this._unsubscribeFlight != null) {
      this._unsubscribeFlight();
      this._unsubscribeFlight = undefined;
    }
  }

  loadProject(projectId: string | null): Promise<void> {
    if (this._unsubscribeProject != null) {
      this._unsubscribeProject();
    }

    if (projectId == null) {
      throw new Error('invalid_project_id');
    }

    let callPromise = true;
    const ref = this.getProjectConverterReference(projectId);

    return new Promise<void>((resolve) => {
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
    const projectStore = useProjectStore();
    projectStore.project = project;

    if (project.local) {
      project.local = false;
    }

    const authStore = useAuthStore();

    if (authStore.user == null) {
      throw new Error('not_authenticated');
    }

    if (!project.collaborators.includes(authStore.user.id)) {
      project.collaborators.push(authStore.user.id);
    }

    for (const flight of project.flights) {
      const flightRef = this.getFlightConverterReference(flight.id);
      await setDoc(flightRef, flight);
    }

    const projectRef = this.getProjectConverterReference(project.id);
    await setDoc(projectRef, project);
  }

  async createFlight(): Promise<Flight> {
    const projectStore = useProjectStore();
    const project = projectStore.project;

    if (!project) {
      throw new Error('No project loaded.');
    }

    const lastIndex = project.flights.length - 1;
    // Create a new, clean flight if the project holds no flights or if the flight id is invalid for some reason.
    let flight = new Flight([], [], []);
    if (lastIndex >= 0) {
      // Flight needs to be loaded first as all flights only hold the id of the flight
      const lastFlight = project.flights[lastIndex];

      const flightRef = this.getFlightConverterReference(lastFlight?.id);
      const flightSnap = await getDoc(flightRef);
      if (flightSnap.exists()) {
        const baseFlight = flightSnap.data();
        flight = new Flight(
          baseFlight.balloons.map(
            (value) =>
              new Balloon(value.name, value.capacity, value.allowedOperators),
          ),
          baseFlight.cars.map(
            (value) =>
              new Car(value.name, value.capacity, value.allowedOperators),
          ),
          baseFlight.people,
        );
      }
    }

    await this.addFlight(flight);

    return flight;
  }

  async addFlight(flight: Flight): Promise<void> {
    const projectStore = useProjectStore();
    if (projectStore.project == null) {
      throw new Error('no_project');
    }

    const ref = this.getFlightConverterReference(flight.id);
    await setDoc(ref, flight);

    // FIXME This should be done by firebase cloud functions - SECURITY RISK
    await this.updateProjectDocument({
      ['flights']: arrayUnion(flight.id),
    });
  }

  updateProject(project: Project): Promise<void> {
    // TODO
    return Promise.resolve(undefined);
  }

  loadFlight(flightId: string | null): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;
    if (flight && flight.id === flightId) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      if (this._unsubscribeFlight != null) {
        this._unsubscribeFlight();
      }

      if (flightId == null) {
        reject(new Error('invalid_flight'));
        return;
      }

      let callPromise = true;
      const ref = this.getFlightConverterReference(flightId);
      this._unsubscribeFlight = onSnapshot(ref, (doc) => {
        const flightStore = useFlightStore();
        flightStore.flight = doc.data();

        if (callPromise) {
          callPromise = false;
          if (doc.exists()) {
            resolve();
          } else {
            reject(new Error('flight_not_found'));
          }
        }
      });
    });
  }

  updateProjectDocument(obj: object): Promise<void> {
    const projectStore = useProjectStore();
    const project = projectStore.project;
    if (project == null) {
      throw new Error('Cannot update project. No project set.');
    }

    return updateDoc(doc(db, 'projects', project.id), obj);
  }

  updateFlightDocument(obj: object): Promise<void> {
    const authStore = useAuthStore();
    const flightStore = useFlightStore();

    if (authStore.user == null) {
      throw new Error('Cannot update flight. Not authenticated.');
    }

    if (flightStore.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    return updateDoc(doc(db, 'flights', flightStore.flight.id), obj);
  }

  addBalloon(balloon: Balloon): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}`]: balloonToObject(balloon),
    });
  }

  addBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}.passengers`]: arrayUnion(person.id),
      [`people.${person.id}.flights`]: increment(1),
    });
  }

  addCar(car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}`]: carToObject(car),
    });
  }

  addCarPassenger(person: Person, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.passengers`]: arrayUnion(person.id),
    });
  }

  private updateReservedCapacities(
    vehicleGroup: VehicleGroup,
    mode?: 'exclude' | 'include' | 'with',
    extra?: Car | Balloon,
  ): object {
    const obj: UpdateObject = {};
    const withBalloon =
      mode === 'with' && extra != null && extra instanceof Balloon;
    let remainingCapacity = withBalloon
      ? extra?.capacity
      : vehicleGroup.balloon.capacity;
    for (let car of vehicleGroup.cars) {
      if (mode === 'exclude' && car.id === extra?.id) {
        // obj[`cars.${car.id}.reservedCapacity`] = 0;
        continue;
      }
      if (mode === 'with' && extra instanceof Car && extra?.id === car.id) {
        car = extra;
      }

      const capacity = car.capacity - 1;
      const reserved =
        capacity >= remainingCapacity ? remainingCapacity : capacity;
      remainingCapacity -= reserved;
      obj[`cars.${car.id}.reservedCapacity`] = reserved;
    }

    if (mode === 'include' && extra != null) {
      obj[`cars.${extra.id}.reservedCapacity`] =
        extra.capacity - 1 >= remainingCapacity
          ? remainingCapacity
          : extra.capacity - 1;
    }

    return obj;
  }

  addCarToVehicleGroup(car: Car, vehicleGroup: VehicleGroup): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayUnion(car.id),
      ...this.updateReservedCapacities(vehicleGroup, 'include', car),
    });
  }

  addPerson(person: Person): Promise<void> {
    return this.updateFlightDocument({
      [`people.${person.id}`]: personToObject(person),
    });
  }

  addVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}`]: vehicleGroupToObject(vehicleGroup),
    });
  }

  deleteBalloon(balloon: Balloon): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;

    if (flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    const obj = {
      [`balloons.${balloon.id}`]: deleteField(),
    };

    const group = flight.vehicleGroups.find(
      (value) => value.balloon.id === balloon.id,
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

  deleteCar(car: Car): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;

    if (flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj: UpdateObject = {};
    for (const vehicleGroup of flight.vehicleGroups) {
      const c = vehicleGroup.cars.find((value) => value.id === car.id);
      if (c == null) {
        continue;
      }
      obj = {
        [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayRemove(car.id),
        ...this.updateReservedCapacities(vehicleGroup, 'exclude', car),
      };
      break;
    }

    return this.updateFlightDocument({
      [`cars.${car.id}`]: deleteField(),
      ...obj,
    });
  }

  deletePerson(person: Person): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;

    if (flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {
      [`people.${person.id}`]: deleteField(),
    };

    for (const group of flight.vehicleGroups) {
      const result = this.removePersonFromVehicle(
        person,
        group.balloon,
        'balloons',
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
    list: 'balloons' | 'cars',
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

  deleteVehicleGroup(vehicleGroup: VehicleGroup): Promise<void> {
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

  removeBalloonPassenger(person: Person, balloon: Balloon): Promise<void> {
    return this.updateFlightDocument({
      [`balloons.${balloon.id}.passengers`]: arrayRemove(person.id),
      [`people.${person.id}.flights`]: increment(-1),
    });
  }

  removeCarFromVehicleGroup(
    car: Car,
    vehicleGroup: VehicleGroup,
  ): Promise<void> {
    return this.updateFlightDocument({
      [`vehicleGroups.${vehicleGroup.id}.cars`]: arrayRemove(car.id),
      [`cars.${car.id}.passengers`]: [],
      [`cars.${car.id}.operator`]: null,
      ...this.updateReservedCapacities(vehicleGroup, 'exclude', car),
    });
  }

  removeCarPassenger(person: Person, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.passengers`]: arrayRemove(person.id),
    });
  }

  setBalloonOperator(
    person: Person | undefined,
    balloon: Balloon,
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

  setCarOperator(person: Person | undefined, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.operator`]: person?.id ?? null,
    });
  }

  updateBalloon(balloon: Balloon): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;

    if (flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of flight.vehicleGroups) {
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

  updateCar(car: Car): Promise<void> {
    const flightStore = useFlightStore();
    const flight = flightStore.flight;

    if (flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of flight.vehicleGroups) {
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

  updatePerson(person: Person): Promise<void> {
    return this.updateFlightDocument({
      [`people.${person.id}`]: personToObject(person),
    });
  }

  async updateFLight(flight: Flight): Promise<void> {
    const flightStore = useFlightStore();

    const ref = this.getFlightConverterReference(flight.id);
    await setDoc(ref, flight);

    flightStore.flight = flight;
  }

  getFlightConverterReference(flightId: string) {
    const projectStore = useProjectStore();
    const document = this.getFlightReference(flightId);
    return document.withConverter<Flight>({
      toFirestore: (flight: Flight) => {
        return flightToObject(flight, projectStore.project?.id ?? '');
      },
      fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options) as IFlight;
        // Sort vehicle group by ID
        // TODO is there a better solution?
        data.vehicleGroups = Object.keys(data.vehicleGroups)
          .sort()
          .reduce(
            (obj, key) => {
              obj[key] = data.vehicleGroups[key];
              return obj;
            },
            {} as Record<string, IVehicleGroup>,
          );
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
        return projectFromObject(data as IProject, projectId);
      },
    });
  }

  getProjectReference(projectId: string) {
    return doc(db, 'projects', projectId);
  }

  getProjectsCollectionReference() {
    return collection(db, 'projects');
  }
}
