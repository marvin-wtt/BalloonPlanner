import type { Project } from 'app/src-common/entities';
import semver from 'semver';
import { app } from 'electron';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProject = Record<string, any>;

type Migration = (data: AnyProject) => AnyProject;

const migrations: Record<string, Migration> = {
  '1.0.0-beta-12': (data): Pick<Project, 'flights'> => {
    // Create flight legs and separate groups and assignments
    return {
      ...data,
      flights: data.flights.map((flight) => ({
        ...flight,
        vehicleGroups: flight.vehicleGroups.map((group) => ({
          balloonId: group.balloon.id,
          carIds: group.cars.map((car) => car.id),
        })),
        legs: [
          {
            id: crypto.randomUUID(),
            assignments: flight.vehicleGroups.reduce((map, group) => {
              map[group.balloon.id] = {
                operatorId: group.balloon.operatorId,
                passengerIds: group.balloon.passengerIds,
              };
              group.cars.forEach((car) => {
                map[car.id] = {
                  operatorId: car.operatorId,
                  passengerIds: car.passengerIds,
                };
              });
              return map;
            }, {}),
          },
        ],
      })),
    };
  },
  '1.0.0-beta-13': (data) => {
    return {
      ...data,
      flights: data.flights.map((flight) => ({
        ...flight,
        legs: flight.legs.map((leg) => ({
          ...leg,
          canceledBalloonIds: [],
        })),
      })),
    };
  },
};

export function getAppVersion() {
  return app.isPackaged
    ? app.getVersion()
    : (Object.keys(migrations).sort(semver.compare).pop() ?? '0.0.0');
}

export function migrateProject(data: AnyProject): Project {
  if (typeof data !== 'object') {
    throw new Error('Invalid project data');
  }

  // Use the app version if available, otherwise use the latest migration version
  const appVersion = getAppVersion();
  const version: string = data.version ?? '0.0.0';

  if (semver.gt(version, appVersion)) {
    throw new Error(
      `Project version ${version} is higher than app version ${appVersion}. Please update the app.`,
    );
  }

  Object.keys(migrations)
    .sort(semver.compare)
    .filter((v) => semver.gt(v, version))
    .map((version) => migrations[version])
    .filter((migration): migration is Migration => !!migration)
    .forEach((migration) => {
      data = migration(data);
    });

  data.version = appVersion;

  return data as Project;
}
