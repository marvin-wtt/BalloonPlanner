import { Ref } from 'vue';
import {
  doc,
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
import { throttle } from 'src/util/debounce-throttle';
import {
  Balloon,
  Car,
  Flight,
  Person,
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
} from 'src/lib/utils/converter';
import { PersistenceService } from 'src/services/persistence/PersistenceService';

type UpdateObject = {
  [key: string]: null | boolean | number | string | string[] | FieldValue;
};

export function subscribe(
  flight: Ref<Flight | undefined>,
  flightId: string
): () => void {
  const ref = getDocumentReference(flightId);

  const unsub = onSnapshot(ref, (doc) => {
    if (doc.exists()) {
      flight.value = doc.data();
    }
  });

  return unsub;
}

function getDocumentReference(flightId: string) {
  const document = doc(db, 'flights', flightId);
  const ref = document.withConverter<Flight>({
    toFirestore: (flight: Flight) => {
      return flightToObject(flight);
    },
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return flightFromObject(data as FlightObject, flightId);
    },
  });
  return ref;
}

export class FirebaseService extends PersistenceService {
  async updateFlightDocument(obj: object): Promise<void> {
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    return updateDoc(doc(db, 'flights', this.flight.id), obj);
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
        obj[`cars.${car.id}.reservedCapacity`] = 0;
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
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    const obj = {
      [`balloons.${balloon.id}`]: deleteField(),
    };

    const group = this.flight.vehicleGroups.find(
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
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj: UpdateObject = {};
    for (const vehicleGroup of this.flight.vehicleGroups) {
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
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {
      [`people.${person.id}`]: deleteField(),
    };

    for (const group of this.flight.vehicleGroups) {
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
    return this.updateFlightDocument({
      [`balloons.${balloon.id}.operator`]: person?.id ?? null,
    });
  }

  async setCarOperator(person: Person | undefined, car: Car): Promise<void> {
    return this.updateFlightDocument({
      [`cars.${car.id}.operator`]: person?.id ?? null,
    });
  }

  async updateBalloon(balloon: Balloon): Promise<void> {
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of this.flight.vehicleGroups) {
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
    if (this.flight == null) {
      throw new Error('Cannot update flight. No flight is set.');
    }

    let obj = {};
    for (const group of this.flight.vehicleGroups) {
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
    this.flight = flight;

    const ref = getDocumentReference(flight.id);
    return setDoc(ref, flight);
  }

  async updatePersom(person: Person): Promise<void> {
    return this.updateFlightDocument({
      [`people.${person.id}`]: personToObject(person),
    });
  }
}
