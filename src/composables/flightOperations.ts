import type { Balloon, Car, ID, Person } from 'app/src-common/entities';
import { useFlightStore } from 'stores/flight';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';

export function useFlightOperations() {
  const flightStore = useFlightStore();
  const projectStore = useProjectStore();

  const { flightSeries, flightLeg } = storeToRefs(flightStore);

  function addVehicleGroup(balloonId: string) {
    flightSeries.value.vehicleGroups.push({
      balloonId,
      carIds: [],
    });
  }

  function removeVehicleGroup(balloonId: string) {
    const groups = flightSeries.value.vehicleGroups;
    const group = groups.find((g) => g.balloonId === balloonId);

    const index = groups.findIndex((g) => g.balloonId === balloonId);
    groups.splice(index, 1);

    const vehicleIds = [group.balloonId, ...group.carIds];
    vehicleIds.forEach(clearVehicle);
  }

  function addCarToVehicleGroup(balloonId: string, carId: string) {
    flightSeries.value.vehicleGroups
      .find((group) => group.balloonId === balloonId)
      .carIds.push(carId);
  }

  function removeCarFromVehicleGroup(balloonId: string, carId: string) {
    const carIds = flightSeries.value.vehicleGroups.find(
      (group) => group.balloonId === balloonId,
    ).carIds;

    carIds.forEach(clearVehicle);

    const index = carIds.findIndex((id) => id === carId);
    carIds.splice(index, 1);
  }

  function setVehicleOperator(vehicleId: ID, personId: ID | null) {
    flightLeg.value.assignments[vehicleId].operatorId = personId;
  }

  function addVehiclePassenger(vehicleId: ID, personId: ID) {
    const assignment = flightLeg.value.assignments[vehicleId];
    if (assignment.passengerIds.includes(personId)) {
      return;
    }

    assignment.passengerIds.push(personId);
  }

  function removeVehiclePassenger(vehicleId: ID, personId: ID) {
    if (!(vehicleId in flightLeg.value.assignments)) {
      throw new Error(`Vehicle ${vehicleId} not found in current flight leg`);
    }

    const assignment = flightLeg.value.assignments[vehicleId];
    const index = assignment.passengerIds.findIndex((p) => p === personId);
    if (index === -1) {
      return;
    }

    assignment.passengerIds.splice(index, 1);
  }

  function clearVehicle(vehicleId: string) {
    flightLeg.value.assignments[vehicleId] = {
      operatorId: null,
      passengerIds: [],
    };
  }

  function addBalloonOperator(balloonId: string, personId: string) {
    setVehicleOperator(balloonId, personId);
  }

  function addCarOperator(balloonId: string, carId: string, personId: string) {
    setVehicleOperator(carId, personId);
  }

  function removeBalloonOperator(balloonId: string) {
    setVehicleOperator(balloonId, null);
  }

  function removeCarOperator(balloonId: string, carId: string) {
    setVehicleOperator(carId, null);
  }

  function addBalloonPassenger(balloonId: string, personId: string) {
    addVehiclePassenger(balloonId, personId);
  }

  function addCarPassenger(balloonId: string, carId: string, personId: string) {
    addVehiclePassenger(carId, personId);
  }

  function removeBalloonPassenger(balloonId: string, personId: string) {
    removeVehiclePassenger(balloonId, personId);
  }

  function removeCarPassenger(
    balloonId: string,
    carId: string,
    personId: string,
  ) {
    removeVehiclePassenger(carId, personId);
  }

  function clearBalloon(balloonId: string) {
    clearVehicle(balloonId);
  }

  function clearCar(balloonId: string, carId: string) {
    clearVehicle(carId);
  }

  function createPerson(person: Omit<Person, 'id'>) {
    projectStore.project.people.push({
      ...person,
      id: crypto.randomUUID(),
    });
  }

  function editPerson(personId: string, person: Omit<Person, 'id'>) {
    projectStore.project.people.splice(
      projectStore.project.people.findIndex(({ id }) => id === personId),
      1,
      {
        ...person,
        id: personId,
      },
    );
  }

  function removePerson(personId: string) {
    const personIds = flightSeries.value.personIds;

    personIds.splice(
      personIds.findIndex((b) => b === personId),
      1,
    );
  }

  function createBalloon(balloon: Omit<Balloon, 'id'>) {
    const id = crypto.randomUUID();

    projectStore.project.balloons.push({
      ...balloon,
      id,
    });
    flightSeries.value.balloonIds.push(id);
  }

  function editBalloon(balloonId: string, balloon: Omit<Balloon, 'id'>) {
    projectStore.project.balloons.splice(
      projectStore.project.balloons.findIndex(({ id }) => id === balloonId),
      1,
      {
        ...balloon,
        id: balloonId,
      },
    );
  }

  function removeBalloon(balloonId: string) {
    const balloonIds = flightSeries.value.balloonIds;

    balloonIds.splice(
      balloonIds.findIndex((b) => b === balloonId),
      1,
    );
  }

  function createCar(car: Omit<Car, 'id'>) {
    const id = crypto.randomUUID();

    projectStore.project.cars.push({
      ...car,
      id,
    });
    flightSeries.value.carIds.push(id);
  }

  function editCar(carId: string, car: Omit<Car, 'id'>) {
    projectStore.project.cars.splice(
      projectStore.project.cars.findIndex(({ id }) => id === carId),
      1,
      {
        ...car,
        id: carId,
      },
    );
  }

  function removeCar(carId: string) {
    const carIds = flightSeries.value.carIds;

    carIds.splice(
      carIds.findIndex((b) => b === carId),
      1,
    );
  }

  function addPerson(personId: string) {
    flightSeries.value.personIds.push(personId);
  }

  function addBalloon(balloonId: string) {
    flightSeries.value.balloonIds.push(balloonId);
  }

  function addCar(carId: string) {
    flightSeries.value.carIds.push(carId);
  }

  return {
    addVehicleGroup,
    removeVehicleGroup,
    addCarToVehicleGroup,
    removeCarFromVehicleGroup,
    setVehicleOperator,
    addBalloonOperator,
    addCarOperator,
    removeBalloonOperator,
    removeCarOperator,
    addVehiclePassenger,
    addBalloonPassenger,
    addCarPassenger,
    removeVehiclePassenger,
    removeBalloonPassenger,
    removeCarPassenger,
    clearBalloon,
    clearCar,
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
