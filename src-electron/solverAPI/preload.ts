import { ipcRenderer } from 'electron';

const api = {
  run: (...args: unknown[]) => ipcRenderer.invoke('solver:run', ...args),
};

export default api;
