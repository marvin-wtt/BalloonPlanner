import { ipcRenderer } from 'electron';

const api = {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  openDevTools: () => ipcRenderer.send('window:open-dev-tools'),
};

export default api;
