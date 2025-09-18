import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';
import { isDefined } from 'src/util/is-defined';
import { useProjectStore } from 'stores/project';
import type {
  FlightLeg,
  FlightSeries,
  ID,
  Project,
} from 'app/src-common/entities';
import type { SolveFlightLegOptions } from 'app/src-common/api/solver.api';

export function useSolver() {
  const projectStore = useProjectStore();
  const flightStore = useFlightStore();

  const { project } = storeToRefs(projectStore);
  const { flightLeg, flightSeries, carMap, balloonMap, personMap } =
    storeToRefs(flightStore);

  async function solve(options?: SolveFlightLegOptions) {
    if (!project.value || !flightSeries.value || !flightLeg.value) {
      throw new Error('No project, flight series or flight leg selected');
    }

    if (
      flightSeries.value.legs.findIndex((l) => l.id === flightLeg.value?.id) <=
      0
    ) {
      await solveVehicleGroups();
    }

    await solveFlightLeg(options);
  }

  async function solveVehicleGroups() {
    if (!project.value || !flightSeries.value) {
      throw new Error('No project, flight series or flight leg selected');
    }

    const balloons = flightSeries.value.balloonIds
      .map((id) => balloonMap.value[id])
      .filter(isDefined);

    const cars = flightSeries.value.carIds
      .map((id) => carMap.value[id])
      .filter(isDefined);

    const vehicleGroups = flightSeries.value.vehicleGroups.reduce<
      Record<string, string[]>
    >((acc, group) => {
      acc[group.balloonId] = group.carIds;
      return acc;
    }, {});

    const peopleCount = flightSeries.value.personIds.length;

    const response = await window.solverAPI.solveVehicleGroups(
      cl({
        balloons,
        cars,
        vehicleGroups,
        peopleCount,
      }),
    );

    console.log(response);

    flightSeries.value.vehicleGroups = Object.entries(
      response.vehicleGroups,
    ).map(([balloonId, carIds]) => ({
      balloonId,
      carIds,
    }));
  }

  async function solveFlightLeg(options?: SolveFlightLegOptions) {
    if (!project.value || !flightSeries.value || !flightLeg.value) {
      throw new Error('No project, flight series or flight leg selected');
    }

    const balloons = flightSeries.value.balloonIds
      .map((id) => balloonMap.value[id])
      .filter(isDefined);

    const cars = flightSeries.value.carIds
      .map((id) => carMap.value[id])
      .filter(isDefined);

    const numberOfFlights = countFlightsBeforeFlightLeg(
      project.value,
      flightSeries.value,
      flightLeg.value,
    );

    const people = flightSeries.value.personIds
      .map((id) => personMap.value[id])
      .filter(isDefined)
      .map((person) => ({
        ...person,
        flightsSoFar: numberOfFlights[person.id] ?? 0,
      }));

    const vehicleGroups = flightSeries.value.vehicleGroups.reduce<
      Record<string, string[]>
    >((acc, group) => {
      acc[group.balloonId] = group.carIds;
      return acc;
    }, {});

    const preAssignments = flightLeg.value.assignments;

    const groupHistory = buildGroupHistory(
      project.value,
      flightSeries.value.id,
    );

    const fixedGroups =
      flightSeries.value.legs.findIndex(
        (leg) => leg.id === flightLeg.value?.id,
      ) > 0
        ? buildFixedGroups(flightSeries.value)
        : undefined;

    const response = await window.solverAPI.solveFlightLeg(
      cl({
        balloons,
        cars,
        people,
        vehicleGroups,
        preAssignments,
        groupHistory,
        fixedGroups,
        options,
      }),
    );

    flightLeg.value.assignments = response.assignments;
  }

  return {
    solve,
    solveVehicleGroups,
    solveFlightLeg,
  };
}

function cl<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function countFlightsBeforeFlightLeg(
  project: Project,
  series: FlightSeries,
  leg: FlightLeg,
) {
  const seriesIndex = project.flights.findIndex((s) => s.id === series.id);
  if (seriesIndex === -1) {
    throw new Error('Flight series not found in project');
  }
  const pastLegs = project.flights
    .slice(0, seriesIndex)
    .flatMap((flight) => flight.legs);

  const legIndex = series.legs.indexOf(leg);
  if (legIndex === -1) {
    throw new Error('Flight leg not found in flight series');
  }
  pastLegs.push(...series.legs.slice(0, legIndex));

  return project.people.reduce<Record<string, number>>((acc, person) => {
    const flownLegs = pastLegs.filter((leg) => {
      return Object.values(leg.assignments).some((assignment) => {
        return (
          assignment.operatorId === person.id ||
          assignment.passengerIds.includes(person.id)
        );
      });
    });

    acc[person.id] = flownLegs.length;
    return acc;
  }, {});
}

function buildGroupHistory(
  project: Project,
  seriesId: string,
): Record<ID, ID[]> {
  return project.flights
    .filter((series) => series.legs.length > 0 && series.id !== seriesId)
    .reduce<Record<ID, ID[]>>((acc, series) => {
      buildGroupPairs(series).forEach(([pid, gid]) => {
        (acc[pid] ??= []).push(gid);
      });

      return acc;
    }, {});
}

export function buildFixedGroups(series: FlightSeries): Record<ID, ID> {
  return buildGroupPairs(series).reduce<Record<ID, ID>>((map, [pid, gid]) => {
    if (!(pid in map)) {
      map[pid] = gid;
    }
    return map;
  }, {});
}

function buildGroupPairs(series: FlightSeries) {
  const leg = series.legs[0];
  if (!leg) {
    return [];
  }

  const vehToGroup = series.vehicleGroups.reduce<Record<ID, ID>>((acc, g) => {
    acc[g.balloonId] = g.balloonId;
    g.carIds.forEach((cid) => (acc[cid] = g.balloonId));
    return acc;
  }, {});

  // Collect [personId, groupId] pairs from this leg
  return Object.entries(leg.assignments).flatMap(([vehicleId, a]) => {
    const groupId = vehToGroup[vehicleId];
    if (!groupId) {
      return [];
    }
    return [a.operatorId, ...a.passengerIds]
      .filter((pid): pid is ID => !!pid)
      .map((pid) => [pid, groupId] as const);
  });
}
