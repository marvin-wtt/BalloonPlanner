import type {
  Balloon,
  Car,
  ID,
  Person,
  VehicleAssignment,
} from 'app/src-common/entities';
import { useFlightStore } from 'stores/flight';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';

export function useFlightOperations() {
  const flightStore = useFlightStore();
  const projectStore = useProjectStore();

  const { flightSeries, flightLeg } = storeToRefs(flightStore);
  const { project } = storeToRefs(projectStore);

  function requireSeries() {
    const s = flightSeries.value;
    if (!s) {
      throw new Error('No flight series selected');
    }

    return s;
  }

  function requireLeg() {
    const l = flightLeg.value;
    if (!l) {
      throw new Error('No flight leg selected');
    }

    return l;
  }

  function requireProject() {
    const p = project.value;
    if (!p) {
      throw new Error('No project loaded');
    }

    return p;
  }

  function pushUnique<T>(arr: T[], item: T) {
    if (!arr.includes(item)) {
      arr.push(item);
    }
  }

  function removeFirst<T>(arr: T[], pred: (x: T) => boolean): number {
    const i = arr.findIndex(pred);

    if (i >= 0) arr.splice(i, 1);
    return i;
  }

  function ensureVehicleAssignment(vehicleId: ID): VehicleAssignment {
    const leg = requireLeg();
    const current = leg.assignments[vehicleId];
    if (current) {
      return current;
    }

    const assignment: VehicleAssignment = {
      operatorId: null,
      passengerIds: [],
    };
    leg.assignments[vehicleId] = assignment;

    return assignment;
  }

  function clearVehicle(vehicleId: ID) {
    const leg = requireLeg();
    // reset (keeps key stable if UI expects the entry to exist)
    leg.assignments[vehicleId] = { operatorId: null, passengerIds: [] };
  }

  function unassignPersonEverywhere(personId: ID) {
    const leg = flightLeg.value;
    if (!leg) {
      return;
    }
    for (const a of Object.values(leg.assignments)) {
      if (a.operatorId === personId) a.operatorId = null;
      a.passengerIds = a.passengerIds.filter((p) => p !== personId);
    }
  }

  function removeCarFromAllGroups(carId: ID) {
    const series = flightSeries.value;
    if (!series) {
      return;
    }
    for (const group of series.vehicleGroups) {
      removeFirst(group.carIds, (id) => id === carId);
    }
  }

  function removeVehicleGroupByBalloon(balloonId: ID) {
    const series = requireSeries();
    const idx = series.vehicleGroups.findIndex(
      (g) => g.balloonId === balloonId,
    );
    if (idx === -1) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const group = series.vehicleGroups[idx]!;
    // clear assignments for balloon and its cars
    [group.balloonId, ...group.carIds].forEach(clearVehicle);
    series.vehicleGroups.splice(idx, 1);
  }

  // ---------- vehicle groups ----------
  function addVehicleGroup(balloonId: ID) {
    const series = requireSeries();
    // avoid duplicates
    const exists = series.vehicleGroups.some((g) => g.balloonId === balloonId);
    if (exists) {
      return;
    }
    series.vehicleGroups.push({ balloonId, carIds: [] });
  }

  function removeVehicleGroup(balloonId: ID) {
    requireSeries(); // throws if none
    removeVehicleGroupByBalloon(balloonId);
  }

  function addCarToVehicleGroup(balloonId: ID, carId: ID) {
    const series = requireSeries();
    const group = series.vehicleGroups.find((g) => g.balloonId === balloonId);
    if (!group) {
      throw new Error(`No vehicle group found for balloon ${balloonId}`);
    }
    pushUnique(group.carIds, carId);
  }

  function removeCarFromVehicleGroup(balloonId: ID, carId: ID) {
    const series = requireSeries();
    const group = series.vehicleGroups.find((g) => g.balloonId === balloonId);
    if (!group) {
      throw new Error(`No vehicle group found for balloon ${balloonId}`);
    }

    // only clear the specific car, not all
    clearVehicle(carId);
    removeFirst(group.carIds, (id) => id === carId);
  }

  function setVehicleOperator(vehicleId: ID, personId: ID | null) {
    const assignment = ensureVehicleAssignment(vehicleId);
    assignment.operatorId = personId;
  }

  function addVehiclePassenger(vehicleId: ID, personId: ID) {
    const assignment = ensureVehicleAssignment(vehicleId);
    pushUnique(assignment.passengerIds, personId);
  }

  function removeVehiclePassenger(vehicleId: ID, personId: ID) {
    const assignment = ensureVehicleAssignment(vehicleId);
    removeFirst(assignment.passengerIds, (p) => p === personId);
  }

  function createPerson(person: Omit<Person, 'id'>) {
    const p = requireProject();
    p.people.push({ ...person, id: crypto.randomUUID() });
  }

  function editPerson(personId: ID, person: Omit<Person, 'id'>) {
    const p = requireProject();
    const people = p.people;
    const idx = people.findIndex(({ id }) => id === personId);
    if (idx === -1) {
      throw new Error(`Person ${personId} not found`);
    }
    people.splice(idx, 1, { ...person, id: personId });
  }

  function removePerson(personId: ID) {
    const series = requireSeries();
    // unlink from series
    removeFirst(series.personIds, (id) => id === personId);
    // also unassign from current leg if present
    unassignPersonEverywhere(personId);
  }

  function addPerson(personId: ID) {
    const series = requireSeries();
    pushUnique(series.personIds, personId);
  }

  function createBalloon(balloon: Omit<Balloon, 'id'>) {
    const p = requireProject();
    const id = crypto.randomUUID();
    p.balloons.push({ ...balloon, id });
    const series = requireSeries();
    pushUnique(series.balloonIds, id);
  }

  function editBalloon(balloonId: ID, balloon: Omit<Balloon, 'id'>) {
    const p = requireProject();
    const arr = p.balloons;
    const idx = arr.findIndex(({ id }) => id === balloonId);
    if (idx === -1) {
      throw new Error(`Balloon ${balloonId} not found`);
    }
    arr.splice(idx, 1, { ...balloon, id: balloonId });
  }

  function removeBalloon(balloonId: ID) {
    const series = requireSeries();
    // remove group (also clears assignments)
    removeVehicleGroupByBalloon(balloonId);
    // unlink from series list
    removeFirst(series.balloonIds, (b) => b === balloonId);
  }

  function addBalloon(balloonId: ID) {
    const series = requireSeries();
    pushUnique(series.balloonIds, balloonId);
  }

  // ---------- cars ----------
  function createCar(car: Omit<Car, 'id'>) {
    const p = requireProject();
    const id = crypto.randomUUID();
    p.cars.push({ ...car, id });
    const series = requireSeries();
    pushUnique(series.carIds, id);
  }

  function editCar(carId: ID, car: Omit<Car, 'id'>) {
    const p = requireProject();
    const arr = p.cars;
    const idx = arr.findIndex(({ id }) => id === carId);
    if (idx === -1) {
      throw new Error(`Car ${carId} not found`);
    }
    arr.splice(idx, 1, { ...car, id: carId });
  }

  function removeCar(carId: ID) {
    const series = requireSeries();
    // clear any assignment for this car & unlink from all groups
    clearVehicle(carId);
    removeCarFromAllGroups(carId);
    removeFirst(series.carIds, (c) => c === carId);
  }

  function addCar(carId: ID) {
    const series = requireSeries();
    pushUnique(series.carIds, carId);
  }

  return {
    // vehicle groups
    addVehicleGroup,
    removeVehicleGroup,
    addCarToVehicleGroup,
    removeCarFromVehicleGroup,

    // assignments
    setVehicleOperator,
    addVehiclePassenger,
    removeVehiclePassenger,
    clearVehicle,

    // people
    createPerson,
    editPerson,
    removePerson,
    addPerson,

    // balloons
    createBalloon,
    editBalloon,
    removeBalloon,
    addBalloon,

    // cars
    createCar,
    editCar,
    removeCar,
    addCar,
  };
}
