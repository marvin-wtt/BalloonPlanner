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

  function addVehicleGroup(balloonId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    flightSeries.value.vehicleGroups.push({
      balloonId,
      carIds: [],
    });
  }

  function removeVehicleGroup(balloonId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const groups = flightSeries.value.vehicleGroups;
    const group = groups.find((g) => g.balloonId === balloonId);
    if (!group) {
      throw new Error(`No vehicle group found for balloon ${balloonId}`);
    }

    const index = groups.indexOf(group);

    groups.splice(index, 1);

    const vehicleIds = [group.balloonId, ...group.carIds];
    vehicleIds.forEach(clearVehicle);
  }

  function addCarToVehicleGroup(balloonId: string, carId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    flightSeries.value.vehicleGroups
      .find((group) => group.balloonId === balloonId)
      .carIds.push(carId);
  }

  function removeCarFromVehicleGroup(balloonId: string, carId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const carIds = flightSeries.value.vehicleGroups.find(
      (group) => group.balloonId === balloonId,
    ).carIds;

    carIds.forEach(clearVehicle);

    const index = carIds.findIndex((id) => id === carId);
    carIds.splice(index, 1);
  }

  function ensureVehicleAssignment(vehicleId: ID): VehicleAssignment {
    if (!flightLeg.value) {
      throw new Error('No flight leg selected');
    }

    if (vehicleId in flightLeg.value.assignments) {
      return flightLeg.value.assignments[vehicleId];
    }

    const assignment: VehicleAssignment = {
      operatorId: null,
      passengerIds: [],
    };

    flightLeg.value.assignments[vehicleId] = assignment;

    return assignment;
  }

  function setVehicleOperator(vehicleId: ID, personId: ID | null) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const assignment = ensureVehicleAssignment(vehicleId);
    assignment.operatorId = personId;
  }

  function addVehiclePassenger(vehicleId: ID, personId: ID) {
    const assignment = ensureVehicleAssignment(vehicleId);
    if (assignment.passengerIds.includes(personId)) {
      return;
    }

    assignment.passengerIds.push(personId);
  }

  function removeVehiclePassenger(vehicleId: ID, personId: ID) {
    const assignment = ensureVehicleAssignment(vehicleId);

    const index = assignment.passengerIds.findIndex((p) => p === personId);
    if (index === -1) {
      return;
    }

    assignment.passengerIds.splice(index, 1);
  }

  function clearVehicle(vehicleId: string) {
    if (!flightLeg.value) {
      throw new Error('No flight leg selected');
    }

    flightLeg.value.assignments[vehicleId] = {
      operatorId: null,
      passengerIds: [],
    };
  }

  function createPerson(person: Omit<Person, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    project.value.people.push({
      ...person,
      id: crypto.randomUUID(),
    });
  }

  function editPerson(personId: string, person: Omit<Person, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    const people = projectStore.project.people;

    eople.splice(
      people.findIndex(({ id }) => id === personId),
      1,
      {
        ...person,
        id: personId,
      },
    );
  }

  function removePerson(personId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const personIds = flightSeries.value.personIds;

    personIds.splice(
      personIds.findIndex((b) => b === personId),
      1,
    );
  }

  function createBalloon(balloon: Omit<Balloon, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    const id = crypto.randomUUID();

    project.value.balloons.push({
      ...balloon,
      id,
    });
    flightSeries.value.balloonIds.push(id);
  }

  function editBalloon(balloonId: string, balloon: Omit<Balloon, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    const balloons = project.value.balloons;

    balloons.splice(
      balloons.findIndex(({ id }) => id === balloonId),
      1,
      {
        ...balloon,
        id: balloonId,
      },
    );
  }

  function removeBalloon(balloonId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const balloonIds = flightSeries.value.balloonIds;

    balloonIds.splice(
      balloonIds.findIndex((b) => b === balloonId),
      1,
    );
  }

  function createCar(car: Omit<Car, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    const id = crypto.randomUUID();
    project.value.cars.push({
      ...car,
      id,
    });
    flightSeries.value.carIds.push(id);
  }

  function editCar(carId: string, car: Omit<Car, 'id'>) {
    if (!project.value) {
      throw new Error('No project loaded');
    }

    const cars = project.value.cars;

    cars.splice(
      cars.findIndex(({ id }) => id === carId),
      1,
      {
        ...car,
        id: carId,
      },
    );
  }

  function removeCar(carId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    const carIds = flightSeries.value.carIds;

    carIds.splice(
      carIds.findIndex((b) => b === carId),
      1,
    );
  }

  function addPerson(personId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    flightSeries.value.personIds.push(personId);
  }

  function addBalloon(balloonId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    flightSeries.value.balloonIds.push(balloonId);
  }

  function addCar(carId: string) {
    if (!flightSeries.value) {
      throw new Error('No flight series selected');
    }

    flightSeries.value.carIds.push(carId);
  }

  return {
    addVehicleGroup,
    removeVehicleGroup,
    addCarToVehicleGroup,
    removeCarFromVehicleGroup,
    setVehicleOperator,
    addVehiclePassenger,
    removeVehiclePassenger,
    clearVehicle,
    createPerson,
    editPerson,
    removePerson,
    createBalloon,
    editBalloon,
    removeBalloon,
    createCar,
    editCar,
    removeCar,
    addPerson,
    addBalloon,
    addCar,
  };
}
