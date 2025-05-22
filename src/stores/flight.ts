import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import type { Balloon, Car, Flight, Person } from 'app/src-common/entities';
import { useProjectStore } from 'stores/project';

export const useFlightStore = defineStore('flight', () => {
  const projectStore = useProjectStore();
  const { project } = storeToRefs(projectStore);

  const flightId = ref<string>();

  const flight = computed<Flight | undefined>(() => {
    if (!project.value || !flightId.value) {
      return undefined;
    }

    return project.value.flights.find(({ id }) => id === flightId.value);
  });

  const balloonMap = computed<Record<string, Balloon>>(() => {
    if (!flight.value) {
      return {};
    }

    return project.value.balloons
      .filter(({ id }) => flight.value.balloonIds.includes(id))
      .reduce(
        (balloons, balloon) => ({
          ...balloons,
          [balloon.id]: balloon,
        }),
        {},
      );
  });

  const carMap = computed<Record<string, Car>>(() => {
    if (!flight.value) {
      return {};
    }

    return project.value.cars
      .filter(({ id }) => flight.value.carIds.includes(id))
      .reduce(
        (cars, car) => ({
          ...cars,
          [car.id]: car,
        }),
        {},
      );
  });

  const personMap = computed<Record<string, Person>>(() => {
    if (!flight.value) {
      return {};
    }

    return project.value.people
      .filter(({ id }) => flight.value.personIds.includes(id))
      .reduce(
        (persons, person) => ({
          ...persons,
          [person.id]: person,
        }),
        {},
      );
  });

  function loadFlight(id: string) {
    flightId.value = id;
  }

  function createFlight(): Flight {
    const newFlight = {
      id: crypto.randomUUID(),
      vehicleGroups: [],
      carIds: project.value.cars.map(({ id }) => id),
      balloonIds: project.value.balloons.map(({ id }) => id),
      personIds: project.value.people.map(({ id }) => id),
    };

    project.value.flights.push(newFlight);

    return newFlight;
  }

  function deleteFlight(id: string) {
    const index = project.value.flights.findIndex((f) => f.id === id);
    if (index >= 0) {
      project.value.flights.splice(index, 1);
    }

    if (flight.value?.id === id) {
      flightId.value = undefined;
    }
  }

  const availableBalloons = computed<Balloon[]>(() => {
    if (!flight.value) {
      return [];
    }

    return flight.value.vehicleGroups.reduce(
      (balloons, group) =>
        balloons.filter((balloon) => balloon.id !== group.balloon.id),
      Object.values(balloonMap.value),
    );
  });

  const availableCars = computed<Car[]>(() => {
    if (!flight.value) {
      return [];
    }

    return flight.value.vehicleGroups.reduce(
      (cars, group) =>
        cars.filter(
          (car) => !group.cars.some((groupCar) => groupCar.id === car.id),
        ),
      Object.values(carMap.value),
    );
  });

  const availablePeople = computed<Person[]>(() => {
    if (!flight.value) {
      return [];
    }

    return flight.value.vehicleGroups.reduce(
      (people, group) =>
        people.filter(
          (person) =>
            ![
              group.balloon.operatorId,
              ...group.cars.map((car) => car.operatorId),
              ...group.balloon.passengerIds,
              ...group.cars.flatMap((car) => car.passengerIds),
            ].includes(person.id),
        ),
      Object.values(personMap.value),
    );
  });

  const numberOfFlights = computed<Record<string, number>>(() => {
    const allFlights = project.value?.flights ?? [];
    const currentFlightId = flight.value?.id;
    if (!currentFlightId) {
      return {};
    }

    const endIndex = allFlights.findIndex((f) => f.id === currentFlightId);
    if (endIndex === -1) {
      return {};
    }

    const flightHistory = allFlights.slice(0, endIndex);
    const counts: Record<string, number> = {};
    for (const f of flightHistory) {
      const balloons = f.vehicleGroups.map((g) => g.balloon);
      for (const person of project.value.people) {
        const pid = person.id;
        if (!(pid in counts)) {
          counts[pid] = 0;
        }

        // check if this person is flying on any of the balloons
        const isFlying = balloons.some(
          (balloon) =>
            balloon.operatorId === pid ||
            balloon.passengerIds.some((pIds) => pIds === pid),
        );

        counts[pid] += isFlying ? 1 : 0;
      }
    }

    return counts;
  });

  return {
    // Computed
    flight,
    balloonMap,
    carMap,
    personMap,
    availableBalloons,
    availablePeople,
    availableCars,
    numberOfFlights,
    // Methods
    loadFlight,
    createFlight,
    deleteFlight,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
