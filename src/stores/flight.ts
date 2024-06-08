import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { Balloon, Car, Flight, Person } from 'src/lib/entities';
import { useServiceStore } from 'stores/service';

export const useFlightStore = defineStore('flight', () => {
  const serviceStore = useServiceStore();

  const flight = ref<Flight | undefined | null>();
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

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
      throw 'service_invalid';
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

  return {
    // Properties
    flight,
    error,
    loading,
    // Computed
    availableBalloons,
    availablePeople,
    availableCars,
    // Methods
    load,
    create,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
