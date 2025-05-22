import { ipcRenderer } from 'electron';
import type { SolverAPI } from 'app/src-common/api';

const api: SolverAPI = {
  solveFlight: (...args: unknown[]) =>
    ipcRenderer.invoke('solver:run', ...args),
};

export default api;
