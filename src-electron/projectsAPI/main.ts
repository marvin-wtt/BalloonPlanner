import { ipcMain, type IpcMainEvent } from 'electron';
import Store from 'electron-store';
import fse from 'fs-extra';
import type { Project, ProjectMeta } from 'app/src-common/entities';

export default () => {
  ipcMain.handle('project:index', projectApiHandler.index);
  ipcMain.handle('project:show', projectApiHandler.show);
  ipcMain.handle('project:store', projectApiHandler.store);
  ipcMain.handle('project:update', projectApiHandler.update);
  ipcMain.handle('project:destroy', projectApiHandler.destroy);
};

const handleEvent = (next: (...args: unknown[]) => void) => {
  return (_event: IpcMainEvent, ...args: unknown[]) => {
    return next(...args);
  };
};

const projectApiHandler = {
  index: handleEvent(list),
  show: handleEvent(load),
  store: handleEvent(create),
  update: handleEvent(update),
  destroy: handleEvent(remove),
};

const indexStore = new Store<{
  metas: ProjectMeta[];
}>({ name: 'projects-index' }); // → projects-index.json

const cache = new Map();
function projStore(id: string) {
  if (!cache.has(id)) {
    const store = new Store({
      name: `project-${id}`,
      defaults: {},
    });

    cache.set(id, store);
  }

  return cache.get(id);
}

function list() {
  return indexStore.get('metas', []);
}

function create(project: Project) {
  const metas = list();

  if (metas.findIndex((meta) => meta.id === project.id) !== -1) {
    throw new Error(`Project with id ${project.id} already exists`);
  }
  metas.push({
    id: project.id,
    name: project.name,
    description: project.description,
  });
  indexStore.set('metas', metas);

  projStore(project.id).store = project;
}

function load(id: string) {
  return projStore(id).store ?? null;
}

function update(project: Project) {
  projStore(project.id).store = project;

  // Update meta
  const metas = list();
  metas.splice(
    metas.findIndex((meta) => meta.id === project.id),
    1,
    {
      id: project.id,
      name: project.name,
      description: project.description,
    },
  );

  indexStore.set('metas', metas);
}

function remove(id: string) {
  const store = projStore(id);
  const file = store.path;

  cache.delete(id);

  try {
    fse.unlinkSync(file);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  const metas = list().filter((m) => m.id !== id);
  indexStore.set('metas', metas);
}
