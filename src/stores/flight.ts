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

    return projectStore.project.cars
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

    return projectStore.project.people
      .filter(({ id }) => flight.value.personIds.includes(id))
      .reduce(
        (persons, person) => ({
          ...persons,
          [person.id]: person,
        }),
        {},
      );
  });

  function load(id: string) {
    flightId.value = id;
  }

  function create(): Flight {
    const newFlight = {
      id: crypto.randomUUID(),
      vehicleGroups: [],
      carIds: projectStore.project.cars.map(({ id }) => id),
      balloonIds: projectStore.project.balloons.map(({ id }) => id),
      personIds: projectStore.project.people.map(({ id }) => id),
    };

    projectStore.project.flights.push(newFlight);

    return newFlight;
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
    const allFlights = projectStore.project?.flights ?? [];
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
      for (const person of projectStore.project.people) {
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
    load,
    create,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
