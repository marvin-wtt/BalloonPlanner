import type { Balloon, Car, Person } from 'app/src-common/entities';
import { useFlightStore } from 'stores/flight';
import { useProjectStore } from 'stores/project';

export function useFlightOperations() {
  const flightStore = useFlightStore();
  const projectStore = useProjectStore();

  function addVehicleGroup(balloonId: string) {
    flightStore.flight.vehicleGroups.push({
      balloon: {
        id: balloonId,
        operatorId: null,
        passengerIds: [],
      },
      cars: [],
    });
  }

  function removeVehicleGroup(balloonId: string) {
    const groups = flightStore.flight.vehicleGroups;

    groups.splice(
      groups.findIndex((g) => g.balloon.id === balloonId),
      1,
    );
  }

  function addCarToVehicleGroup(balloonId: string, carId: string) {
    flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .cars.push({
        id: carId,
        operatorId: null,
        passengerIds: [],
      });
  }

  function removeCarFromVehicleGroup(balloonId: string, carId: string) {
    const cars = flightStore.flight.vehicleGroups.find(
      (group) => group.balloon.id === balloonId,
    ).cars;

    cars.splice(
      cars.findIndex((c) => c.id === carId),
      1,
    );
  }

  function addBalloonOperator(balloonId: string, personId: string) {
    flightStore.flight.vehicleGroups.find(
      (group) => group.balloon.id === balloonId,
    ).balloon.operatorId = personId;
  }

  function addCarOperator(balloonId: string, carId: string, personId: string) {
    flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .cars.find((c) => c.id === carId).operatorId = personId;
  }

  function removeBalloonOperator(balloonId: string) {
    flightStore.flight.vehicleGroups.find(
      (group) => group.balloon.id === balloonId,
    ).balloon.operatorId = null;
  }

  function removeCarOperator(balloonId: string, carId: string) {
    flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .cars.find((c) => c.id === carId).operatorId = null;
  }

  function addBalloonPassenger(balloonId: string, personId: string) {
    flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .balloon.passengerIds.push(personId);
  }

  function addCarPassenger(balloonId: string, carId: string, personId: string) {
    flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .cars.find((c) => c.id === carId)
      .passengerIds.push(personId);
  }

  function removeBalloonPassenger(balloonId: string, personId: string) {
    const passengerIds = flightStore.flight.vehicleGroups.find(
      (group) => group.balloon.id === balloonId,
    ).balloon.passengerIds;

    passengerIds.splice(
      passengerIds.findIndex((p) => p === personId),
      1,
    );
  }

  function removeCarPassenger(
    balloonId: string,
    carId: string,
    personId: string,
  ) {
    const passengerIds = flightStore.flight.vehicleGroups
      .find((group) => group.balloon.id === balloonId)
      .cars.find((c) => c.id === carId).passengerIds;

    passengerIds.splice(
      passengerIds.findIndex((p) => p === personId),
      1,
    );
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
    const personIds = flightStore.flight.personIds;

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
    flightStore.flight.balloonIds.push(id);
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
    const balloonIds = flightStore.flight.balloonIds;

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
    flightStore.flight.carIds.push(id);
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
    const carIds = flightStore.flight.carIds;

    carIds.splice(
      carIds.findIndex((b) => b === carId),
      1,
    );
  }

  function addPerson(personId: string) {
    flightStore.flight.personIds.push(personId);
  }

  function addBalloon(balloonId: string) {
    flightStore.flight.balloonIds.push(balloonId);
  }

  function addCar(carId: string) {
    flightStore.flight.carIds.push(carId);
  }

  return {
    addVehicleGroup,
    removeVehicleGroup,
    addCarToVehicleGroup,
    removeCarFromVehicleGroup,
    addBalloonOperator,
    addCarOperator,
    removeBalloonOperator,
    removeCarOperator,
    addBalloonPassenger,
    addCarPassenger,
    removeBalloonPassenger,
    removeCarPassenger,
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
