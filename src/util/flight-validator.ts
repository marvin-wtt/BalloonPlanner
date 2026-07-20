import type {
  FlightLeg,
  FlightSeries,
  Project,
} from '@/../src-common/entities';
import { NULL_ID } from '@/../src-common/constants';

export interface FlightValidationResult {
  message: string;
  fix: (() => void) | null;
}

function firstDuplicate(arr: string[]): string | null {
  const seen = new Set<string>();
  for (const x of arr) {
    if (seen.has(x)) return x;
    seen.add(x);
  }
  return null;
}

function nameMap(arr: { id: string; name: string }[]): Record<string, string> {
  return Object.fromEntries(arr.map(({ id, name }) => [id, name]));
}

export function validateFlightLegAndSeries(
  project: Project,
  series: FlightSeries,
  leg: FlightLeg,
): FlightValidationResult | null {
  const balloonNames = nameMap(project.balloons);
  const carNames = nameMap(project.cars);
  const personNames = nameMap(project.people);

  const seriesBalloons = new Set(series.balloonIds);
  const seriesCars = new Set(series.carIds);
  const seriesPeople = new Set(series.personIds);

  const err = (
    message: string,
    fix: (() => void) | null = null,
  ): FlightValidationResult => ({ message, fix });

  function validateGroups(): FlightValidationResult | null {
    const groupBalloonIds = series.vehicleGroups.map((g) => g.balloonId);

    for (const balloonId of groupBalloonIds) {
      if (!seriesBalloons.has(balloonId) && balloonId !== NULL_ID) {
        return err(
          `Vehicle group references balloon '${balloonNames[balloonId] ?? balloonId}' that is not in this series.`,
          () => {
            const idx = series.vehicleGroups.findIndex(
              (g) => g.balloonId === balloonId,
            );
            if (idx >= 0) {
              series.vehicleGroups.splice(idx, 1);
            }
          },
        );
      }
    }

    const dupBalloon = firstDuplicate(groupBalloonIds);
    if (dupBalloon) {
      return err(
        `Balloon '${balloonNames[dupBalloon] ?? dupBalloon}' appears in more than one vehicle group.`,
        () => {
          const firstIdx = series.vehicleGroups.findIndex(
            (g) => g.balloonId === dupBalloon,
          );
          for (let i = series.vehicleGroups.length - 1; i > firstIdx; i--) {
            if (series.vehicleGroups[i]?.balloonId === dupBalloon) {
              series.vehicleGroups.splice(i, 1);
            }
          }
        },
      );
    }

    for (const group of series.vehicleGroups) {
      const dupCar = firstDuplicate(group.carIds);
      if (dupCar) {
        return err(
          `Car '${carNames[dupCar] ?? dupCar}' appears multiple times in the group for balloon '${balloonNames[group.balloonId] ?? group.balloonId}'.`,
          () => {
            group.carIds = [...new Set(group.carIds)];
          },
        );
      }
    }

    const allGroupedCarIds = series.vehicleGroups.flatMap((g) => g.carIds);

    for (const carId of allGroupedCarIds) {
      if (!seriesCars.has(carId)) {
        return err(
          `Car '${carNames[carId] ?? carId}' in a vehicle group is not part of this series.`,
          () => {
            for (const group of series.vehicleGroups) {
              const idx = group.carIds.indexOf(carId);
              if (idx >= 0) {
                group.carIds.splice(idx, 1);
              }
            }
          },
        );
      }
    }

    const dupCar = firstDuplicate(allGroupedCarIds);
    if (dupCar) {
      return err(
        `Car '${carNames[dupCar] ?? dupCar}' appears in more than one vehicle group.`,
        () => {
          let kept = false;
          for (const group of series.vehicleGroups) {
            if (!kept && group.carIds.includes(dupCar)) {
              kept = true;
            } else {
              const idx = group.carIds.indexOf(dupCar);
              if (idx >= 0) {
                group.carIds.splice(idx, 1);
              }
            }
          }
        },
      );
    }

    return null;
  }

  function validateAssignments(): FlightValidationResult | null {
    const allSeriesVehicles = new Set([...series.balloonIds, ...series.carIds]);
    const usedVehicles = new Set(
      series.vehicleGroups.flatMap((g) => [g.balloonId, ...g.carIds]),
    );

    for (const vehicleId of Object.keys(leg.assignments)) {
      if (!allSeriesVehicles.has(vehicleId) && vehicleId !== NULL_ID) {
        const vehicleName =
          balloonNames[vehicleId] ?? carNames[vehicleId] ?? vehicleId;
        return err(
          `Assignment references vehicle '${vehicleName}' that is not part of this series.`,
          () => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete leg.assignments[vehicleId];
          },
        );
      }
    }

    const seenPeople = new Set<string>();

    for (const [vehicleId, assignment] of Object.entries(leg.assignments)) {
      const vehicleName =
        balloonNames[vehicleId] ?? carNames[vehicleId] ?? vehicleId;
      const { operatorId, passengerIds } = assignment;

      if (!usedVehicles.has(vehicleId)) {
        if (operatorId !== null) {
          return err(
            `'${personNames[operatorId] ?? operatorId}' is assigned to vehicle '${vehicleName}' which is not in any group.`,
            () => {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete leg.assignments[vehicleId];
            },
          );
        }
        if (passengerIds.length > 0) {
          const names = passengerIds
            .map((pid) => personNames[pid] ?? pid)
            .join(', ');
          return err(
            `${names} ${passengerIds.length === 1 ? 'is' : 'are'} assigned to vehicle '${vehicleName}' which is not in any group.`,
            () => {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete leg.assignments[vehicleId];
            },
          );
        }
      }

      if (operatorId !== null) {
        if (!seriesPeople.has(operatorId)) {
          return err(
            `Operator '${personNames[operatorId] ?? operatorId}' of '${vehicleName}' is not part of this series.`,
            () => {
              assignment.operatorId = null;
            },
          );
        }
        if (seenPeople.has(operatorId)) {
          return err(
            `'${personNames[operatorId] ?? operatorId}' is assigned to more than one vehicle.`,
            () => {
              assignment.operatorId = null;
            },
          );
        }
        seenPeople.add(operatorId);
      }

      const dupPassenger = firstDuplicate(passengerIds);
      if (dupPassenger) {
        return err(
          `Passenger '${personNames[dupPassenger] ?? dupPassenger}' appears multiple times in vehicle '${vehicleName}'.`,
          () => {
            assignment.passengerIds = [...new Set(assignment.passengerIds)];
          },
        );
      }

      for (const pid of passengerIds) {
        if (!seriesPeople.has(pid)) {
          return err(
            `Passenger '${personNames[pid] ?? pid}' in '${vehicleName}' is not part of this series.`,
            () => {
              const idx = assignment.passengerIds.indexOf(pid);
              if (idx >= 0) {
                assignment.passengerIds.splice(idx, 1);
              }
            },
          );
        }
        if (seenPeople.has(pid)) {
          return err(
            `'${personNames[pid] ?? pid}' is assigned to more than one vehicle.`,
            () => {
              const idx = assignment.passengerIds.indexOf(pid);
              if (idx >= 0) {
                assignment.passengerIds.splice(idx, 1);
              }
            },
          );
        }
        seenPeople.add(pid);
      }
    }

    return null;
  }

  return validateGroups() ?? validateAssignments();
}
