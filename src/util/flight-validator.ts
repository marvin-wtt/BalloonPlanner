import type { FlightLeg, FlightSeries, Project } from 'app/src-common/entities';
import { NULL_ID } from 'app/src-common/constants';

// Uses exactly your given types
export function validateFlightLegAndSeries(
  project: Project,
  series: FlightSeries,
  leg: FlightLeg,
): string | null {
  // --- quick helpers ---
  const toSet = <T extends string | number>(arr: T[]) => new Set(arr);
  const firstDuplicate = (arr: string[]) => {
    const seen = new Set<string>();
    for (const x of arr) {
      if (seen.has(x)) return x;
      seen.add(x);
    }
    return null;
  };

  const mapNames = (arr: { id: string; name: string }[]) =>
    arr.reduce<Record<string, string>>((acc, x) => {
      acc[x.id] = x.name;
      return acc;
    }, {});
  const carNameMap = mapNames(project.cars);
  const balloonNameMap = mapNames(project.balloons);
  const personNameMap = mapNames(project.people);

  const seriesBalloonSet = toSet(series.balloonIds);
  const seriesCarSet = toSet(series.carIds);
  const seriesPersonSet = toSet(series.personIds);

  // =========================
  // 1) Validate vehicle groups
  // =========================

  // 1a) Balloons: coverage == exactly once, and membership
  const groupBalloonIds = series.vehicleGroups.map((g) => g.balloonId);

  // membership
  for (const b of groupBalloonIds) {
    if (!seriesBalloonSet.has(b) && b !== NULL_ID) {
      return `Vehicle group references unknown balloon '${balloonNameMap[b] ?? b}' (not in series).`;
    }
  }

  // duplicates among group balloonIds?
  const dupBalloon = firstDuplicate(groupBalloonIds);
  if (dupBalloon) {
    return `Balloon '${balloonNameMap[dupBalloon] ?? dupBalloon}' appears in more than one vehicle group.`;
  }

  // 1b) Cars: each appears exactly once overall and membership + coverage
  const allGroupedCarIds = series.vehicleGroups.flatMap((g) => g.carIds);

  // per-group duplicates
  for (const g of series.vehicleGroups) {
    const dupInGroup = firstDuplicate(g.carIds);
    if (dupInGroup) {
      return `Car '${carNameMap[dupInGroup] ?? dupInGroup}' appears multiple times within the group of balloon '${balloonNameMap[g.balloonId] ?? g.balloonId}'.`;
    }
  }

  // membership
  for (const c of allGroupedCarIds) {
    if (!seriesCarSet.has(c)) {
      return `Car '${carNameMap[c] ?? c}' in vehicle groups is not part of the series.`;
    }
  }

  // cross-group duplicates
  const dupCar = firstDuplicate(allGroupedCarIds);
  if (dupCar) {
    return `Car '${carNameMap[dupCar] ?? dupCar}' appears in more than one vehicle group.`;
  }

  // ==================================
  // 2) Validate assignments for the leg
  // ==================================
  const allVehicleIds = new Set<string>([
    ...series.balloonIds,
    ...series.carIds,
  ]);

  // 2a) Assigned vehicles must exist in series
  for (const vehicleId of Object.keys(leg.assignments)) {
    if (!allVehicleIds.has(vehicleId) && vehicleId !== NULL_ID) {
      return `Assignment references unknown vehicle '${balloonNameMap[vehicleId] ?? carNameMap[vehicleId] ?? vehicleId}' (not in series).`;
    }
  }

  // 2b) Each person at most once (operator + passengers) and must be in series
  const seenPeople = new Set<string>();

  for (const [vehicleId, assignment] of Object.entries(leg.assignments)) {
    const { operatorId, passengerIds } = assignment;

    // operator membership + uniqueness
    if (operatorId !== null) {
      if (!seriesPersonSet.has(operatorId)) {
        return `Operator '${personNameMap[operatorId] ?? operatorId}' in vehicle '${balloonNameMap[vehicleId] ?? carNameMap[vehicleId] ?? vehicleId}' is not part of the series.`;
      }
      if (seenPeople.has(operatorId)) {
        return `Person '${personNameMap[operatorId] ?? operatorId}' is assigned more than once (as operator or passenger).`;
      }
      seenPeople.add(operatorId);
    }

    // passenger list may not contain duplicates
    const dupPassengerInVehicle = firstDuplicate(passengerIds);
    if (dupPassengerInVehicle) {
      return `Passenger '${personNameMap[dupPassengerInVehicle] ?? dupPassengerInVehicle}' appears multiple times in vehicle '${balloonNameMap[vehicleId] ?? carNameMap[vehicleId] ?? vehicleId}'.`;
    }

    // passenger membership + global uniqueness
    for (const pid of passengerIds) {
      if (!seriesPersonSet.has(pid)) {
        return `Passenger '${personNameMap[pid] ?? pid}' in vehicle '${balloonNameMap[vehicleId] ?? carNameMap[vehicleId] ?? vehicleId}' is not part of the series.`;
      }
      if (seenPeople.has(pid)) {
        return `Person '${personNameMap[pid] ?? pid}' is assigned more than once (as operator or passenger).`;
      }
      seenPeople.add(pid);
    }
  }

  // If you want to ensure every series person is either unassigned or assigned once,
  // the checks above already enforce "at most once". We do not enforce "at least once".

  return null;
}
