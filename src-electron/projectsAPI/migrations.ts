import type { Project } from 'app/src-common/entities';
import semver from 'semver';
import { app } from 'electron';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProject = Record<string, any>;

type Migration = (data: AnyProject) => AnyProject;

const migrations: Record<string, Migration> = {
  // Add migrations here
};

export function migrateProject(data: AnyProject): Project {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid project data');
  }

  // Use app version if available, otherwise use the latest migration version
  const appVersion = app.isPackaged
    ? app.getVersion()
    : (Object.keys(migrations).sort(semver.compare).pop() ?? '0.0.0');

  const version = data.version ?? '0.0.0';

  if (semver.gt(version, appVersion)) {
    throw new Error(
      `Project version ${version} is higher than app version ${appVersion}. Please update the app.`,
    );
  }

  Object.keys(migrations)
    .sort(semver.compare)
    .filter((v) => semver.gt(v, version))
    .forEach((version) => {
      const migration = migrations[version];
      data = migration(data);
    });

  data.version = appVersion;

  return data as Project;
}
