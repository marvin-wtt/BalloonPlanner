import { ipcRenderer } from 'electron';

const api = {
  run: () => ipcRenderer.invoke('solver:run'),
};

export default api;
