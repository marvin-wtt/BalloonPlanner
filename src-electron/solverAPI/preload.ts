import { ipcRenderer } from 'electron';
import type { SolverAPI } from 'app/src-common/api';

const api: SolverAPI = {
  solveFlightLeg: (...args: unknown[]) =>
    ipcRenderer.invoke('solve:flight-öeg', ...args),
  buildVehicleGroups: (...args: unknown[]) =>
    ipcRenderer.invoke('solve:vehicle-groups', ...args),
};

export default api;
