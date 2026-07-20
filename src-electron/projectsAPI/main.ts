import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  dialog,
  shell,
} from 'electron';
import type { Project, ProjectMeta } from '@/../src-common/entities';
import {
  deleteProjectFromPath,
  projectFileExists,
  readProjectFromPath,
  writeProjectToPath,
} from '@/../src-electron/projectsAPI/file-utils';
import path from 'path';
import {
  addProjectMeta,
  getProjectIndex,
  projectFilePath,
  removeProjectMeta,
  updateProjectMeta,
} from '@/../src-electron/projectsAPI/index-store';
import log from 'electron-log';
import {
  getAppVersion,
  migrateProject,
} from '@/../src-electron/projectsAPI/migrations';

export default () => {
  ipcMain.handle('project:index', projectApiHandler.index);
  ipcMain.handle('project:show', projectApiHandler.show);
  ipcMain.handle('project:store', projectApiHandler.store);
  ipcMain.handle('project:update', projectApiHandler.update);
  ipcMain.handle('project:destroy', projectApiHandler.destroy);
  ipcMain.handle('project:remove', projectApiHandler.remove);
  ipcMain.on('project:open-file', projectApiHandler.openFile);
  ipcMain.on('project:reveal', projectApiHandler.reveal);

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

  const raw = await readProjectFromPath(fullFilePath);
  let project = migrateProject(raw);

  const projectIndex = getProjectIndex();

  const conflict = projectIndex.some(
    (meta) => meta.id === project.id && meta.filePath !== fullFilePath,
  );

  if (conflict) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Project already exists',
      message: 'A project with the same ID already exists.',
      detail:
        'Would you like to generate a new ID for this file or overwrite the existing entry?',
      buttons: ['Generate New ID', 'Overwrite Existing', 'Cancel'],
      cancelId: 2,
      defaultId: 0,
    });

    if (result.response === 2) {
      return;
    }

    if (result.response === 0) {
      project = {
        ...project,
        id: crypto.randomUUID(),
      };

      await writeProjectToPath(project, fullFilePath);
    }
  }

  const meta: ProjectMeta = {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    filePath: fullFilePath,
  };

  const isExisting = projectIndex.some((m) => m.id === project.id);
  if (isExisting) {
    updateProjectMeta(meta);
  } else {
    addProjectMeta(meta);
  }

  BrowserWindow.getAllWindows()
    .filter((win) => !win.isDestroyed())
    .forEach((win) => {
      win.webContents.send('project:request-open', project);
    });
}

const handleInvokeEvent = <Args extends unknown[], Result>(
  next: (...args: Args) => Result,
) => {
  return (_event: IpcMainInvokeEvent, ...args: Args) => {
    return next(...args);
  };
};

const handleEvent = <Args extends unknown[]>(next: (...args: Args) => void) => {
  return (_event: IpcMainEvent, ...args: Args): void => {
    next(...args);
  };
};

const projectApiHandler = {
  index: handleInvokeEvent(index),
  show: handleInvokeEvent(load),
  store: handleInvokeEvent(store),
  update: handleInvokeEvent(update),
  destroy: handleInvokeEvent(destroy),
  remove: handleInvokeEvent(remove),
  openFile: handleEvent(() => void openFile()),
  reveal: handleEvent(reveal),
};

// `exists` is derived on every read instead of being stored, so entries whose
// file was moved or deleted outside the app are detected.
async function index(): Promise<ProjectMeta[]> {
  return Promise.all(
    getProjectIndex().map(async (meta) => ({
      ...meta,
      exists: await projectFileExists(meta.filePath),
    })),
  );
}

function reveal(id: string) {
  try {
    shell.showItemInFolder(projectFilePath(id));
  } catch (err: unknown) {
    log.error(`Failed to reveal project ${id}`, err);
  }
}

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
