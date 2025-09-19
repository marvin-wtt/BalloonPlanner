import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import type {
  Balloon,
  Car,
  FlightSeries,
  Person,
  FlightLeg,
  ID,
  VehicleAssignmentMap,
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
    if (!project.value || !flightSeries.value) {
      return {};
    }

    return project.value.balloons
      .filter(({ id }) => flightSeries.value?.balloonIds.includes(id))
      .reduce(
        (balloons, balloon) => ({
          ...balloons,
          [balloon.id]: balloon,
        }),
        {},
      );
  });

  const carMap = computed<Record<string, Car>>(() => {
    if (!project.value || !flightSeries.value) {
      return {};
    }

    return project.value.cars
      .filter(({ id }) => flightSeries.value?.carIds.includes(id))
      .reduce(
        (cars, car) => ({
          ...cars,
          [car.id]: car,
        }),
        {},
      );
  });

  const personMap = computed<Record<string, Person>>(() => {
    if (!project.value || !flightSeries.value) {
      return {};
    }

    return project.value.people
      .filter(({ id }) => flightSeries.value?.personIds.includes(id))
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

  function loadLastFlight() {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const allFlightLegs = project.value.flights.flatMap((f) => f.legs);
    if (allFlightLegs.length === 0) {
      flightLegId.value = undefined;
      return;
    }

    const lastFlightLeg = allFlightLegs[allFlightLegs.length - 1];
    if (!lastFlightLeg) {
      flightLegId.value = undefined;
      return;
    }

    flightLegId.value = lastFlightLeg.id;
  }

  function createFlightLeg(
    seriesId: string,
    leg: Partial<FlightLeg>,
  ): FlightLeg {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const series = project.value.flights.find((f) => f.id === seriesId);
    if (!series) {
      throw new Error('Flight series not found');
    }

    const newLeg: FlightLeg = {
      id: crypto.randomUUID(),
      assignments: leg.assignments ?? {},
      canceledBalloonIds: [],
    };

    series.legs.push(newLeg);

    return newLeg;
  }

  function createFlightSeries(
    seriesData?: Partial<Omit<FlightSeries, 'id'>>,
    assignments?: VehicleAssignmentMap,
  ): FlightSeries {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const leg = seriesData?.legs?.[0] ?? {
      id: crypto.randomUUID(),
      assignments: assignments ?? {},
      canceledBalloonIds: [],
    };

    const newFlight = {
      id: crypto.randomUUID(),
      date: seriesData?.date ?? new Date().toISOString(),
      vehicleGroups: seriesData?.vehicleGroups ?? [],
      legs: [leg],
      carIds: seriesData?.carIds ?? project.value.cars.map(({ id }) => id),
      balloonIds:
        seriesData?.balloonIds ?? project.value.balloons.map(({ id }) => id),
      personIds:
        seriesData?.personIds ?? project.value.people.map(({ id }) => id),
    };

    project.value.flights.push(newFlight);

    return newFlight;
  }

  function deleteFlightLeg(flightId: string) {
    if (!project.value) {
      throw new Error('Project not loaded');
    }
    if (!flightSeries.value) {
      throw new Error('Flight leg not loaded');
    }

    const series = project.value.flights.find((f) =>
      f.legs.some((leg) => leg.id === flightId),
    );
    if (!series) {
      throw new Error('Flight series not found');
    }

    const legIndex = flightSeries.value.legs.findIndex(
      (leg) => leg.id === flightId,
    );
    if (legIndex < 0) {
      // This should never happen since the series was found
      throw new Error('Flight leg not found: ' + flightId);
    }

    series.legs.splice(legIndex, 1);

    if (series.legs.length === 0) {
      deleteFlightSeries(series.id);
      loadLastFlight();
      return;
    }

    // Reset store if the current flight is loaded
    if (flightLegId.value === flightId) {
      const leg = series.legs[series.legs.length - 1];
      if (!leg) {
        // This should never happen since we checked the length above
        flightLegId.value = undefined;
        return;
      }
      flightLegId.value = leg.id;
    }
  }

  function mergeSeries(seriesIdA: string, seriesIdB: string) {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const seriesA = project.value.flights.find((f) => f.id === seriesIdA);
    const seriesB = project.value.flights.find((f) => f.id === seriesIdB);

    if (!seriesA || !seriesB) {
      throw new Error('Flight series not found');
    }

    // Merge available ids
    seriesA.carIds = [...new Set([...seriesA.carIds, ...seriesB.carIds])];
    seriesA.balloonIds = [
      ...new Set([...seriesA.balloonIds, ...seriesB.balloonIds]),
    ];
    seriesA.personIds = [
      ...new Set([...seriesA.personIds, ...seriesB.personIds]),
    ];

    // Append legs
    seriesA.legs.push(...seriesB.legs);

    deleteFlightSeries(seriesB.id);
  }

  function detachLeg(flightId: string) {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const series = project.value.flights.find((f) =>
      f.legs.some((leg) => leg.id === flightId),
    );
    if (!series) {
      return;
    }

    const leg = series.legs.find((leg) => leg.id === flightId);
    if (!leg) {
      return;
    }

    deleteFlightLeg(flightId);

    createFlightSeries({
      carIds: series.carIds,
      balloonIds: series.balloonIds,
      personIds: series.personIds,
      vehicleGroups: series.vehicleGroups,
      legs: [leg],
    });
  }

  function deleteFlightSeries(seriesId: string) {
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const seriesIndex = project.value.flights.findIndex(
      (f) => f.id === seriesId,
    );
    if (seriesIndex < 0) {
      return;
    }

    // Reset store if the current flight is loaded
    if (flightSeries.value?.id === seriesId) {
      flightLegId.value = undefined;
    }

    project.value.flights.splice(seriesIndex, 1);

    if (flightLegId.value === undefined) {
      loadLastFlight();
    }
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
    if (!project.value) {
      throw new Error('Project not loaded');
    }

    const counts: Record<string, number> = {};

    const balloonIds = project.value.balloons.map((balloon) => balloon.id);

    for (const l of history.value) {
      for (const person of project.value.people) {
        const pid = person.id;

        // check if this person is flying on any of the balloons
        const isFlying = balloonIds
          .filter((id) => !l.canceledBalloonIds.includes(id))
          .map((id) => l.assignments[id])
          .filter((assignment) => assignment !== undefined)
          .some(
            (assignment) =>
              assignment.operatorId === pid ||
              assignment.passengerIds.some((pIds) => pIds === pid),
          );

        counts[pid] = (counts[pid] ?? 0) + (isFlying ? 1 : 0);
      }
    }

    return counts;
  });

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
    createFlightLeg,
    createFlightSeries,
    detachLeg,
    mergeSeries,
    deleteFlightSeries,
    deleteFlightLeg,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
