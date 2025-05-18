import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Balloon, Car, Flight, Person } from 'src/lib/entities';
import { useServiceStore } from 'stores/service';
import { useProjectStore } from 'stores/project';

export const useFlightStore = defineStore('flight', () => {
  const serviceStore = useServiceStore();
  const projectStore = useProjectStore();

  const flight = ref<Flight | undefined | null>();
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const balloons = computed<Record<string, Balloon>>(() => {
    if (flight.value === undefined) {
      return {};
    }

    return flight.value.balloons.reduce(
      (balloons, balloon) => ({
        ...balloons,
        [balloon.id]: balloon,
      }),
      {},
    );
  });

  const cars = computed<Record<string, Car>>(() => {
    if (flight.value === undefined) {
      return {};
    }

    return flight.value.cars.reduce(
      (cars, car) => ({
        ...cars,
        [car.id]: car,
      }),
      {},
    );
  });

  const persons = computed<Record<string, Car>>(() => {
    if (flight.value === undefined) {
      return {};
    }

    return flight.value.people.reduce(
      (persons, person) => ({
        ...person,
        [person.id]: person,
      }),
      {},
    );
  });

  async function load(flightId: string | undefined): Promise<void> {
    if (flightId == flight.value?.id) {
      return;
    }

    if (!flightId) {
      flight.value = null;
      serviceStore.dataService?.unloadFlight();
      return;
    }

    try {
      loading.value = true;
      error.value = null;
      await serviceStore.dataService?.loadFlight(flightId);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'Error';
    } finally {
      loading.value = false;
    }
  }

  function create(): Promise<Flight> {
    if (!serviceStore.dataService) {
      throw new Error('service_invalid');
    }

    return serviceStore.dataService.createFlight();
  }

  const availableBalloons = computed<Balloon[]>(() => {
    return (
      flight.value?.vehicleGroups.reduce(
        (balloons, group) =>
          balloons.filter((balloon) => balloon.id !== group.balloon.id),
        flight.value?.balloons ?? [],
      ) ?? []
    );
  });

  const availableCars = computed<Car[]>(() => {
    return (
      flight.value?.vehicleGroups.reduce(
        (cars, group) =>
          cars.filter(
            (car) => !group.cars.some((groupCar) => groupCar.id === car.id),
          ),
        flight.value?.cars ?? [],
      ) ?? []
    );
  });

  const availablePeople = computed<Person[]>(() => {
    return (
      flight.value?.vehicleGroups.reduce(
        (people, group) =>
          people.filter(
            (person) =>
              ![
                group.balloon.operator,
                ...group.cars.map((car) => car.operator),
                ...group.balloon.passengers,
                ...group.cars.flatMap((car) => car.passengers),
              ].includes(person),
          ),
        flight.value?.people,
      ) ?? []
    );
  });

  const personFlights = computed<Record<string, number>>(() => {
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
    // TODO Data not loaded

    const counts: Record<string, number> = {};
    for (const f of flightHistory) {
      const balloons = f.vehicleGroups.map((g) => g.balloon);
      for (const person of f.people) {
        const pid = person.id;
        if (!(pid in counts)) {
          counts[pid] = 0;
        }

        // check if this person is flying on any of the balloons
        const isFlying = balloons.some(
          (balloon) =>
            balloon.operator?.id === pid ||
            balloon.passengers.some((p) => p.id === pid),
        );

        counts[pid] += isFlying ? 1 : 0;
      }
    }

    return counts;
  });

  return {
    // Properties
    flight,
    error,
    loading,
    // Computed
    balloons,
    cars,
    persons,
    availableBalloons,
    availablePeople,
    availableCars,
    personFlights,
    // Methods
    load,
    create,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
