import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import type {
  Balloon,
  Car,
  FlightSeries,
  Person,
  SmartFillPayload,
  SmartFillOptions,
  FlightLeg,
  ID,
} from 'app/src-common/entities';
import { useProjectStore } from 'stores/project';

export const useFlightStore = defineStore('flight', () => {
  const projectStore = useProjectStore();
  const { project } = storeToRefs(projectStore);

  const flightLegId = ref<string>();

  const flightSeries = computed<FlightSeries | undefined>(() => {
    if (!project.value || !flightLegId.value) {
      return undefined;
    }

    return project.value.flights.find((series) =>
      series.legs.some((leg) => leg.id === flightLegId.value),
    );
  });

  const flightLeg = computed<FlightLeg | undefined>(() => {
    if (!project.value || !flightLegId.value) {
      return undefined;
    }

    return project.value.flights
      .flatMap((flight) => flight.legs)
      .find((leg) => leg.id === flightLegId.value);
  });

  const balloonMap = computed<Record<string, Balloon>>(() => {
    if (!flightSeries.value) {
      return {};
    }

    return project.value.balloons
      .filter(({ id }) => flightSeries.value.balloonIds.includes(id))
      .reduce(
        (balloons, balloon) => ({
          ...balloons,
          [balloon.id]: balloon,
        }),
        {},
      );
  });

  const carMap = computed<Record<string, Car>>(() => {
    if (!flightSeries.value) {
      return {};
    }

    return project.value.cars
      .filter(({ id }) => flightSeries.value.carIds.includes(id))
      .reduce(
        (cars, car) => ({
          ...cars,
          [car.id]: car,
        }),
        {},
      );
  });

  const personMap = computed<Record<string, Person>>(() => {
    if (!flightSeries.value) {
      return {};
    }

    return project.value.people
      .filter(({ id }) => flightSeries.value.personIds.includes(id))
      .reduce(
        (persons, person) => ({
          ...persons,
          [person.id]: person,
        }),
        {},
      );
  });

  function loadFlightLeg(id: ID) {
    flightLegId.value = id;
  }

  function createFlight(
    flight?: Partial<Omit<FlightSeries, 'id'>>,
  ): FlightSeries {
    const newFlight = {
      id: crypto.randomUUID(),
      date: flight.date ?? new Date().toISOString(),
      vehicleGroups: flight.vehicleGroups ?? [],
      legs: flight.legs ?? [
        {
          id: crypto.randomUUID(),
          assignments: {},
        },
      ],
      carIds: flight.carIds ?? project.value.cars.map(({ id }) => id),
      balloonIds:
        flight.balloonIds ?? project.value.balloons.map(({ id }) => id),
      personIds: flight.personIds ?? project.value.people.map(({ id }) => id),
    };

    project.value.flights.push(newFlight);

    return newFlight;
  }

  function deleteFlightLeg(flightId: string) {
    const series = project.value.flights.find((f) =>
      f.legs.some((leg) => leg.id === flightId),
    );

    if (!series) {
      return;
    }

    const legIndex = flightSeries.value.legs.findIndex(
      (leg) => leg.id === flightId,
    );
    if (legIndex < 0) {
      // This should never happen since the series was found
      throw new Error('Flight leg not found: ' + flightId);
    }

    series.legs.splice(legIndex, 1);

    // Reset store if the current flight is loaded
    if (flightLegId.value === flightId) {
      flightLegId.value = undefined;
    }

    if (series.legs.length > 0) {
      return;
    }

    const seriesIndex = project.value.flights.findIndex(
      (f) => f.id === series.id,
    );
    if (seriesIndex < 0) {
      return;
    }

    project.value.flights.splice(seriesIndex, 1);
  }

  const availableBalloons = computed<Balloon[]>(() => {
    if (!flightSeries.value) {
      return [];
    }

    return flightSeries.value.vehicleGroups.reduce(
      (balloons, group) => balloons.filter((id) => id.id !== group.balloonId),
      Object.values(balloonMap.value),
    );
  });

  const availableCars = computed<Car[]>(() => {
    if (!flightSeries.value) {
      return [];
    }

    return flightSeries.value.vehicleGroups.reduce(
      (cars, group) =>
        cars.filter((car) => !group.carIds.some((id) => id === car.id)),
      Object.values(carMap.value),
    );
  });

  const availablePeople = computed<Person[]>(() => {
    if (!flightLeg.value) {
      return [];
    }

    const assigned = Object.values(flightLeg.value.assignments).flatMap(
      (assignment) => [assignment.operatorId, ...assignment.passengerIds],
    );

    return Object.values(personMap.value).filter(
      (person) => !assigned.includes(person.id),
    );
  });

  const history = computed<FlightLeg[]>(() => {
    if (!flightLegId.value) {
      return [];
    }

    const allFlightLegs = project.value?.flights.flatMap((f) => f.legs) ?? [];
    const endIndex = allFlightLegs.findIndex((f) => f.id === flightLegId.value);
    if (endIndex === -1) {
      return [];
    }

    return allFlightLegs.slice(0, endIndex);
  });

  const numberOfFlights = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};

    const balloonIds = project.value?.balloons.map((balloon) => balloon.id);

    for (const l of history.value) {
      for (const person of project.value.people) {
        const pid = person.id;
        if (!(pid in counts)) {
          counts[pid] = 0;
        }

        // check if this person is flying on any of the balloons
        const isFlying = balloonIds
          .map((id) => l.assignments[id])
          .some(
            (assignment) =>
              assignment.operatorId === pid ||
              assignment.passengerIds.some((pIds) => pIds === pid),
          );

        counts[pid] += isFlying ? 1 : 0;
      }
    }

    return counts;
  });

  async function smartFillFlight(options: SmartFillOptions) {
    const data: SmartFillPayload = {
      cars: flightSeries.value.carIds.map((id) => carMap.value[id]),
      balloons: flightSeries.value.balloonIds.map((id) => balloonMap.value[id]),
      people: flightSeries.value.personIds
        .map((id) => personMap.value[id])
        .map((person) => {
          const flights = numberOfFlights.value[person.id] ?? 0;

          return {
            ...person,
            flights: person.firstTime && flights === 0 ? -1 : flights,
          };
        }),
      groups: flightSeries.value?.vehicleGroups ?? [],
      history: history.value,
    };

    const payload = JSON.parse(JSON.stringify(data));

    // Remove all vue proxies
    // TODO Update group and assignment
    project.value.flights.find(
      (f) => f.id === flightSeries.value.id,
    ).vehicleGroups = await window.solverAPI.solveFlight(payload, options);
  }

  return {
    // Computed
    flightSeries,
    flightLeg,
    balloonMap,
    carMap,
    personMap,
    availableBalloons,
    availablePeople,
    availableCars,
    numberOfFlights,
    // Methods
    loadFlightLeg,
    createFlight,
    deleteFlightLeg,
    smartFillFlight,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
