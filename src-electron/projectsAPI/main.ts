import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainEvent,
  dialog,
} from 'electron';
import type { Project } from 'app/src-common/entities';
import {
  deleteProjectFromPath,
  readProjectFromPath,
  writeProjectToPath,
} from 'app/src-electron/projectsAPI/file-utils';
import path from 'path';
import {
  addProjectMeta,
  getProjectIndex,
  projectFilePath,
  removeProjectMeta,
  updateProjectMeta,
} from 'app/src-electron/projectsAPI/index-store';
import log from 'electron-log';
import {
  getAppVersion,
  migrateProject,
} from 'app/src-electron/projectsAPI/migrations';

export default () => {
  ipcMain.handle('project:index', projectApiHandler.index);
  ipcMain.handle('project:show', projectApiHandler.show);
  ipcMain.handle('project:store', projectApiHandler.store);
  ipcMain.handle('project:update', projectApiHandler.update);
  ipcMain.handle('project:destroy', projectApiHandler.destroy);
  ipcMain.handle('project:remove', projectApiHandler.remove);
  ipcMain.on('project:open-file', projectApiHandler.openFile);

  ipcMain.on('project:ready', () => {
    loadFromArgs(process.argv).catch((err: unknown) => {
      log.error(
        `Failed to load project from process args: ${process.argv.join(' | ')}`,
        err,
      );
    });
  });

  app.on('open-file', (_event, fullFilePath) => {
    loadExternalFile(fullFilePath).catch((err: unknown) => {
      log.error(`Failed to load project from file: ${fullFilePath}`, err);
    });
  });

  app.on('second-instance', (_event, argv) => {
    loadFromArgs(argv).catch((err: unknown) => {
      log.error(`Failed to load project from args: ${argv.join(' | ')}`, err);
    });
  });
};

async function loadFromArgs(argv: string[]) {
  for (let i = 1; i < argv.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const arg = argv[i]!;

    if (arg.startsWith('-')) {
      continue;
    }

    if (arg.endsWith('.bpp') || arg.endsWith('.json')) {
      await loadExternalFile(arg);
      break;
    }
  }
}

async function loadExternalFile(fullFilePath: string) {
  log.info(`Loading project from external file: ${fullFilePath}`);

  const project = await readProjectFromPath(fullFilePath);

  const conflict = getProjectIndex().find(
    (meta) => meta.id === project.id || meta.filePath === fullFilePath,
  );

  const meta = {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    filePath: fullFilePath,
  };

  if (conflict) {
    log.info(
      `Project with id ${project.id} or file path ${fullFilePath} already exists. Updating index.`,
    );
    updateProjectMeta(meta);
  } else {
    addProjectMeta(meta);
  }

  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.isDestroyed()) {
      return;
    }

    win.webContents.send('project:request-open', project);
  });
}

const handleEvent = (next: (...args: unknown[]) => unknown) => {
  return (_event: IpcMainEvent, ...args: unknown[]) => {
    return next(...args);
  };
};

const projectApiHandler = {
  index: handleEvent(getProjectIndex),
  show: handleEvent(load),
  store: handleEvent(store),
  update: handleEvent(update),
  destroy: handleEvent(destroy),
  remove: handleEvent(remove),
  openFile: handleEvent(openFile),
};

async function store(project: Project) {
  const projectDir = app.getPath('userData');
  const fileName = `project-${project.id}.bpp`;
  const fullPath = path.join(projectDir, fileName);

  project.version = getAppVersion();

  addProjectMeta({
    ...project,
    filePath: fullPath,
  });

  await writeProjectToPath(project, fullPath);
}

async function load(id: string) {
  const filePath = projectFilePath(id);

  const data = await readProjectFromPath(filePath);

  return migrateProject(data);
}

async function update(project: Project) {
  const filePath = projectFilePath(project.id);

  await writeProjectToPath(project, filePath);

  updateProjectMeta({
    ...project,
    filePath,
  });
}

async function destroy(id: string) {
  const filePath = projectFilePath(id);

  removeProjectMeta(id);

  await deleteProjectFromPath(filePath);
}

function remove(id: string) {
  removeProjectMeta(id);
}

async function openFile() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    buttonLabel: 'Open',
    filters: [{ name: 'Projects', extensions: ['bpp', 'json'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fullFilePath = result.filePaths[0]!;
  await loadExternalFile(fullFilePath);
}
