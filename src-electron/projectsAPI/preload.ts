import type { ProjectsAPI } from 'app/src-common/api';
import { ipcRenderer } from 'electron';

const api: ProjectsAPI = {
  index: (...args: unknown[]) => ipcRenderer.invoke('project:index', ...args),
  show: (...args: unknown[]) => ipcRenderer.invoke('project:show', ...args),
  store: (...args: unknown[]) => ipcRenderer.invoke('project:store', ...args),
  update: (...args: unknown[]) => ipcRenderer.invoke('project:update', ...args),
  destroy: (...args: unknown[]) =>
    ipcRenderer.invoke('project:destroy', ...args),
  remove: (...args: unknown[]) => ipcRenderer.invoke('project:remove', ...args),
  onOpenRequest: (callback) => {
    ipcRenderer.on('project:request-open', (_event, id) => callback(id));

    ipcRenderer.send('project:ready');
  },
  openFile: (...args: unknown[]) =>
    ipcRenderer.send('project:open-file', ...args),
};

export default api;
