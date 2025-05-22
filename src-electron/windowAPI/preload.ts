import { ipcRenderer } from 'electron';
import type { WindowAPI } from 'app/src-common/WindowAPI';

const api: WindowAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  openDevTools: () => ipcRenderer.send('window:open-dev-tools'),
};

export default api;
